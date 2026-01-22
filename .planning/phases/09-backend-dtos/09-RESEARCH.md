# Phase 9: Backend DTOs - Research

**Researched:** 2026-01-22
**Domain:** Symfony DTOs, Request/Response Serialization, Validation
**Confidence:** HIGH

## Summary

This phase replaces inline array serialization scattered across 6+ locations with typed DTO classes. The current codebase has significant serialization duplication - `serializeTask()` methods appear identically in TaskController, TaskSplitController, and BrainDumpFacade. Controllers manually decode JSON, validate fields inline, and construct response arrays without type safety.

Symfony 7.4 provides first-class DTO support via `#[MapRequestPayload]` for request DTOs with automatic validation, and the Serializer component for response DTOs. The recommended pattern uses: Request DTOs with validation constraints, Response DTOs with static `fromEntity()` factory methods, and `AbstractController::json()` for automatic serialization.

**Primary recommendation:** Use `#[MapRequestPayload]` for all POST/PATCH endpoints with validation constraints on Request DTOs. Use Response DTOs with `fromEntity()` static factory methods for all API responses. Place all DTOs in `src/DTO/Request/` and `src/DTO/Response/` directories.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| symfony/serializer | ^7.4 | Object normalization/JSON encoding | Already installed, Symfony's built-in solution |
| symfony/validator | ^7.4 | Constraint-based validation | Already installed, integrates with MapRequestPayload |
| symfony/http-kernel | ^7.4 | MapRequestPayload attribute | Already installed via framework-bundle |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| symfony/property-info | ^7.4 | Type introspection for serializer | Already configured in property_info.yaml |
| phpstan/phpdoc-parser | ^2.0 | Array type hints for nested DTOs | Only if mapping arrays of DTOs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MapRequestPayload | Manual json_decode + validate | More boilerplate, less type safety |
| Static fromEntity() | Symfony Normalizer | Normalizer is heavier, fromEntity() is simpler for this use case |
| DTO per controller | Shared DTOs | Trade code reuse for explicit contracts - use shared for responses |

**Installation:**
No additional packages needed - all required components already installed.

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── DTO/
│   ├── Request/
│   │   ├── TaskCreateRequest.php
│   │   ├── TaskUpdateRequest.php
│   │   ├── EventCreateRequest.php
│   │   └── ...
│   └── Response/
│       ├── TaskResponse.php
│       ├── EventResponse.php
│       ├── TimeBlockResponse.php
│       ├── NoteResponse.php
│       ├── TagResponse.php
│       └── DailyNoteResponse.php
├── Controller/
├── Entity/
└── ...
```

### Pattern 1: Request DTO with MapRequestPayload
**What:** Automatic deserialization + validation of incoming JSON to typed object
**When to use:** All POST/PATCH endpoints that accept JSON body
**Example:**
```php
// Source: https://symfony.com/doc/current/controller.html
namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class TaskCreateRequest
{
    public function __construct(
        #[Assert\NotBlank(message: 'Title is required')]
        #[Assert\Length(max: 500)]
        public string $title,

        #[Assert\NotBlank(message: 'Date is required')]
        #[Assert\Date]
        public string $date,

        #[Assert\Choice(choices: ['today', 'scheduled', 'someday'], message: 'Invalid category')]
        public ?string $category = null,

        #[Assert\Date]
        public ?string $dueDate = null,
    ) {
    }
}

// In controller:
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;

#[Route('', name: 'task_create', methods: ['POST'])]
public function create(
    #[CurrentUser] User $user,
    #[MapRequestPayload] TaskCreateRequest $request
): JsonResponse {
    // $request is already validated - validation errors return 422 automatically
    $task = new Task();
    $task->setTitle($request->title);
    // ...
}
```

### Pattern 2: Response DTO with Static Factory
**What:** Typed response object with fromEntity() constructor
**When to use:** All API responses returning entity data
**Example:**
```php
namespace App\DTO\Response;

final readonly class TaskResponse
{
    public function __construct(
        public int $id,
        public string $title,
        public bool $isCompleted,
        public bool $isDropped,
        public ?string $dueDate,
        public string $category,
        public ?string $completedAt,
        public ?string $reminderTime,
        public ?int $estimatedMinutes,
        public ?string $fixedTime,
        public ?array $canCombineWithEvents,
        public bool $needsFullFocus,
        public ?int $recurringTaskId,
        public ?int $parentTaskId,
        public bool $isPart,
        public ?int $partNumber,
        public ?string $progress,
        public bool $hasSubtasks,
        /** @var TagResponse[] */
        public array $tags,
    ) {
    }

    public static function fromEntity(\App\Entity\Task $task): self
    {
        return new self(
            id: $task->getId(),
            title: $task->getTitle(),
            isCompleted: $task->isCompleted(),
            isDropped: $task->isDropped(),
            dueDate: $task->getDueDate()?->format('Y-m-d'),
            category: $task->getCategory()->value,
            completedAt: $task->getCompletedAt()?->format('c'),
            reminderTime: $task->getReminderTime()?->format('H:i'),
            estimatedMinutes: $task->getEstimatedMinutes(),
            fixedTime: $task->getFixedTime()?->format('H:i'),
            canCombineWithEvents: $task->getCanCombineWithEvents(),
            needsFullFocus: $task->isNeedsFullFocus(),
            recurringTaskId: $task->getRecurringTask()?->getId(),
            parentTaskId: $task->getParentTask()?->getId(),
            isPart: $task->isPart(),
            partNumber: $task->getPartNumber(),
            progress: $task->getProgress(),
            hasSubtasks: $task->hasSubtasks(),
            tags: array_map(
                fn($tag) => TagResponse::fromEntity($tag),
                $task->getTags()->toArray()
            ),
        );
    }
}

// In controller:
return $this->json(TaskResponse::fromEntity($task), Response::HTTP_CREATED);
```

### Pattern 3: Nested Response DTOs
**What:** Child DTOs for related entities (tags, events)
**When to use:** Any response that includes related entities
**Example:**
```php
namespace App\DTO\Response;

final readonly class TagResponse
{
    public function __construct(
        public int $id,
        public string $name,
        public string $color,
    ) {
    }

    public static function fromEntity(\App\Entity\Tag $tag): self
    {
        return new self(
            id: $tag->getId(),
            name: $tag->getName(),
            color: $tag->getColor(),
        );
    }
}
```

### Pattern 4: Update Request DTO (Optional Fields)
**What:** Request DTO where all fields are optional for PATCH operations
**When to use:** PATCH endpoints that update partial data
**Example:**
```php
namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class TaskUpdateRequest
{
    public function __construct(
        #[Assert\Length(max: 500)]
        public ?string $title = null,

        public ?bool $isCompleted = null,

        #[Assert\Date]
        public ?string $dueDate = null,

        #[Assert\Regex(pattern: '/^([01]\d|2[0-3]):([0-5]\d)$/', message: 'Invalid time format')]
        public ?string $reminderTime = null,

        #[Assert\PositiveOrZero]
        public ?int $estimatedMinutes = null,

        #[Assert\Regex(pattern: '/^([01]\d|2[0-3]):([0-5]\d)$/', message: 'Invalid time format')]
        public ?string $fixedTime = null,

        public ?array $canCombineWithEvents = null,

        public ?bool $needsFullFocus = null,
    ) {
    }
}
```

### Anti-Patterns to Avoid
- **Inline array construction:** `return $this->json(['id' => $task->getId(), ...])` - use DTOs instead
- **Mixed validation:** Validating some fields in DTO, others in controller - keep all validation in DTO
- **Entity in response:** `return $this->json($task)` - exposes internal structure, use Response DTO
- **Duplicated serialization:** Same `serializeTask()` in multiple controllers - centralize in DTO
- **Validation after processing:** Validate input BEFORE business logic, not during

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON deserialization | `json_decode($request->getContent())` | `#[MapRequestPayload]` | Type-safe, handles edge cases, returns proper errors |
| Request validation | `if (empty($data['title']))` checks | `#[Assert\NotBlank]` | Consistent error format, less boilerplate |
| Date/time validation | Regex or try/catch | `#[Assert\Date]`, `#[Assert\Time]` | Standardized, handles edge cases |
| Error responses | Custom `['error' => $msg]` arrays | MapRequestPayload 422 response | Consistent format, ConstraintViolationList |
| Object serialization | Manual array construction | Serializer or DTO::fromEntity() | Type-safe, maintainable, testable |
| Nullable field handling | `array_key_exists()` checks | DTO constructor defaults | Cleaner, more explicit |

**Key insight:** Symfony's MapRequestPayload handles deserialization, validation, and error responses in one attribute. Building this manually requires 10-20 lines per endpoint that can be replaced with one line.

## Common Pitfalls

### Pitfall 1: Forgetting JSON Route Format
**What goes wrong:** Validation errors return HTML instead of JSON
**Why it happens:** Symfony defaults to HTML error pages
**How to avoid:** Add `format: 'json'` to route or set Accept header
**Warning signs:** HTML in API responses

```php
// Good: explicit JSON format
#[Route('/api/task', name: 'task_create', methods: ['POST'], format: 'json')]
```

### Pitfall 2: Empty Request Body Handling
**What goes wrong:** MapRequestPayload returns null on empty body, skipping validation
**Why it happens:** Known Symfony behavior - empty payload can't be denormalized
**How to avoid:** Make DTO non-nullable or add a guard in controller
**Warning signs:** No validation errors on empty POST

```php
// Guard against null DTO
public function create(#[MapRequestPayload] ?TaskCreateRequest $request): JsonResponse
{
    if ($request === null) {
        return $this->json(['error' => 'Request body is required'], 400);
    }
    // ...
}
```

### Pitfall 3: DateTime Format Mismatch
**What goes wrong:** Date strings don't deserialize to DateTime objects
**Why it happens:** Serializer expects specific format
**How to avoid:** Use string types in DTOs, convert in service layer
**Warning signs:** Null dates or deserialization errors

```php
// Good: use strings, convert in controller/service
public readonly ?string $dueDate = null,

// In controller:
$task->setDueDate($request->dueDate ? new \DateTime($request->dueDate) : null);
```

### Pitfall 4: Breaking Existing API Contract
**What goes wrong:** Frontend breaks because response field names changed
**Why it happens:** DTO property names differ from current array keys
**How to avoid:** Match existing field names exactly, add tests for response structure
**Warning signs:** Frontend TypeScript errors after deployment

### Pitfall 5: Missing readonly for Immutability
**What goes wrong:** DTOs can be modified after construction
**Why it happens:** Not using PHP 8.2+ readonly classes
**How to avoid:** Use `final readonly class` for all DTOs
**Warning signs:** Mutation of DTO objects

## Code Examples

Verified patterns from official sources:

### Complete TaskResponse DTO
```php
// Based on current inline serialization from TaskController, TaskSplitController, BrainDumpFacade
namespace App\DTO\Response;

final readonly class TaskResponse
{
    public function __construct(
        public int $id,
        public string $title,
        public bool $isCompleted,
        public bool $isDropped,
        public ?string $dueDate,
        public string $category,
        public ?string $completedAt,
        public ?string $reminderTime,
        public ?int $estimatedMinutes,
        public ?string $fixedTime,
        public ?array $canCombineWithEvents,
        public bool $needsFullFocus,
        public ?int $recurringTaskId,
        public ?int $parentTaskId,
        public bool $isPart,
        public ?int $partNumber,
        public ?string $progress,
        public bool $hasSubtasks,
        /** @var TagResponse[] */
        public array $tags,
    ) {
    }

    public static function fromEntity(\App\Entity\Task $task): self
    {
        return new self(
            id: $task->getId(),
            title: $task->getTitle(),
            isCompleted: $task->isCompleted(),
            isDropped: $task->isDropped(),
            dueDate: $task->getDueDate()?->format('Y-m-d'),
            category: $task->getCategory()->value,
            completedAt: $task->getCompletedAt()?->format('c'),
            reminderTime: $task->getReminderTime()?->format('H:i'),
            estimatedMinutes: $task->getEstimatedMinutes(),
            fixedTime: $task->getFixedTime()?->format('H:i'),
            canCombineWithEvents: $task->getCanCombineWithEvents(),
            needsFullFocus: $task->isNeedsFullFocus(),
            recurringTaskId: $task->getRecurringTask()?->getId(),
            parentTaskId: $task->getParentTask()?->getId(),
            isPart: $task->isPart(),
            partNumber: $task->getPartNumber(),
            progress: $task->getProgress(),
            hasSubtasks: $task->hasSubtasks(),
            tags: array_map(
                fn($tag) => TagResponse::fromEntity($tag),
                $task->getTags()->toArray()
            ),
        );
    }
}
```

### Complete EventResponse DTO
```php
namespace App\DTO\Response;

final readonly class EventResponse
{
    public function __construct(
        public int $id,
        public string $title,
        public ?string $date,
        public ?string $startTime,
        public ?string $endTime,
    ) {
    }

    public static function fromEntity(\App\Entity\Event $event): self
    {
        return new self(
            id: $event->getId(),
            title: $event->getTitle(),
            date: $event->getDate()?->format('Y-m-d'),
            startTime: $event->getStartTime()?->format('H:i'),
            endTime: $event->getEndTime()?->format('H:i'),
        );
    }
}
```

### Complete TimeBlockResponse DTO
```php
namespace App\DTO\Response;

final readonly class TimeBlockResponse
{
    public function __construct(
        public int $id,
        public string $name,
        public string $color,
        public ?string $startTime,
        public ?string $endTime,
        public string $recurrenceType,
        public ?array $recurrenceDays,
        public bool $isActive,
        public ?string $createdAt,
        /** @var TagResponse[] */
        public array $tags,
    ) {
    }

    public static function fromEntity(\App\Entity\TimeBlock $timeBlock): self
    {
        return new self(
            id: $timeBlock->getId(),
            name: $timeBlock->getName(),
            color: $timeBlock->getColor(),
            startTime: $timeBlock->getStartTime()?->format('H:i'),
            endTime: $timeBlock->getEndTime()?->format('H:i'),
            recurrenceType: $timeBlock->getRecurrenceType()->value,
            recurrenceDays: $timeBlock->getRecurrenceDays(),
            isActive: $timeBlock->isActive(),
            createdAt: $timeBlock->getCreatedAt()?->format('c'),
            tags: array_map(
                fn($tag) => TagResponse::fromEntity($tag),
                $timeBlock->getTags()->toArray()
            ),
        );
    }
}
```

### Request DTO with Validation
```php
// Source: https://symfony.com/doc/current/validation.html
namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class TaskCreateRequest
{
    public function __construct(
        #[Assert\NotBlank(message: 'Title is required')]
        #[Assert\Length(max: 500, maxMessage: 'Title cannot exceed 500 characters')]
        public string $title,

        #[Assert\NotBlank(message: 'Date is required')]
        #[Assert\Date(message: 'Invalid date format. Use YYYY-MM-DD')]
        public string $date,

        #[Assert\Choice(
            choices: ['today', 'scheduled', 'someday'],
            message: 'Invalid category. Must be one of: today, scheduled, someday'
        )]
        public ?string $category = null,

        #[Assert\Date(message: 'Invalid due date format. Use YYYY-MM-DD')]
        public ?string $dueDate = null,
    ) {
    }
}
```

### Controller Using DTOs
```php
namespace App\Controller;

use App\DTO\Request\TaskCreateRequest;
use App\DTO\Response\TaskResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/task', format: 'json')]
class TaskController extends AbstractController
{
    #[Route('', name: 'task_create', methods: ['POST'])]
    public function create(
        #[CurrentUser] User $user,
        #[MapRequestPayload] TaskCreateRequest $request
    ): JsonResponse {
        $date = new \DateTime($request->date);
        $dailyNote = $this->dailyNoteRepository->findByUserAndDate($user, $date);

        if ($dailyNote === null) {
            $dailyNote = new DailyNote();
            $dailyNote->setUser($user);
            $dailyNote->setDate($date);
            $this->entityManager->persist($dailyNote);
        }

        $task = new Task();
        $task->setTitle($request->title);
        $task->setDailyNote($dailyNote);

        if ($request->category !== null) {
            $task->setCategory(TaskCategory::from($request->category));
        }

        if ($request->dueDate !== null) {
            $task->setDueDate(new \DateTime($request->dueDate));
        }

        $this->entityManager->persist($task);
        $this->entityManager->flush();

        return $this->json(TaskResponse::fromEntity($task), Response::HTTP_CREATED);
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `json_decode()` + manual validation | `#[MapRequestPayload]` | Symfony 6.3 (2023) | 10-20 lines per endpoint reduced to 1 |
| XML/YAML validation config | PHP attributes `#[Assert\*]` | Symfony 5.0+ (2019) | Colocated validation with properties |
| Public properties + getters/setters | `readonly class` | PHP 8.2 (2022) | Immutable DTOs, less boilerplate |
| Constructor property promotion | Always use | PHP 8.0+ (2020) | Cleaner DTO constructors |

**Deprecated/outdated:**
- `ParamConverter`: Replaced by `#[MapRequestPayload]` for JSON body mapping
- YAML/XML constraints: PHP attributes preferred for new projects
- Mutable DTOs: Readonly preferred for data transfer

## Open Questions

Things that couldn't be fully resolved:

1. **Empty body handling strategy**
   - What we know: MapRequestPayload returns null on empty JSON body
   - What's unclear: Should we make DTO nullable or throw 400 in event listener?
   - Recommendation: Make DTO nullable with guard clause in controller (simpler, explicit)

2. **Existing test coverage**
   - What we know: PHPUnit is configured
   - What's unclear: Current test coverage and testing strategy
   - Recommendation: Verify existing tests pass before/after migration

3. **Custom validation error format**
   - What we know: Default returns ConstraintViolationList JSON
   - What's unclear: Does frontend expect specific error format?
   - Recommendation: Use default format unless frontend requires changes

## Sources

### Primary (HIGH confidence)
- [Symfony Controller Documentation](https://symfony.com/doc/current/controller.html) - MapRequestPayload/MapQueryString
- [Symfony Validation Documentation](https://symfony.com/doc/current/validation.html) - Constraint types and usage
- [Symfony Serializer Documentation](https://symfony.com/doc/current/serializer.html) - Serialization groups and normalizers
- Current codebase analysis: TaskController.php, PlanningController.php, BrainDumpFacade.php, TaskSplitController.php

### Secondary (MEDIUM confidence)
- [Symfony Blog: Mapping Request Data to Typed Objects](https://symfony.com/blog/new-in-symfony-6-3-mapping-request-data-to-typed-objects) - MapRequestPayload feature introduction
- [Build Better DTOs: Symfony 7.1's New Validation Superpower](https://medium.com/@laurentmn/build-better-dtos-symfony-7-1s-new-validation-superpower-5185d7f3e354) - UniqueEntity on DTOs

### Tertiary (LOW confidence)
- Community patterns for DTO organization (src/DTO/Request, src/DTO/Response structure)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages already installed, well-documented Symfony features
- Architecture: HIGH - Official Symfony patterns, verified with documentation
- Pitfalls: HIGH - Based on official docs, GitHub issues, and common patterns

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (Symfony 7.4 is LTS, patterns stable)
