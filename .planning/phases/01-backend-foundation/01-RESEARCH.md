# Phase 1: Backend Foundation - Research

**Researched:** 2026-01-20
**Domain:** Symfony/Doctrine Entity, Repository, Controller patterns
**Confidence:** HIGH

## Summary

This phase creates the TimeBlock entity and CRUD API following the existing RecurringTask pattern established in the codebase. The research involved deep examination of the existing entity patterns (RecurringTask, Task, Tag, Event), repository patterns, controller patterns, and service architecture.

The codebase follows consistent Symfony 7.4 + Doctrine ORM patterns with PHP 8.3 attributes. All entities use `#[ORM\Entity]` attributes, repositories extend `ServiceEntityRepository`, and controllers extend `AbstractController` with route attributes. The TimeBlock entity should follow these exact patterns.

**Primary recommendation:** Create TimeBlock entity mirroring RecurringTask structure (User ownership, RecurrenceType enum, isActive flag), with ManyToMany Tag relationship matching Task pattern, and CRUD controller matching RecurringController pattern.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Symfony | 7.4 | Framework | Already in use, provides DI, routing, security |
| Doctrine ORM | Latest | Database abstraction | Already in use for all entities |
| PHP | 8.3 | Language | Project requirement |
| PostgreSQL | 15+ | Database | Already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| doctrine/migrations | Latest | Schema migrations | Auto-generated via `make:migration` |

### Alternatives Considered
None - this phase uses exclusively existing stack components.

**Installation:**
No new packages needed - using existing Symfony/Doctrine stack.

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── Entity/
│   └── TimeBlock.php           # New entity
├── Repository/
│   └── TimeBlockRepository.php # New repository
├── Controller/
│   └── TimeBlockController.php # New CRUD controller
├── Service/
│   └── TimeBlockService.php    # Compute active blocks for date
└── Enum/
    └── RecurrenceType.php      # REUSE existing enum
```

### Pattern 1: Entity with User Ownership
**What:** Entities belong to User via ManyToOne, CASCADE delete on user removal
**When to use:** All user-scoped data
**Example:**
```php
// Source: backend/src/Entity/RecurringTask.php
#[ORM\ManyToOne(targetEntity: User::class)]
#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
private ?User $user = null;
```

### Pattern 2: Enum Column Type
**What:** PHP 8.1 enum with Doctrine enumType mapping
**When to use:** Fixed set of values like recurrence types
**Example:**
```php
// Source: backend/src/Entity/RecurringTask.php
#[ORM\Column(type: 'string', enumType: RecurrenceType::class)]
private RecurrenceType $recurrenceType = RecurrenceType::DAILY;
```

### Pattern 3: ManyToMany with Tags (Owning Side)
**What:** TimeBlock owns the relationship, Tag is inverse side
**When to use:** Tag relationships (following Task pattern)
**Example:**
```php
// Source: backend/src/Entity/Task.php
/**
 * @var Collection<int, Tag>
 */
#[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'timeBlocks')]
#[ORM\JoinTable(name: 'time_block_tags')]
private Collection $tags;
```

### Pattern 4: JSON Column for Custom Days
**What:** Store array of day integers (0=Sun, 6=Sat) as JSON
**When to use:** Custom recurrence days
**Example:**
```php
// Source: backend/src/Entity/RecurringTask.php
#[ORM\Column(type: Types::JSON, nullable: true)]
private ?array $recurrenceDays = null;
```

### Pattern 5: Soft Delete via isActive Flag
**What:** DELETE endpoint sets isActive=false instead of removing
**When to use:** RecurringTask pattern (preserve history)
**Example:**
```php
// Source: backend/src/Controller/RecurringController.php
// DELETE /{id} - Soft delete
$recurringTask->setIsActive(false);
$this->entityManager->flush();
return $this->json(null, Response::HTTP_NO_CONTENT);
```

### Pattern 6: CRUD Controller with CurrentUser
**What:** Use `#[CurrentUser]` attribute for authenticated user injection
**When to use:** All protected endpoints
**Example:**
```php
// Source: backend/src/Controller/RecurringController.php
#[Route('', name: 'recurring_list', methods: ['GET'])]
public function list(#[CurrentUser] User $user): JsonResponse
{
    $recurringTasks = $this->recurringTaskRepository->findActiveByUser($user);
    return $this->json(array_map(...));
}
```

### Pattern 7: Ownership Validation
**What:** Check entity->getUser()->getId() === $user->getId() before operations
**When to use:** PATCH, DELETE operations
**Example:**
```php
// Source: backend/src/Controller/RecurringController.php
if ($recurringTask->getUser()?->getId() !== $user->getId()) {
    return $this->json([
        'error' => 'Access denied',
    ], Response::HTTP_FORBIDDEN);
}
```

### Pattern 8: TIME_MUTABLE for Time-Only Fields
**What:** Use Types::TIME_MUTABLE for startTime/endTime
**When to use:** Time fields without date component
**Example:**
```php
// Source: backend/src/Entity/Event.php
#[ORM\Column(type: Types::TIME_MUTABLE)]
private ?\DateTimeInterface $startTime = null;

#[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
private ?\DateTimeInterface $endTime = null;
```

### Anti-Patterns to Avoid
- **Direct User ID storage:** Always use ManyToOne relationship, not just user_id column
- **Custom enum validation:** Let Doctrine handle enum conversion via enumType
- **Hard delete by default:** Use isActive flag for template entities (preserves history)
- **Missing ownership check:** Always verify user ownership before PATCH/DELETE
- **Forgetting inverse side:** When adding ManyToMany, update Tag entity with inverse mapping

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recurrence pattern matching | Custom day-of-week logic | RecurringSyncService::matchesRecurrencePattern() | Already handles DAILY, WEEKLY, WEEKDAYS, MONTHLY, CUSTOM |
| Tag relationship | Custom join table management | Doctrine ManyToMany with JoinTable | Auto-manages join table, cascade handling |
| User ownership validation | Custom middleware | Controller-level check pattern | Simple, explicit, already established |
| JSON array storage | Custom serialization | Doctrine Types::JSON | Auto handles array<->JSON |
| Date/Time formatting | Manual format strings | Entity getter with format() | Consistent H:i and Y-m-d patterns |

**Key insight:** The codebase already has RecurringTask with identical recurrence logic. TimeBlock should reuse RecurrenceType enum and follow the same shouldGenerateForDate logic pattern.

## Common Pitfalls

### Pitfall 1: Missing Tag Inverse Side Update
**What goes wrong:** TimeBlock->tags works, but Tag->timeBlocks is undefined
**Why it happens:** Forgot to add inverse side in Tag entity
**How to avoid:** Add inverse mapping in Tag entity:
```php
#[ORM\ManyToMany(targetEntity: TimeBlock::class, mappedBy: 'tags')]
private Collection $timeBlocks;
```
**Warning signs:** "Undefined property: Tag::$timeBlocks" errors

### Pitfall 2: Forgetting PrePersist for createdAt
**What goes wrong:** createdAt is null after persist
**Why it happens:** Missing lifecycle callback setup
**How to avoid:** Add both annotation and method:
```php
#[ORM\HasLifecycleCallbacks]
class TimeBlock
{
    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }
}
```
**Warning signs:** NULL in createdAt column

### Pitfall 3: Time Zone Issues with TIME_MUTABLE
**What goes wrong:** Times shift when serialized
**Why it happens:** PHP DateTime includes timezone, database TIME doesn't
**How to avoid:** Use consistent format in serialization:
```php
'startTime' => $this->startTime?->format('H:i'),
'endTime' => $this->endTime?->format('H:i'),
```
**Warning signs:** Times off by hours in API responses

### Pitfall 4: Missing Migration for Join Table
**What goes wrong:** "Table time_block_tags doesn't exist"
**Why it happens:** Doctrine auto-generates join table name but migration wasn't run
**How to avoid:** Always run `bin/console make:migration` after entity changes, then `bin/console doctrine:migrations:migrate`
**Warning signs:** SQLSTATE errors referencing missing table

### Pitfall 5: Color Validation
**What goes wrong:** Invalid hex colors stored
**Why it happens:** No validation on color field
**How to avoid:** Follow TagController pattern with ALLOWED_COLORS constant and validation
**Warning signs:** CSS breaks with invalid color values

### Pitfall 6: Circular Serialization with Tags
**What goes wrong:** Infinite loop or memory exhaustion
**Why it happens:** Serializing tag->tasks->tags->tasks...
**How to avoid:** Use explicit serialization (not json_encode on entity):
```php
'tags' => array_map(fn ($tag) => [
    'id' => $tag->getId(),
    'name' => $tag->getName(),
    'color' => $tag->getColor(),
], $timeBlock->getTags()->toArray()),
```
**Warning signs:** 500 errors, memory exhaustion

## Code Examples

Verified patterns from existing codebase:

### TimeBlock Entity Structure (based on RecurringTask + Event)
```php
// Composite of backend/src/Entity/RecurringTask.php and Event.php patterns
#[ORM\Entity(repositoryClass: TimeBlockRepository::class)]
#[ORM\Table(name: 'time_blocks')]
#[ORM\HasLifecycleCallbacks]
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
    private ?string $name = null;

    #[ORM\Column(length: 7)]
    private ?string $color = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    private ?\DateTimeInterface $startTime = null;

    #[ORM\Column(type: Types::TIME_MUTABLE)]
    private ?\DateTimeInterface $endTime = null;

    #[ORM\Column(type: 'string', enumType: RecurrenceType::class)]
    private RecurrenceType $recurrenceType = RecurrenceType::DAILY;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $recurrenceDays = null;

    #[ORM\Column(type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, Tag>
     */
    #[ORM\ManyToMany(targetEntity: Tag::class, inversedBy: 'timeBlocks')]
    #[ORM\JoinTable(name: 'time_block_tags')]
    private Collection $tags;

    public function __construct()
    {
        $this->tags = new ArrayCollection();
    }
    // ... getters/setters following existing patterns
}
```

### Repository Query Method (based on RecurringTaskRepository)
```php
// Source: backend/src/Repository/RecurringTaskRepository.php pattern
/**
 * @return TimeBlock[]
 */
public function findActiveByUser(User $user): array
{
    return $this->createQueryBuilder('tb')
        ->where('tb.user = :user')
        ->andWhere('tb.isActive = true')
        ->setParameter('user', $user)
        ->orderBy('tb.startTime', 'ASC')
        ->getQuery()
        ->getResult();
}
```

### Controller Serialization (based on RecurringController)
```php
// Source: backend/src/Controller/RecurringController.php pattern
private function serializeTimeBlock(TimeBlock $tb): array
{
    return [
        'id' => $tb->getId(),
        'name' => $tb->getName(),
        'color' => $tb->getColor(),
        'startTime' => $tb->getStartTime()?->format('H:i'),
        'endTime' => $tb->getEndTime()?->format('H:i'),
        'recurrenceType' => $tb->getRecurrenceType()->value,
        'recurrenceDays' => $tb->getRecurrenceDays(),
        'isActive' => $tb->isActive(),
        'createdAt' => $tb->getCreatedAt()?->format('c'),
        'tags' => array_map(fn ($tag) => [
            'id' => $tag->getId(),
            'name' => $tag->getName(),
            'color' => $tag->getColor(),
        ], $tb->getTags()->toArray()),
    ];
}
```

### Service for Computing Active Blocks
```php
// Based on RecurringSyncService::shouldGenerateForDate pattern
public function getActiveBlocksForDate(User $user, \DateTimeInterface $date): array
{
    $allBlocks = $this->timeBlockRepository->findActiveByUser($user);
    $activeBlocks = [];

    foreach ($allBlocks as $block) {
        if ($this->isActiveOnDate($block, $date)) {
            $activeBlocks[] = $block;
        }
    }

    return $activeBlocks;
}

private function isActiveOnDate(TimeBlock $block, \DateTimeInterface $date): bool
{
    $dayOfWeek = (int) $date->format('w'); // 0 = Sunday

    return match ($block->getRecurrenceType()) {
        RecurrenceType::DAILY => true,
        RecurrenceType::WEEKLY => $dayOfWeek === (int) $block->getCreatedAt()->format('w'),
        RecurrenceType::WEEKDAYS => $dayOfWeek >= 1 && $dayOfWeek <= 5,
        RecurrenceType::MONTHLY => (int) $date->format('j') === (int) $block->getCreatedAt()->format('j'),
        RecurrenceType::CUSTOM => in_array($dayOfWeek, $block->getRecurrenceDays() ?? [], true),
    };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Annotations | PHP 8 Attributes | Symfony 6+ | Use `#[ORM\Column]` not `@ORM\Column` |
| Interface return types | Static return type | PHP 8.0+ | Use `static` for fluent setters |
| AbstractController::json() | Still current | - | Preferred for JSON responses |

**Deprecated/outdated:**
- Doctrine Annotations: Use PHP 8 attributes exclusively (project already does this)
- YML/XML mapping: Use attribute-based mapping (project already does this)

## Open Questions

Things that couldn't be fully resolved:

1. **TimeBlockException entity scope**
   - What we know: Requirements mention REQ-004 for per-day overrides
   - What's unclear: Whether this is Phase 1 or separate phase
   - Recommendation: Defer to planning - requirements list shows it as Phase 1 but controller may be Phase 2

2. **Endpoint for active blocks by date**
   - What we know: REQ-007 requires GET endpoint for computed blocks
   - What's unclear: Whether this is `/api/time-block/date/{date}` or integrated into DailyNote response
   - Recommendation: Both - standalone endpoint AND include in DailyNote response per REQ-008

## Sources

### Primary (HIGH confidence)
- `backend/src/Entity/RecurringTask.php` - Entity pattern reference
- `backend/src/Entity/Task.php` - ManyToMany Tag pattern
- `backend/src/Entity/Tag.php` - Tag entity with inverse relationship
- `backend/src/Entity/Event.php` - TIME_MUTABLE pattern
- `backend/src/Controller/RecurringController.php` - CRUD controller pattern
- `backend/src/Controller/TagController.php` - Tag CRUD with color validation
- `backend/src/Repository/RecurringTaskRepository.php` - Repository query pattern
- `backend/src/Service/RecurringSyncService.php` - Recurrence matching logic
- `backend/src/Facade/BrainDumpFacade.php` - DailyNote response structure
- `backend/src/Enum/RecurrenceType.php` - RecurrenceType enum

### Secondary (MEDIUM confidence)
- Migration files - Naming convention: `VersionYYYYMMDDHHiiss.php`

### Tertiary (LOW confidence)
None - all findings verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project stack, no new packages
- Architecture: HIGH - All patterns copied from existing working code
- Pitfalls: HIGH - Derived from actual implementation patterns

**Research date:** 2026-01-20
**Valid until:** Indefinitely (codebase-specific patterns)
