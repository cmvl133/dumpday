# Architecture Patterns: Time Blocking for Dopaminder

**Domain:** Time blocking integration with task/calendar management
**Researched:** 2026-01-20
**Confidence:** HIGH (based on existing codebase analysis)

## Executive Summary

Time blocking in Dopaminder requires introducing a new `TimeBlock` entity that defines recurring time windows (e.g., "Work: Mon-Fri 9:00-17:00") and materializes as visual blocks on the daily schedule. The architecture must integrate with the existing `Tag` system for task matching and respect the `DailyNote` aggregate root pattern while allowing user-level configuration.

## Current Architecture Analysis

### Existing Entity Structure

```
User (1) ──owns──> (N) DailyNote (per user per date)
                        │
                        ├──> (N) Task (with ManyToMany to Tags)
                        ├──> (N) Event (startTime, endTime)
                        ├──> (N) JournalEntry
                        └──> (N) Note

User (1) ──owns──> (N) Tag (name, color)
User (1) ──owns──> (N) RecurringTask (template for task generation)
```

### Key Patterns Observed

1. **DailyNote as Aggregate Root**: Tasks and Events belong to DailyNote, not directly to User
2. **Time Representation**: Events use `TIME_MUTABLE` for startTime/endTime, Tasks use `TIME_IMMUTABLE` for fixedTime
3. **Recurrence Pattern**: RecurringTask uses `recurrenceType` enum + `recurrenceDays` JSON array for custom patterns
4. **Tag Ownership**: Tags belong to User (not DailyNote), enabling reuse across days

## Recommended Architecture

### Option A: TimeBlock as User-Level Template (RECOMMENDED)

TimeBlock is a recurring schedule template owned by User, similar to RecurringTask.

```
User (1) ──owns──> (N) TimeBlock (recurring schedule definition)
                        │
                        └──ManyToMany──> (N) Tag (for task matching)
```

**Rationale:**
- Consistent with RecurringTask pattern already in codebase
- TimeBlocks are user preferences, not day-specific data
- Clean separation: template (TimeBlock) vs instance (computed per day)

### Entity Design: TimeBlock

```php
#[ORM\Entity(repositoryClass: TimeBlockRepository::class)]
#[ORM\Table(name: 'time_blocks')]
class TimeBlock
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 100)]
    private ?string $name = null;  // e.g., "Work", "Deep Focus", "Admin"

    #[ORM\Column(length: 7)]
    private ?string $color = null;  // Hex color for UI

    #[ORM\Column(type: Types::TIME_IMMUTABLE)]
    private ?\DateTimeImmutable $startTime = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE)]
    private ?\DateTimeImmutable $endTime = null;

    // Recurrence pattern (reuses existing RecurrenceType enum)
    #[ORM\Column(type: 'string', enumType: RecurrenceType::class)]
    private RecurrenceType $recurrenceType = RecurrenceType::WEEKDAYS;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $recurrenceDays = null;  // [1,2,3,4,5] for Mon-Fri

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $startDate = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $endDate = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::SMALLINT, options: ['default' => 0])]
    private int $sortOrder = 0;  // For display ordering

    // Associated tags - tasks with these tags can be scheduled in this block
    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'time_block_tags')]
    private Collection $tags;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;
}
```

### Per-Day Exceptions: TimeBlockException

For handling "today is different" scenarios (vacation, sick day, etc.).

```php
#[ORM\Entity(repositoryClass: TimeBlockExceptionRepository::class)]
#[ORM\Table(name: 'time_block_exceptions')]
#[ORM\UniqueConstraint(name: 'unique_block_date', columns: ['time_block_id', 'date'])]
class TimeBlockException
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TimeBlock::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?TimeBlock $timeBlock = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    private ?\DateTimeInterface $date = null;

    // Exception type: 'skip' (don't show), 'modify' (different times)
    #[ORM\Column(length: 20)]
    private string $exceptionType = 'skip';

    // Override times (only used when exceptionType = 'modify')
    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $overrideStartTime = null;

    #[ORM\Column(type: Types::TIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $overrideEndTime = null;
}
```

## Data Flow Architecture

### Backend: Computing Daily Blocks

```
Request: GET /api/daily-note/2026-01-20
                    │
                    v
┌─────────────────────────────────────────────────────────┐
│ DailyNoteController::get()                              │
│   │                                                      │
│   ├── Fetch DailyNote (tasks, events)                   │
│   │                                                      │
│   └── TimeBlockService::getBlocksForDate(user, date)    │
│         │                                                │
│         ├── Get active TimeBlocks for user              │
│         ├── Filter by recurrence (is this day active?)  │
│         ├── Apply exceptions (skip/modify)              │
│         └── Return TimeBlockInstance[] (computed)       │
│                                                          │
└─────────────────────────────────────────────────────────┘
                    │
                    v
Response: {
  dailyNote: { tasks, events, ... },
  timeBlocks: [
    { id, name, color, startTime, endTime, tagIds }
  ]
}
```

### Frontend: State Management

**Option A: Extend dailyNoteSlice (RECOMMENDED)**

```typescript
interface DailyNoteState {
  // ... existing fields
  timeBlocks: TimeBlockInstance[];  // Computed blocks for current day
}

interface TimeBlockInstance {
  id: number;           // TimeBlock template ID
  name: string;
  color: string;
  startTime: string;    // "HH:MM"
  endTime: string;      // "HH:MM"
  tagIds: number[];     // For task matching
  isException: boolean; // Whether this is a modified instance
}
```

**Option B: Separate timeBlockSlice**

Better for managing block templates (CRUD operations) separately from daily instances.

```typescript
// timeBlockSlice.ts - for managing templates
interface TimeBlockState {
  templates: TimeBlock[];       // User's time block configurations
  isLoading: boolean;
  error: string | null;
}

// dailyNoteSlice.ts - includes computed instances
interface DailyNoteState {
  // ... existing
  timeBlockInstances: TimeBlockInstance[];  // Computed for currentDate
}
```

**Recommendation:** Use Option B. Keep template management (settings page) separate from daily view rendering. This mirrors the RecurringTask pattern.

## UI Integration Points

### Schedule Component Modifications

```typescript
// DaySchedule.tsx additions
interface DayScheduleProps {
  events: ScheduleEvent[];
  scheduledTasks?: Task[];
  timeBlocks?: TimeBlockInstance[];  // NEW
  // ...
}

// Visual layering (bottom to top):
// 1. Time blocks (background layer, subtle color fill)
// 2. Events (middle layer, solid blocks)
// 3. Task bars (top layer, narrow colored bars on right)
```

### Visual Design Pattern

```
Schedule Column:
┌──────────────────────────────────────┐
│ 09:00  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- TimeBlock "Work" (background)
│        │ Team Standup   │        │▓│ │  <- Event (middle) + Task bar (right)
│ 10:00  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│        │                │        │▓│ │
│ 11:00  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                                      │
│ 12:00  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- TimeBlock "Lunch" (different color)
│        ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ │
│ 13:00  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  <- Back to "Work"
└──────────────────────────────────────┘
```

## API Design

### Time Block CRUD

```
GET    /api/time-block              # List user's time block templates
POST   /api/time-block              # Create new template
PATCH  /api/time-block/{id}         # Update template
DELETE /api/time-block/{id}         # Delete template

# Exceptions
POST   /api/time-block/{id}/exception  # Create exception for date
DELETE /api/time-block/exception/{id}  # Remove exception
```

### DailyNote Response Extension

```typescript
interface DailyNoteData {
  // ... existing fields
  timeBlocks: TimeBlockInstance[];  // Computed for this date
}
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| TimeBlock (Entity) | Recurring schedule template | User, Tag |
| TimeBlockException (Entity) | Per-day overrides | TimeBlock |
| TimeBlockService | Compute instances for date | TimeBlock, Exception repos |
| TimeBlockController | CRUD for templates | TimeBlockService |
| DailyNoteBuilder | Include blocks in response | TimeBlockService |
| timeBlockSlice (Redux) | Template management | API |
| dailyNoteSlice (Redux) | Daily instances for rendering | API (via DailyNote response) |
| DaySchedule (Component) | Render blocks as background | Redux state |

## Suggested Build Order

### Phase 1: Backend Foundation
1. Create `TimeBlock` entity and migration
2. Create `TimeBlockRepository` with recurrence filtering
3. Create `TimeBlockService::getBlocksForDate()`
4. Add time blocks to DailyNote API response
5. Create TimeBlock CRUD endpoints

### Phase 2: Frontend Display
1. Add `TimeBlockInstance` types
2. Extend dailyNoteSlice with timeBlockInstances
3. Create `TimeBlockBackground` component
4. Integrate into DaySchedule

### Phase 3: Template Management
1. Create timeBlockSlice for CRUD
2. Build TimeBlock settings UI (likely in Settings page)
3. Add Tag selection for block templates

### Phase 4: Exceptions
1. Create `TimeBlockException` entity
2. Add exception handling to TimeBlockService
3. Build UI for "Skip today" / "Modify today" actions

### Phase 5: Task Matching (Optional Enhancement)
1. Add visual indicator when task tags match block tags
2. AI suggestions: "This task has #work tag, schedule in Work block?"

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Daily Block Instances
**What:** Creating a new TimeBlockInstance row for every day
**Why bad:** Explosive data growth, RecurringTask already solved this
**Instead:** Compute instances at query time, only store exceptions

### Anti-Pattern 2: TimeBlock in DailyNote
**What:** Making TimeBlock a child of DailyNote like Task/Event
**Why bad:** Blocks are user preferences, not day-specific content
**Instead:** TimeBlock owned by User, computed for each day

### Anti-Pattern 3: Duplicating Recurrence Logic
**What:** Writing new recurrence calculation code
**Why bad:** RecurringTask already has this solved
**Instead:** Reuse RecurrenceType enum and helper methods

### Anti-Pattern 4: Tight Coupling to Schedule UI
**What:** Embedding block rendering logic in DaySchedule
**Why bad:** Hard to reuse in expanded modal, planning mode
**Instead:** Separate TimeBlockLayer component, compose into schedule views

## Integration with Existing Features

### Planning Mode
- Show time blocks as context when estimating task duration
- AI can suggest scheduling tasks in matching blocks
- "This 2h task fits in your afternoon Work block"

### Task Tags
- Natural connection: tag a task, it associates with matching blocks
- Visual: tasks in correct block show subtle highlight
- Optional: enforce "must schedule in block" for certain tags

### Recurring Tasks
- Recurring tasks can have a default time block
- When generated, they auto-schedule in that block's time range

## Confidence Assessment

| Aspect | Confidence | Reason |
|--------|------------|--------|
| Entity Design | HIGH | Follows existing RecurringTask pattern exactly |
| Recurrence Logic | HIGH | RecurrenceType enum already exists and works |
| API Integration | HIGH | DailyNote response extension is straightforward |
| Frontend State | HIGH | Mirrors existing pattern (template slice + instances in daily) |
| UI Rendering | MEDIUM | New component type, but schedule infrastructure exists |
| Exception Handling | MEDIUM | New concept, but pattern is clear |

## Open Questions for Implementation

1. **Block Overlap Handling**: What happens when two blocks overlap? Priority order? Merge?
2. **All-Day Blocks**: Support blocks without times (e.g., "Focus Day")?
3. **Block Suggestions**: Should AI suggest blocks based on task content during brain dump?
4. **Historical View**: Show past days' blocks or just template?

## Sources

- Existing codebase analysis (HIGH confidence):
  - `/backend/src/Entity/RecurringTask.php` - Recurrence pattern reference
  - `/backend/src/Entity/Tag.php` - ManyToMany relationship pattern
  - `/backend/src/Enum/RecurrenceType.php` - Day-of-week enumeration
  - `/frontend/src/store/dailyNoteSlice.ts` - State management pattern
  - `/frontend/src/components/schedule/DaySchedule.tsx` - Schedule rendering
