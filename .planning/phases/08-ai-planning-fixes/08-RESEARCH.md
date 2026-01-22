# Phase 8: AI Planning Fixes - Research

**Researched:** 2026-01-22
**Domain:** AI-powered task scheduling with OpenAI GPT-4o-mini
**Confidence:** HIGH

## Summary

This phase addresses three AI planning issues: PLAN-01 (event overlap), PLAN-02 (task splitting), and PLAN-03 (scheduled tasks in planning view). The research reveals:

1. **PLAN-01 (Event Overlap):** The `allowOverlap` property referenced in REQUIREMENTS.md does not exist in the Event entity. The current system uses `canCombineWithEvents` on Task (not Event) to mark which tasks can be scheduled during events. The AI prompt allows combining tasks with events but doesn't explicitly restrict scheduling during events.

2. **PLAN-02 (Task Splitting):** A complete task splitting system exists with backend service (`TaskSplitService`), controller (`TaskSplitController`), and frontend components. The system works but may have UX issues - needs investigation of actual behavior vs expected behavior.

3. **PLAN-03 (Scheduled Tasks):** Tasks with `dueDate` matching today but no `fixedTime` are correctly retrieved by `findUnplannedTasksForToday()` but the query uses OR logic: tasks with `dueDate = today` OR tasks with `category = 'today'` AND `dn.date = today`. Tasks with category `scheduled` and `dueDate = today` should appear in planning.

**Primary recommendation:** PLAN-01 requires adding `allowOverlap` to Event entity and updating AI prompt; PLAN-02 needs behavioral investigation; PLAN-03 works correctly but may need query verification.

## Standard Stack

### Core Components (Already Implemented)
| Component | Location | Purpose |
|-----------|----------|---------|
| PlanningScheduleGenerator | `backend/src/Service/PlanningScheduleGenerator.php` | Generates AI schedule via OpenAI API |
| TaskSplitService | `backend/src/Service/TaskSplitService.php` | Handles task splitting logic |
| PlanningController | `backend/src/Controller/PlanningController.php` | API endpoints for planning |
| TaskSplitController | `backend/src/Controller/TaskSplitController.php` | API endpoints for splitting |
| TaskRepository | `backend/src/Repository/TaskRepository.php` | Task queries |

### AI Integration
| Service | Model | Purpose |
|---------|-------|---------|
| OpenAI API | gpt-4o-mini | Schedule optimization |
| Twig Templates | - | Prompt generation |

### Prompt Templates
| Template | Language | Purpose |
|----------|----------|---------|
| `schedule_optimization_en.twig` | English | Main scheduling prompt |
| `schedule_optimization_pl.twig` | Polish | Main scheduling prompt |
| `schedule_rebuild_en.twig` | English | Schedule rebuild prompt |
| `schedule_rebuild_pl.twig` | Polish | Schedule rebuild prompt |

## Architecture Patterns

### Current Event/Task Relationship
```
Event Entity:
- id, title, startTime, endTime, date
- NO allowOverlap property (needs to be added)

Task Entity:
- canCombineWithEvents: ?array (list of event IDs task can overlap)
- needsFullFocus: bool (task cannot be combined with events)
```

### Current AI Prompt Flow
```
1. PlanningController::generateSchedule() called with task IDs
2. Fetches tasks, events, existing planned tasks
3. PlanningScheduleGenerator::generate() builds prompt
4. Twig template renders with:
   - tasks (with canCombineWithEvents, needsFullFocus)
   - events (startTime, endTime only - no overlap info)
   - existing_planned_tasks (blocked time slots)
5. OpenAI returns schedule suggestions
6. normalizeResponse() processes and deduplicates
```

### Task Query Logic for Planning
```php
// findUnplannedTasksForToday() - current query:
->andWhere('(t.dueDate = :today OR (t.category = :todayCategory AND dn.date = :today))')
->andWhere('t.fixedTime IS NULL')  // unplanned tasks only
```

**Issue:** Tasks with `category = 'scheduled'` and `dueDate = today` ARE included (correct).
The `t.dueDate = :today` clause catches these regardless of category.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Task splitting | Custom split logic | TaskSplitService | Complex slot finding, date overflow handling |
| Time slot calculation | Manual math | TaskSplitService::findAvailableSlots() | Handles events, existing tasks, boundaries |
| Prompt templating | String concatenation | Twig templates | Maintainable, translatable |

## Common Pitfalls

### Pitfall 1: Assuming allowOverlap Exists
**What goes wrong:** REQUIREMENTS.md references `allowOverlap: true` but this property doesn't exist.
**Why it happens:** Requirement was written before implementation design.
**How to avoid:** Add `allowOverlap` column to Event entity with migration.
**Warning signs:** AI schedules tasks during any event, not respecting overlap settings.

### Pitfall 2: AI Ignoring Event Constraints
**What goes wrong:** AI may schedule tasks during events even without explicit permission.
**Why it happens:** Current prompt says events are "fixed" but doesn't explicitly forbid scheduling during them unless task has `canCombineWithEvents`.
**How to avoid:** Update prompt to:
  - List events with their `allowOverlap` status
  - Explicitly state: "DO NOT schedule tasks during events unless event has allowOverlap=true AND task has canCombineWithEvents including that event ID"

### Pitfall 3: Task Splitting Edge Cases
**What goes wrong:** Splitting behavior may be confusing to users.
**Why it happens:** Complex UX flow with multiple options (split, move to tomorrow, skip).
**How to avoid:** Document expected behavior, ensure frontend matches backend.
**Warning signs:** Users confused about what happens to split tasks.

### Pitfall 4: Scheduled Tasks Not Appearing
**What goes wrong:** Tasks with `dueDate = today` don't appear in planning.
**Why it happens:** Query logic error or task has wrong category.
**How to avoid:** Verify query includes all tasks where `dueDate = today` regardless of category.

## Code Examples

### Current Event Data Passed to AI (Line 54-59 in PlanningScheduleGenerator)
```php
// Source: backend/src/Service/PlanningScheduleGenerator.php
$eventData = array_map(fn (Event $event) => [
    'id' => $event->getId(),
    'title' => $event->getTitle(),
    'startTime' => $event->getStartTime()?->format('H:i'),
    'endTime' => $event->getEndTime()?->format('H:i'),
    // MISSING: allowOverlap property
], $events);
```

### Required Event Data for PLAN-01 Fix
```php
// After adding allowOverlap to Event entity:
$eventData = array_map(fn (Event $event) => [
    'id' => $event->getId(),
    'title' => $event->getTitle(),
    'startTime' => $event->getStartTime()?->format('H:i'),
    'endTime' => $event->getEndTime()?->format('H:i'),
    'allowOverlap' => $event->isAllowOverlap(), // NEW
], $events);
```

### Current Prompt Event Section (Line 8-16 in schedule_optimization_en.twig)
```twig
FIXED EVENTS (cannot be moved):
{% for event in events %}
- {{ event.title }}: {{ event.startTime }}{% if event.endTime %} - {{ event.endTime }}{% endif %}
{% endfor %}
```

### Required Prompt Event Section for PLAN-01
```twig
FIXED EVENTS (cannot be moved):
{% for event in events %}
- {{ event.title }}: {{ event.startTime }}{% if event.endTime %} - {{ event.endTime }}{% endif %}{% if event.allowOverlap %} [ALLOWS TASK OVERLAP]{% else %} [NO OVERLAP]{% endif %}

{% endfor %}
```

### Task Query for Planning (Lines 96-111 in TaskRepository)
```php
// Source: backend/src/Repository/TaskRepository.php
public function findUnplannedTasksForToday(User $user, \DateTimeInterface $today): array
{
    return $this->createQueryBuilder('t')
        ->join('t.dailyNote', 'dn')
        ->where('dn.user = :user')
        ->andWhere('(t.dueDate = :today OR (t.category = :todayCategory AND dn.date = :today))')
        ->andWhere('t.isCompleted = false')
        ->andWhere('t.isDropped = false')
        ->andWhere('t.fixedTime IS NULL')
        ->setParameter('user', $user)
        ->setParameter('today', $today->format('Y-m-d'))
        ->setParameter('todayCategory', TaskCategory::TODAY->value)
        ->orderBy('t.id', 'ASC')
        ->getQuery()
        ->getResult();
}
```

## Root Cause Analysis

### PLAN-01: AI does not schedule tasks during events without overlap permission

**Root Cause:** The `allowOverlap` property does not exist on Event entity. Currently:
- Task has `canCombineWithEvents` (array of event IDs it can overlap with)
- Task has `needsFullFocus` (boolean, cannot combine with anything)
- Event has NO overlap control

**Current Behavior:** AI is told events are "fixed" but prompt doesn't explicitly forbid scheduling during event time slots. The only guidance is:
- "Places focus-requiring tasks in quiet gaps between events"
- "If a task can be combined with an event, set combinedWithEventId"

This leaves AI free to schedule any non-fullFocus task during events.

**Fix Required:**
1. Add `allowOverlap` boolean to Event entity
2. Create migration
3. Update PlanningScheduleGenerator to include `allowOverlap` in event data
4. Update all 4 prompt templates with explicit rules
5. Update frontend Event type and any forms

### PLAN-02: AI task splitting behavior works as expected

**Root Cause:** Needs investigation. The system exists and appears complete:
- Backend: TaskSplitService with proposeSplit(), splitTask(), mergeSubtasks()
- Frontend: TaskSplitStep, SplitPreview components
- Flow: Task doesn't fit > show split options > user chooses > execute split

**Current Behavior:**
1. During schedule generation, tasks with `suggestedTime === null` and `estimatedMinutes > 30` are flagged for splitting
2. Frontend fetches split proposals and available slots
3. User can: Split, Move to Tomorrow, or Handle Manually

**Potential Issues:**
- Split happens AFTER schedule generation, not integrated into AI scheduling
- Subtasks created have `isPart = true`, `partNumber = 1,2,3...`
- Parent task gets `fixedTime = null` after split

**Investigation Needed:**
- What is the expected behavior?
- Is the current flow confusing?
- Should AI be aware of split capability?

### PLAN-03: Scheduled tasks (with date, no time) appear in daily planning

**Root Cause:** The query `findUnplannedTasksForToday()` DOES include tasks with `dueDate = today`:
```sql
WHERE (t.dueDate = :today OR (t.category = 'today' AND dn.date = :today))
  AND t.fixedTime IS NULL
```

This correctly catches:
- Tasks with `dueDate = 2026-01-22` regardless of category
- Tasks with `category = 'today'` created on today's daily note

**Current Behavior:** Should work correctly. If it's not working, the issue is likely:
- Task has `fixedTime` set (excluded from unplanned)
- Task has wrong `dueDate`
- Task is completed or dropped

**Verification Needed:** Test with actual data to confirm behavior.

## Files to Modify

### PLAN-01: Event Overlap
| File | Change |
|------|--------|
| `backend/src/Entity/Event.php` | Add `allowOverlap` boolean property with getter/setter |
| Migration | `ALTER TABLE events ADD allow_overlap BOOLEAN DEFAULT false` |
| `backend/src/Service/PlanningScheduleGenerator.php` | Include `allowOverlap` in event data (line 54-59, 150-155) |
| `backend/templates/prompts/schedule_optimization_en.twig` | Add overlap info to events, add constraint rules |
| `backend/templates/prompts/schedule_optimization_pl.twig` | Add overlap info to events, add constraint rules |
| `backend/templates/prompts/schedule_rebuild_en.twig` | Add overlap info to events |
| `backend/templates/prompts/schedule_rebuild_pl.twig` | Add overlap info to events |
| `frontend/src/types/index.ts` | Add `allowOverlap?: boolean` to Event interface |
| `backend/src/Facade/BrainDumpFacade.php` | Include `allowOverlap` when creating events from AI analysis |
| `backend/templates/prompts/brain_dump_analysis_en.twig` | Add `allowOverlap` to event schema |
| `backend/templates/prompts/brain_dump_analysis_pl.twig` | Add `allowOverlap` to event schema |

### PLAN-02: Task Splitting (Investigation)
| File | Purpose |
|------|---------|
| `backend/src/Service/TaskSplitService.php` | Review splitting logic |
| `frontend/src/components/planning/TaskSplitStep.tsx` | Review UX flow |
| `frontend/src/components/planning/SplitPreview.tsx` | Review preview display |
| `frontend/src/store/planningSlice.ts` | Review split state management |

### PLAN-03: Scheduled Tasks (Verification)
| File | Purpose |
|------|---------|
| `backend/src/Repository/TaskRepository.php` | Verify query logic (likely correct) |
| `backend/src/Controller/PlanningController.php` | Verify data returned (line 42-43) |

## Open Questions

1. **PLAN-02 Expected Behavior:**
   - What we know: Split system exists and creates subtasks
   - What's unclear: What specific behavior is "not working as expected"?
   - Recommendation: Investigate with user to clarify the bug

2. **PLAN-01 UI for allowOverlap:**
   - What we know: Need backend property
   - What's unclear: How should user set allowOverlap on events?
   - Recommendation: Add checkbox/toggle in event creation/edit UI

3. **Default allowOverlap Value:**
   - What we know: New events need a default
   - What's unclear: Should default be true or false?
   - Recommendation: Default to `false` (conservative - don't overlap unless explicitly allowed)

## Sources

### Primary (HIGH confidence)
- `/home/kamil/Code/dumpday/backend/src/Entity/Event.php` - Event entity without allowOverlap
- `/home/kamil/Code/dumpday/backend/src/Entity/Task.php` - Task entity with canCombineWithEvents
- `/home/kamil/Code/dumpday/backend/src/Service/PlanningScheduleGenerator.php` - AI prompt generation
- `/home/kamil/Code/dumpday/backend/templates/prompts/schedule_optimization_en.twig` - Main prompt template
- `/home/kamil/Code/dumpday/backend/src/Repository/TaskRepository.php` - Task queries
- `/home/kamil/Code/dumpday/backend/src/Service/TaskSplitService.php` - Splitting logic
- `/home/kamil/Code/dumpday/.planning/REQUIREMENTS.md` - Requirements definition
- `/home/kamil/Code/dumpday/.planning/ROADMAP.md` - Phase context

### Secondary (MEDIUM confidence)
- Code analysis of frontend planning components

## Metadata

**Confidence breakdown:**
- PLAN-01 root cause: HIGH - Direct code inspection shows missing property
- PLAN-01 fix approach: HIGH - Standard Doctrine entity modification
- PLAN-02 root cause: LOW - Need clarification on what's broken
- PLAN-03 root cause: HIGH - Query analysis shows correct logic

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - stable domain)
