# Phase 10: Backend Services - Research

**Researched:** 2026-01-22
**Domain:** Symfony Service Layer Architecture, Controller Refactoring, Business Logic Extraction
**Confidence:** HIGH

## Summary

This phase extracts business logic from controllers into dedicated service classes. The current codebase has significant bloat: TaskController is 320 lines with CRUD operations, completion logic, recurring task generation, and tag management all inline. PlanningController is 257 lines mixing schedule generation orchestration with task updates. BrainDumpFacade at 333 lines handles AI analysis, duplicate detection, and daily note aggregation.

The key technical debt is the duplication of `matchesRecurrencePattern()` - this method exists identically in both TaskController (lines 305-318) and RecurringSyncService (lines 85-98). This violates DRY and creates maintenance risk.

Symfony's recommended pattern is "thin controllers, fat services" where controllers handle only HTTP concerns (request parsing, response formatting, authorization checks) and delegate all business logic to services. The existing service layer (TaskSplitService, TimeBlockService, RecurringSyncService) already follows this pattern well and can serve as templates.

**Primary recommendation:** Create TaskService to handle all task operations (CRUD, completion, recurring generation). Move `matchesRecurrencePattern()` to a RecurrenceService. Extract duplicate detection from BrainDumpFacade to DuplicateDetectionService. Controllers become thin wrappers calling services.

## Current State Analysis

### TaskController (320 lines - Target: <100 lines)

| Method | Lines | Business Logic | Service Target |
|--------|-------|----------------|----------------|
| `create()` | 30 | DailyNote creation, task creation | TaskService::create() |
| `update()` | 98 | Completion handling, recurring generation, field updates | TaskService::update() |
| `delete()` | 20 | Simple delete | TaskService::delete() |
| `assignTags()` | 48 | Tag sync | TaskService::assignTags() |
| `removeTag()` | 23 | Tag removal | TaskService::removeTag() |
| `findNextOccurrenceDate()` | 18 | Recurring logic | RecurrenceService |
| `matchesRecurrencePattern()` | 13 | **DUPLICATED** | RecurrenceService |

**Key observation:** The `update()` method at 98 lines contains:
- Completion state management (lines 96-117)
- Recurring task generation on completion (lines 107-116)
- Field updates for 8 different properties (lines 119-158)
- Flush and response (lines 160-174)

### PlanningController (257 lines - Target: <80 lines)

| Method | Lines | Business Logic | Service Target |
|--------|-------|----------------|----------------|
| `getTasks()` | 76 | Query orchestration, conflict detection, block matching | PlanningService::getTasksForPlanning() |
| `saveTaskPlanning()` | 51 | Task update with planning fields | TaskService::updatePlanningFields() |
| `generateSchedule()` | 40 | Schedule generation orchestration | Already uses PlanningScheduleGenerator |
| `acceptSchedule()` | 42 | Batch task updates | PlanningService::acceptSchedule() |

**Key observation:** Most inline serialization in `getTasks()` is planning-specific (hasConflict, conflictingEvent, matchingBlock). This was documented as intentional in Phase 9 verification.

### BrainDumpFacade (333 lines - Target: <200 lines)

| Method | Lines | Responsibility | Service Target |
|--------|-------|----------------|----------------|
| `analyze()` | 35 | AI orchestration | Keep in Facade |
| `saveAnalysis()` | 99 | Duplicate detection + persistence | DuplicateDetectionService |
| `getDailyNote()` | 4 | Simple query | Keep in Facade |
| `getDailyNoteData()` | 127 | Task aggregation + serialization | Keep in Facade (complex aggregation) |
| `timesOverlap()` | 22 | Time overlap detection | DuplicateDetectionService |

**Key observation:** The duplicate detection logic (lines 96-166) handles four entity types with different comparison strategies:
- Tasks: title comparison (case-insensitive)
- Events: title + time overlap
- Journal entries: content comparison
- Notes: content comparison

This is 70+ lines of pure business logic that belongs in a service.

### matchesRecurrencePattern() Duplication

**Location 1:** TaskController lines 305-318
```php
private function matchesRecurrencePattern(RecurringTask $recurringTask, \DateTimeInterface $date): bool
{
    $dayOfWeek = (int) $date->format('w');
    $dayOfMonth = (int) $date->format('j');
    $startDayOfWeek = (int) $recurringTask->getStartDate()->format('w');
    $startDayOfMonth = (int) $recurringTask->getStartDate()->format('j');

    return match ($recurringTask->getRecurrenceType()) {
        RecurrenceType::DAILY => true,
        RecurrenceType::WEEKLY => $dayOfWeek === $startDayOfWeek,
        RecurrenceType::WEEKDAYS => $dayOfWeek >= 1 && $dayOfWeek <= 5,
        RecurrenceType::MONTHLY => $dayOfMonth === $startDayOfMonth,
        RecurrenceType::CUSTOM => in_array($dayOfWeek, $recurringTask->getRecurrenceDays() ?? [], true),
    };
}
```

**Location 2:** RecurringSyncService lines 85-98 (identical except for CUSTOM handling)
```php
private function matchesRecurrencePattern(RecurringTask $recurringTask, \DateTimeInterface $date): bool
{
    // ... identical implementation
    RecurrenceType::CUSTOM => $this->matchesCustomPattern($recurringTask, $dayOfWeek),
};
```

**Resolution:** Consolidate into RecurrenceService with public method. Both TaskController and RecurringSyncService call RecurrenceService::matchesPattern().

## Standard Stack

### Services to Create

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| TaskService | All task CRUD and business logic | EntityManager, TaskRepository, DailyNoteRepository, TagRepository, RecurrenceService |
| RecurrenceService | Recurrence pattern matching and next date calculation | None (pure logic) |
| DuplicateDetectionService | Detect duplicates when saving analysis | None (pure logic) |
| PlanningService | Planning mode operations | TaskRepository, EventRepository, TimeBlockService |

### Existing Services (Keep/Enhance)

| Service | Current State | Phase 10 Changes |
|---------|--------------|------------------|
| RecurringSyncService | Has matchesRecurrencePattern | Use RecurrenceService instead |
| TaskSplitService | Well-structured | No changes |
| TimeBlockService | Well-structured | No changes |
| PlanningScheduleGenerator | AI integration | No changes |
| TaskEventConflictResolver | Conflict detection | No changes |
| TaskBlockMatchingService | Block matching | No changes |

## Architecture Patterns

### Recommended Service Structure
```
backend/src/
├── Service/
│   ├── TaskService.php           # NEW: Task CRUD + completion
│   ├── RecurrenceService.php     # NEW: Pattern matching + date finding
│   ├── DuplicateDetectionService.php # NEW: Duplicate detection
│   ├── PlanningService.php       # NEW: Planning operations
│   ├── RecurringSyncService.php  # EXISTING: Uses RecurrenceService
│   ├── TaskSplitService.php      # EXISTING: No changes
│   ├── TimeBlockService.php      # EXISTING: No changes
│   └── ...
```

### Pattern 1: Service with EntityManager
**What:** Service that performs persistence operations
**When to use:** Any service that creates, updates, or deletes entities
**Example:**
```php
// Source: Existing pattern from TaskSplitService, TimeBlockService
namespace App\Service;

use Doctrine\ORM\EntityManagerInterface;

class TaskService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TaskRepository $taskRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly TagRepository $tagRepository,
        private readonly RecurrenceService $recurrenceService,
    ) {
    }

    public function create(User $user, TaskCreateRequest $request): Task
    {
        $date = new \DateTime($request->date);
        $dailyNote = $this->getOrCreateDailyNote($user, $date);

        $task = new Task();
        $task->setTitle($request->title);
        $task->setDailyNote($dailyNote);

        if ($request->category !== null && TaskCategory::tryFrom($request->category) !== null) {
            $task->setCategory(TaskCategory::from($request->category));
        }

        if ($request->dueDate !== null) {
            $task->setDueDate(new \DateTime($request->dueDate));
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $task;
    }

    private function getOrCreateDailyNote(User $user, \DateTimeInterface $date): DailyNote
    {
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        return $dailyNote;
    }
}
```

### Pattern 2: Pure Logic Service
**What:** Service with no dependencies, only business logic
**When to use:** Pattern matching, validation, calculations
**Example:**
```php
// Consolidate from TaskController and RecurringSyncService
namespace App\Service;

use App\Entity\RecurringTask;
use App\Enum\RecurrenceType;

class RecurrenceService
{
    /**
     * Check if a date matches the recurrence pattern.
     * Single source of truth for recurrence matching.
     */
    public function matchesPattern(RecurringTask $recurringTask, \DateTimeInterface $date): bool
    {
        $dayOfWeek = (int) $date->format('w'); // 0 = Sunday, 6 = Saturday
        $dayOfMonth = (int) $date->format('j');
        $startDayOfWeek = (int) $recurringTask->getStartDate()->format('w');
        $startDayOfMonth = (int) $recurringTask->getStartDate()->format('j');

        return match ($recurringTask->getRecurrenceType()) {
            RecurrenceType::DAILY => true,
            RecurrenceType::WEEKLY => $dayOfWeek === $startDayOfWeek,
            RecurrenceType::WEEKDAYS => $dayOfWeek >= 1 && $dayOfWeek <= 5,
            RecurrenceType::MONTHLY => $dayOfMonth === $startDayOfMonth,
            RecurrenceType::CUSTOM => in_array($dayOfWeek, $recurringTask->getRecurrenceDays() ?? [], true),
        };
    }

    /**
     * Find the next occurrence date for a recurring task.
     */
    public function findNextOccurrenceDate(RecurringTask $recurringTask, int $maxDaysAhead = 365): ?\DateTimeInterface
    {
        $today = new \DateTime('today');
        $endDate = $recurringTask->getEndDate();

        for ($i = 1; $i <= $maxDaysAhead; $i++) {
            $date = (clone $today)->modify("+{$i} days");

            if ($endDate !== null && $date > $endDate) {
                return null;
            }

            if ($this->matchesPattern($recurringTask, $date)) {
                return $date;
            }
        }

        return null;
    }
}
```

### Pattern 3: Thin Controller Wrapper
**What:** Controller that only handles HTTP concerns
**When to use:** All controllers after service extraction
**Example:**
```php
// Source: Symfony Best Practices
namespace App\Controller;

#[Route('/api/task')]
class TaskController extends AbstractController
{
    public function __construct(
        private readonly TaskService $taskService,
    ) {
    }

    #[Route('', name: 'task_create', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload] TaskCreateRequest $request
    ): JsonResponse {
        $task = $this->taskService->create($user, $request);
        return $this->json(TaskResponse::fromEntity($task), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'task_update', methods: ['PATCH'])]
    public function update(
        #[CurrentUser] User $user,
        int $id,
        Request $request
    ): JsonResponse {
        $task = $this->taskService->findByIdAndUser($id, $user);

        if ($task === null) {
            return $this->json(['error' => 'Task not found'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);
        $result = $this->taskService->update($task, $data);

        return $this->json(TaskResponse::fromEntity($result->task), Response::HTTP_OK);
    }
}
```

### Anti-Patterns to Avoid
- **EntityManager in controllers:** Move to services
- **Business logic in controllers:** Move to services
- **Duplicated logic:** Consolidate into single service
- **Mixed responsibilities:** Services should do one thing well
- **Fat controllers:** Target <100 lines for most controllers

## PATCH Semantics Handling (Deferred from Phase 9)

### The Problem

TaskUpdateRequest exists but is not wired to controller because PATCH has different semantics:
- **null** in request means "set to null" (clear the field)
- **missing field** means "don't change"

Current TaskController uses `array_key_exists()` to distinguish:
```php
if (array_key_exists('dueDate', $data)) {
    if ($data['dueDate'] === null || $data['dueDate'] === '') {
        $task->setDueDate(null);
    } else {
        $task->setDueDate(new \DateTime($data['dueDate']));
    }
}
```

### Recommended Solution

Keep the current `json_decode()` approach for PATCH updates in TaskService:

```php
// In TaskService
public function update(Task $task, array $data): TaskUpdateResult
{
    $generatedNextTask = null;

    if (array_key_exists('isCompleted', $data)) {
        $generatedNextTask = $this->handleCompletion($task, (bool) $data['isCompleted']);
    }

    if (array_key_exists('title', $data)) {
        $task->setTitle((string) $data['title']);
    }

    if (array_key_exists('dueDate', $data)) {
        $task->setDueDate($this->parseNullableDate($data['dueDate']));
    }

    // ... other fields

    $this->entityManager->flush();

    return new TaskUpdateResult($task, $generatedNextTask);
}

private function parseNullableDate(mixed $value): ?\DateTime
{
    if ($value === null || $value === '') {
        return null;
    }
    return new \DateTime($value);
}
```

**Why not MapRequestPayload for PATCH:**
- MapRequestPayload with nullable DTO fields cannot distinguish null from missing
- The current array_key_exists approach is the standard PHP/Symfony pattern
- JSON Merge Patch (RFC 7396) specifies this semantic

### Result Objects for Complex Updates

For updates that produce side effects (like generating next recurring task):

```php
final readonly class TaskUpdateResult
{
    public function __construct(
        public Task $task,
        public ?Task $generatedNextTask = null,
    ) {
    }
}
```

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recurrence pattern matching | Copy-paste between files | RecurrenceService | Single source of truth |
| DailyNote creation | Inline in each method | TaskService::getOrCreateDailyNote() | Reusable helper |
| Completion side effects | Inline in controller | TaskService::handleCompletion() | Testable, reusable |
| Duplicate detection | Inline in facade | DuplicateDetectionService | Testable, swappable |
| Time overlap checking | Each method calculates | DuplicateDetectionService::timesOverlap() | Consistent algorithm |

**Key insight:** The existing codebase already has good service examples (TaskSplitService, TimeBlockService). Follow their patterns.

## Common Pitfalls

### Pitfall 1: Over-Engineering Service Boundaries
**What goes wrong:** Creating too many tiny services that just delegate
**Why it happens:** Misunderstanding single responsibility
**How to avoid:** One service per aggregate root (Task, Planning) is sufficient
**Warning signs:** Services with 1-2 methods that just call other services

### Pitfall 2: Not Passing Request Objects to Services
**What goes wrong:** Controllers still parse request data
**Why it happens:** Unclear boundary between HTTP and business layer
**How to avoid:** Pass DTOs or raw data arrays to services
**Warning signs:** `$request->getContent()` in controller, processing in service

### Pitfall 3: Forgetting to Update RecurringSyncService
**What goes wrong:** Two different recurrence implementations
**Why it happens:** Only updating TaskController
**How to avoid:** Check all usages, update RecurringSyncService to use RecurrenceService
**Warning signs:** `matchesRecurrencePattern` in more than one place

### Pitfall 4: Breaking Existing Responses
**What goes wrong:** Frontend breaks after refactoring
**Why it happens:** Service returns different structure than controller did
**How to avoid:** Services return entities, controllers handle DTO conversion
**Warning signs:** Frontend TypeScript errors after deployment

### Pitfall 5: Circular Dependencies
**What goes wrong:** Service A depends on B, B depends on A
**Why it happens:** Wrong responsibility assignment
**How to avoid:** RecurrenceService has no dependencies, TaskService depends on it
**Warning signs:** Symfony DI container errors about circular references

## Code Examples

### TaskService Complete Implementation
```php
namespace App\Service;

use App\DTO\Request\TaskCreateRequest;
use App\Entity\DailyNote;
use App\Entity\Task;
use App\Entity\User;
use App\Enum\TaskCategory;
use App\Repository\DailyNoteRepository;
use App\Repository\TagRepository;
use App\Repository\TaskRepository;
use Doctrine\ORM\EntityManagerInterface;

class TaskService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly TaskRepository $taskRepository,
        private readonly DailyNoteRepository $dailyNoteRepository,
        private readonly TagRepository $tagRepository,
        private readonly RecurrenceService $recurrenceService,
        private readonly RecurringSyncService $recurringSyncService,
    ) {
    }

    public function findByIdAndUser(int $id, User $user): ?Task
    {
        $task = $this->taskRepository->find($id);

        if ($task === null) {
            return null;
        }

        if ($task->getDailyNote()?->getUser()?->getId() !== $user->getId()) {
            return null;
        }

        return $task;
    }

    public function create(User $user, TaskCreateRequest $request): Task
    {
        $date = new \DateTime($request->date);
        $dailyNote = $this->getOrCreateDailyNote($user, $date);

        $task = new Task();
        $task->setTitle($request->title);
        $task->setDailyNote($dailyNote);

        if ($request->category !== null && TaskCategory::tryFrom($request->category) !== null) {
            $task->setCategory(TaskCategory::from($request->category));
        }

        if ($request->dueDate !== null) {
            $task->setDueDate(new \DateTime($request->dueDate));
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $task;
    }

    public function update(Task $task, array $data): TaskUpdateResult
    {
        $generatedNextTask = null;

        if (array_key_exists('isCompleted', $data)) {
            $generatedNextTask = $this->handleCompletion($task, (bool) $data['isCompleted']);
        }

        if (array_key_exists('title', $data)) {
            $task->setTitle((string) $data['title']);
        }

        if (array_key_exists('dueDate', $data)) {
            $task->setDueDate($this->parseNullableDate($data['dueDate']));
        }

        if (array_key_exists('reminderTime', $data)) {
            $task->setReminderTime($this->parseNullableDateTimeImmutable($data['reminderTime']));
        }

        if (array_key_exists('estimatedMinutes', $data)) {
            $task->setEstimatedMinutes($data['estimatedMinutes'] !== null ? (int) $data['estimatedMinutes'] : null);
        }

        if (array_key_exists('fixedTime', $data)) {
            $task->setFixedTime($this->parseNullableDateTimeImmutable($data['fixedTime']));
        }

        if (array_key_exists('canCombineWithEvents', $data)) {
            $task->setCanCombineWithEvents($data['canCombineWithEvents']);
        }

        if (array_key_exists('needsFullFocus', $data)) {
            $task->setNeedsFullFocus((bool) $data['needsFullFocus']);
        }

        $this->entityManager->flush();

        return new TaskUpdateResult($task, $generatedNextTask);
    }

    public function delete(Task $task): void
    {
        $this->entityManager->remove($task);
        $this->entityManager->flush();
    }

    public function assignTags(Task $task, User $user, array $tagIds): Task
    {
        // Clear existing tags
        foreach ($task->getTags() as $existingTag) {
            $task->removeTag($existingTag);
        }

        // Add new tags
        foreach ($tagIds as $tagId) {
            $tag = $this->tagRepository->find($tagId);
            if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
                $task->addTag($tag);
            }
        }

        $this->entityManager->flush();

        return $task;
    }

    public function removeTag(Task $task, User $user, int $tagId): void
    {
        $tag = $this->tagRepository->find($tagId);
        if ($tag !== null && $tag->getUser()?->getId() === $user->getId()) {
            $task->removeTag($tag);
            $this->entityManager->flush();
        }
    }

    private function handleCompletion(Task $task, bool $isCompleted): ?Task
    {
        $wasCompleted = $task->isCompleted();
        $task->setIsCompleted($isCompleted);

        if ($isCompleted && $task->getCompletedAt() === null) {
            $task->setCompletedAt(new \DateTimeImmutable());
        } elseif (!$isCompleted) {
            $task->setCompletedAt(null);
        }

        // Generate next occurrence if completing a recurring task
        if ($isCompleted && !$wasCompleted && $task->getRecurringTask() !== null) {
            $recurringTask = $task->getRecurringTask();
            $nextDate = $this->recurrenceService->findNextOccurrenceDate($recurringTask);

            if ($nextDate !== null) {
                $generatedTask = $this->recurringSyncService->generateTask($recurringTask, $nextDate);
                if ($generatedTask !== null) {
                    $recurringTask->setLastGeneratedDate($nextDate);
                    return $generatedTask;
                }
            }
        }

        return null;
    }

    private function getOrCreateDailyNote(User $user, \DateTimeInterface $date): DailyNote
    {
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        return $dailyNote;
    }

    private function parseNullableDate(mixed $value): ?\DateTime
    {
        if ($value === null || $value === '') {
            return null;
        }
        return new \DateTime($value);
    }

    private function parseNullableDateTimeImmutable(mixed $value): ?\DateTimeImmutable
    {
        if ($value === null || $value === '') {
            return null;
        }
        return new \DateTimeImmutable($value);
    }
}
```

### TaskUpdateResult DTO
```php
namespace App\Service;

use App\Entity\Task;

final readonly class TaskUpdateResult
{
    public function __construct(
        public Task $task,
        public ?Task $generatedNextTask = null,
    ) {
    }
}
```

### DuplicateDetectionService
```php
namespace App\Service;

class DuplicateDetectionService
{
    /**
     * Check if a task title is a duplicate.
     */
    public function isTaskDuplicate(string $newTitle, array $existingTitles): bool
    {
        $normalized = mb_strtolower(trim($newTitle));
        return in_array($normalized, $existingTitles, true);
    }

    /**
     * Check if an event is a duplicate (same title + overlapping time).
     */
    public function isEventDuplicate(
        string $newTitle,
        ?\DateTimeInterface $newStart,
        ?\DateTimeInterface $newEnd,
        array $existingEvents
    ): bool {
        $normalizedTitle = mb_strtolower(trim($newTitle));

        foreach ($existingEvents as $existing) {
            $existingTitle = mb_strtolower(trim($existing['title']));

            if ($normalizedTitle === $existingTitle) {
                if ($this->timesOverlap($newStart, $newEnd, $existing['startTime'], $existing['endTime'])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if two time ranges overlap.
     */
    public function timesOverlap(
        ?\DateTimeInterface $start1,
        ?\DateTimeInterface $end1,
        ?\DateTimeInterface $start2,
        ?\DateTimeInterface $end2
    ): bool {
        if ($start1 === null || $start2 === null) {
            return false;
        }

        $end1 = $end1 ?? (clone $start1)->modify('+1 hour');
        $end2 = $end2 ?? (clone $start2)->modify('+1 hour');

        $s1 = (int) $start1->format('H') * 60 + (int) $start1->format('i');
        $e1 = (int) $end1->format('H') * 60 + (int) $end1->format('i');
        $s2 = (int) $start2->format('H') * 60 + (int) $start2->format('i');
        $e2 = (int) $end2->format('H') * 60 + (int) $end2->format('i');

        return $s1 < $e2 && $s2 < $e1;
    }

    /**
     * Check if content is a duplicate (exact match after normalization).
     */
    public function isContentDuplicate(string $newContent, array $existingContents): bool
    {
        $normalized = mb_strtolower(trim($newContent));
        return in_array($normalized, $existingContents, true);
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fat controllers | Thin controllers + services | Symfony 2.0+ | Better testability, reusability |
| Mixed concerns | Single responsibility services | Always | Cleaner architecture |
| Duplicated logic | Consolidated services | Always | Easier maintenance |
| EntityManager in controllers | EntityManager in services | Symfony best practices | Cleaner separation |

**Deprecated/outdated:**
- Controllers as services (overkill for this use case)
- Event-driven architecture for simple CRUD (overengineering)
- Repository methods for complex business logic (use services)

## Open Questions

Things that couldn't be fully resolved:

1. **PlanningController inline serialization**
   - What we know: Uses planning-specific fields (hasConflict, matchingBlock)
   - What's unclear: Should these become DTOs or remain inline?
   - Recommendation: Keep inline for Phase 10, consider PlanningTaskResponse DTO in future

2. **BrainDumpFacade response structure**
   - What we know: Returns complex nested structure different from entity DTOs
   - What's unclear: How much to simplify vs keep as-is
   - Recommendation: Focus on extracting duplicate detection, keep response structure

3. **RecurringSyncService refactoring scope**
   - What we know: Has its own matchesRecurrencePattern
   - What's unclear: Should it use RecurrenceService or keep private method?
   - Recommendation: Make RecurrenceService public, have RecurringSyncService use it

## Sources

### Primary (HIGH confidence)
- [Symfony Best Practices](https://symfony.com/doc/current/best_practices.html) - Controller and service organization
- [Symfony Controller Documentation](https://symfony.com/doc/current/controller.html) - Thin controller patterns
- Current codebase analysis: TaskController.php (320 lines), PlanningController.php (257 lines), BrainDumpFacade.php (333 lines)
- Phase 9 research and verification documents

### Secondary (MEDIUM confidence)
- [SymfonyCasts: PATCH handling](https://symfonycasts.com/screencast/rest/patch) - null vs missing field semantics
- [Symfony Exam Blog](https://symfony-exam.com/blog/is-it-a-best-practice-to-keep-application-logic-in-services-rather-than-controllers-in-symfony) - Service layer justification
- Existing service patterns: TaskSplitService.php, TimeBlockService.php, RecurringSyncService.php

### Tertiary (LOW confidence)
- Community patterns for PHP/Symfony service organization

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing codebase patterns
- Architecture: HIGH - Well-documented Symfony patterns, existing examples
- Pitfalls: HIGH - Based on codebase analysis and common patterns

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (patterns are stable, unlikely to change)
