# Phase 4: Exception Handling - Research

**Researched:** 2026-01-20
**Domain:** TimeBlock exceptions, per-day overrides, inline editing UI
**Confidence:** HIGH

## Summary

This phase adds exception handling for TimeBlocks - the ability to modify or skip a block for a single day without affecting the template. The research analyzed the existing codebase patterns for entities, services, and UI components to define the optimal approach.

The codebase already has established patterns for user-scoped entities (TimeBlock, RecurringTask), inline editing (EventBlock), and Redux state management. The TimeBlockException entity follows the existing entity pattern with a composite key of TimeBlock + date. The UI extends the existing TimeBlockStrip tooltip with skip/modify actions.

**Primary recommendation:** Create TimeBlockException entity with skip and time override fields, extend TimeBlockService to apply exceptions, modify API response to include exception state, and enhance TimeBlockStrip tooltip with "Skip today" button and inline time editing.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Symfony | 7.4 | Backend framework | Already in use |
| Doctrine ORM | Latest | Database abstraction | Already in use |
| React | 19 | Frontend framework | Already in use |
| Redux Toolkit | Latest | State management | Already in use |
| Tailwind CSS | Latest | Styling | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-popover | Latest | Popover component | Already available in shadcn/ui |
| lucide-react | Latest | Icons | Already in use (X, Check, Pencil) |

### Alternatives Considered
None - this phase uses exclusively existing stack components.

**Installation:**
No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── Entity/
│   └── TimeBlockException.php    # New entity
├── Repository/
│   └── TimeBlockExceptionRepository.php  # New repository
├── Service/
│   └── TimeBlockService.php      # MODIFY: apply exceptions
├── Controller/
│   └── TimeBlockExceptionController.php  # New: exception CRUD
│   └── TimeBlockController.php   # MODIFY: add exception endpoints

frontend/src/
├── types/
│   └── index.ts                  # MODIFY: add TimeBlockException type
├── lib/
│   └── api.ts                    # MODIFY: add exception API methods
├── store/
│   └── timeBlockSlice.ts         # MODIFY: add exception actions
├── components/schedule/
│   └── TimeBlockStrip.tsx        # MODIFY: add skip/modify UI
```

### Pattern 1: Exception Entity with Composite Key
**What:** TimeBlockException uses TimeBlock + date as logical key (enforced by unique constraint)
**When to use:** Per-day override patterns
**Example:**
```php
// Based on existing entity patterns
#[ORM\Entity(repositoryClass: TimeBlockExceptionRepository::class)]
#[ORM\Table(name: 'time_block_exceptions')]
#[ORM\UniqueConstraint(name: 'time_block_date_unique', columns: ['time_block_id', 'exception_date'])]
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
    private ?\DateTimeInterface $exceptionDate = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isSkipped = false;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $overrideStartTime = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $overrideEndTime = null;
}
```

### Pattern 2: Apply Exceptions in Service Layer
**What:** TimeBlockService applies exceptions when returning blocks for date
**When to use:** Computing effective block state for a date
**Example:**
```php
// Modify TimeBlockService::getActiveBlocksForDate
public function getActiveBlocksForDate(User $user, \DateTimeInterface $date): array
{
    $allBlocks = $this->timeBlockRepository->findActiveByUser($user);
    $exceptions = $this->exceptionRepository->findByUserAndDate($user, $date);
    $exceptionMap = []; // timeBlockId => exception

    foreach ($exceptions as $exception) {
        $exceptionMap[$exception->getTimeBlock()->getId()] = $exception;
    }

    $activeBlocks = [];
    foreach ($allBlocks as $block) {
        if (!$this->isActiveOnDate($block, $date)) {
            continue;
        }

        $exception = $exceptionMap[$block->getId()] ?? null;

        // Skip this block for today
        if ($exception?->isSkipped()) {
            continue;
        }

        // Apply time overrides
        $effectiveBlock = [
            'id' => $block->getId(),
            'name' => $block->getName(),
            'color' => $block->getColor(),
            'startTime' => $exception?->getOverrideStartTime()?->format('H:i')
                ?? $block->getStartTime()?->format('H:i'),
            'endTime' => $exception?->getOverrideEndTime()?->format('H:i')
                ?? $block->getEndTime()?->format('H:i'),
            'tags' => [...],
            'isException' => $exception !== null,
        ];

        $activeBlocks[] = $effectiveBlock;
    }

    return $activeBlocks;
}
```

### Pattern 3: Inline Editing with Popover
**What:** Use Popover for time editing, following EventBlock inline edit pattern
**When to use:** Modifying block times for single day
**Example:**
```tsx
// Based on EventBlock.tsx pattern
const [isEditing, setIsEditing] = useState(false);
const [editStartTime, setEditStartTime] = useState(block.startTime);
const [editEndTime, setEditEndTime] = useState(block.endTime);

// In tooltip content:
{isEditing ? (
  <div className="space-y-2">
    <div className="flex gap-2 items-center">
      <Input
        type="time"
        value={editStartTime}
        onChange={(e) => setEditStartTime(e.target.value)}
        className="h-8 text-sm w-24"
      />
      <span className="text-sm text-muted-foreground">-</span>
      <Input
        type="time"
        value={editEndTime}
        onChange={(e) => setEditEndTime(e.target.value)}
        className="h-8 text-sm w-24"
      />
    </div>
    <div className="flex gap-2">
      <Button size="sm" onClick={handleSaveException}>
        <Check className="h-3 w-3 mr-1" /> Save
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  </div>
) : (
  // Normal tooltip content with actions
)}
```

### Pattern 4: Visual Exception Indicator
**What:** Show dashed border or altered pattern for exception blocks
**When to use:** Block has isException: true
**Example:**
```tsx
// Modify TimeBlockStrip visual
<div
  className={cn(
    'absolute inset-0 rounded-sm transition-all hover:brightness-125',
    block.isException && 'border-2 border-dashed'
  )}
  style={{
    background: `repeating-linear-gradient(
      45deg,
      ${block.color}15,
      ${block.color}15 6px,
      ${block.color}${block.isException ? '25' : '35'} 6px,
      ${block.color}${block.isException ? '25' : '35'} 12px
    )`,
    borderLeft: `3px solid ${block.color}`,
    borderColor: block.isException ? block.color : undefined,
  }}
/>
```

### Anti-Patterns to Avoid
- **Storing exception in TimeBlock entity:** Exceptions are date-specific, separate entity needed
- **Modifying TimeBlock times directly:** Template must remain unchanged
- **Client-side only exception state:** Must persist to database
- **Complex exception rules:** Keep to single-day overrides only (per requirements)
- **Skip confirmation modal:** One-click action, no extra confirmation

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date-based unique constraint | Custom validation | Doctrine UniqueConstraint | Database enforces single exception per block per date |
| Time input UI | Custom time picker | HTML input type="time" | Native, already used in EventBlock |
| Popover positioning | Manual positioning | Radix Popover (existing) | Handles edge cases, already available |
| State management | Local component state | Redux slice | Consistent with app architecture |
| Inline edit pattern | New pattern | EventBlock pattern | Proven UX, consistent look |

**Key insight:** The EventBlock component already has inline time editing with the exact pattern needed. Reuse that UI approach for TimeBlockStrip modifications.

## Common Pitfalls

### Pitfall 1: Exception Orphaned After TimeBlock Delete
**What goes wrong:** Exceptions remain in database after parent TimeBlock deleted
**Why it happens:** Missing CASCADE delete on foreign key
**How to avoid:** Use `onDelete: 'CASCADE'` on TimeBlock relationship
```php
#[ORM\ManyToOne(targetEntity: TimeBlock::class)]
#[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
private ?TimeBlock $timeBlock = null;
```
**Warning signs:** Orphaned rows, foreign key errors

### Pitfall 2: Exception Applied to Wrong Date
**What goes wrong:** Exception shows on adjacent days
**Why it happens:** Date comparison includes time component
**How to avoid:** Use DATE_MUTABLE type and compare date strings
```php
#[ORM\Column(type: Types::DATE_MUTABLE)]
private ?\DateTimeInterface $exceptionDate = null;

// In repository
->where('e.exceptionDate = :date')
->setParameter('date', $date->format('Y-m-d'))
```
**Warning signs:** Exception visible on multiple days

### Pitfall 3: UI State Desync After Exception
**What goes wrong:** Block shows old times after modification
**Why it happens:** Redux state not updated after API call
**How to avoid:** Refetch dailyNote or update timeBlocks in slice
```typescript
// In timeBlockSlice
extraReducers: (builder) => {
  builder.addCase(createException.fulfilled, (state, action) => {
    // Update local state or trigger refetch
  });
}
```
**Warning signs:** UI shows stale data until page refresh

### Pitfall 4: Missing isException Flag in Response
**What goes wrong:** UI cannot distinguish template from modified blocks
**Why it happens:** Forgot to include flag in serialization
**How to avoid:** Always include isException boolean
```php
'isException' => $exception !== null,
```
**Warning signs:** No visual indicator for exceptions

### Pitfall 5: Skip and Modify Conflict
**What goes wrong:** Block is both skipped AND has modified times
**Why it happens:** No validation preventing both
**How to avoid:** Either skip OR modify, not both - UI prevents this
```php
// Validation in controller
if ($exception->isSkipped() && ($exception->getOverrideStartTime() || $exception->getOverrideEndTime())) {
    // Log warning, but proceed - skip takes precedence
}
```
**Warning signs:** Inconsistent behavior

### Pitfall 6: Tooltip Position Overlaps with Edit Controls
**What goes wrong:** Time inputs get cut off or overlap schedule
**Why it happens:** Fixed tooltip width doesn't accommodate edit mode
**How to avoid:** Expand tooltip width in edit mode
```tsx
<div className={cn(
  'absolute left-full ml-2 top-0 bg-popover border rounded-lg shadow-lg px-3 py-2 z-[100]',
  isEditing ? 'w-[280px]' : 'w-[220px]'
)}>
```
**Warning signs:** Clipped inputs, scrollbars in tooltip

## Code Examples

Verified patterns from existing codebase:

### TimeBlockException Entity
```php
<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\TimeBlockExceptionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TimeBlockExceptionRepository::class)]
#[ORM\Table(name: 'time_block_exceptions')]
#[ORM\UniqueConstraint(name: 'time_block_date_unique', columns: ['time_block_id', 'exception_date'])]
#[ORM\HasLifecycleCallbacks]
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
    private ?\DateTimeInterface $exceptionDate = null;

    #[ORM\Column(type: 'boolean', options: ['default' => false])]
    private bool $isSkipped = false;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $overrideStartTime = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $overrideEndTime = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    // ... getters/setters
}
```

### TimeBlockExceptionRepository Query
```php
/**
 * @return TimeBlockException[]
 */
public function findByUserAndDate(User $user, \DateTimeInterface $date): array
{
    return $this->createQueryBuilder('e')
        ->join('e.timeBlock', 'tb')
        ->where('tb.user = :user')
        ->andWhere('e.exceptionDate = :date')
        ->setParameter('user', $user)
        ->setParameter('date', $date->format('Y-m-d'))
        ->getQuery()
        ->getResult();
}

public function findByTimeBlockAndDate(TimeBlock $timeBlock, \DateTimeInterface $date): ?TimeBlockException
{
    return $this->createQueryBuilder('e')
        ->where('e.timeBlock = :timeBlock')
        ->andWhere('e.exceptionDate = :date')
        ->setParameter('timeBlock', $timeBlock)
        ->setParameter('date', $date->format('Y-m-d'))
        ->getQuery()
        ->getOneOrNullResult();
}
```

### API Endpoints
```php
// Skip block for today - POST /api/time-block/{id}/skip
#[Route('/{id}/skip', name: 'time_block_skip', methods: ['POST'])]
public function skip(
    #[CurrentUser] User $user,
    int $id,
    Request $request
): JsonResponse {
    $timeBlock = $this->timeBlockRepository->find($id);
    // ... ownership validation

    $data = json_decode($request->getContent(), true);
    $date = new \DateTime($data['date'] ?? 'today');

    // Upsert exception
    $exception = $this->exceptionRepository->findByTimeBlockAndDate($timeBlock, $date)
        ?? new TimeBlockException();

    $exception->setTimeBlock($timeBlock);
    $exception->setExceptionDate($date);
    $exception->setIsSkipped(true);
    $exception->setOverrideStartTime(null);
    $exception->setOverrideEndTime(null);

    $this->entityManager->persist($exception);
    $this->entityManager->flush();

    return $this->json(['success' => true]);
}

// Modify times for today - POST /api/time-block/{id}/modify
#[Route('/{id}/modify', name: 'time_block_modify', methods: ['POST'])]
public function modify(
    #[CurrentUser] User $user,
    int $id,
    Request $request
): JsonResponse {
    $timeBlock = $this->timeBlockRepository->find($id);
    // ... ownership validation

    $data = json_decode($request->getContent(), true);
    $date = new \DateTime($data['date'] ?? 'today');

    $exception = $this->exceptionRepository->findByTimeBlockAndDate($timeBlock, $date)
        ?? new TimeBlockException();

    $exception->setTimeBlock($timeBlock);
    $exception->setExceptionDate($date);
    $exception->setIsSkipped(false);

    if (isset($data['startTime'])) {
        $exception->setOverrideStartTime(new \DateTime($data['startTime']));
    }
    if (isset($data['endTime'])) {
        $exception->setOverrideEndTime(new \DateTime($data['endTime']));
    }

    $this->entityManager->persist($exception);
    $this->entityManager->flush();

    return $this->json($this->serializeException($exception));
}

// Restore block (remove exception) - DELETE /api/time-block/{id}/exception
#[Route('/{id}/exception', name: 'time_block_restore', methods: ['DELETE'])]
public function restore(
    #[CurrentUser] User $user,
    int $id,
    Request $request
): JsonResponse {
    // ... find and delete exception
}
```

### Frontend Type
```typescript
// Add to types/index.ts
export interface TimeBlockWithException extends TimeBlock {
  isException?: boolean;
  originalStartTime?: string;  // For showing "was: 09:00"
  originalEndTime?: string;
}
```

### Frontend API Methods
```typescript
// Add to api.ts timeBlock section
skipForDate: async (id: number, date: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE}/time-block/${id}/skip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to skip time block');
  }
  return response.json();
},

modifyForDate: async (
  id: number,
  date: string,
  data: { startTime?: string; endTime?: string }
): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE}/time-block/${id}/modify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, ...data }),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to modify time block');
  }
  return response.json();
},

restoreForDate: async (id: number, date: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/time-block/${id}/exception?date=${date}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to restore time block');
  }
},
```

### TimeBlockStrip Skip Button
```tsx
// Add to TimeBlockStrip tooltip actions
{!block.isException ? (
  <Button
    variant="ghost"
    size="sm"
    className="h-6 text-xs"
    onClick={(e) => {
      e.stopPropagation();
      onSkip?.(block.id);
    }}
  >
    <X className="h-3 w-3 mr-1" />
    Skip today
  </Button>
) : (
  <Button
    variant="ghost"
    size="sm"
    className="h-6 text-xs"
    onClick={(e) => {
      e.stopPropagation();
      onRestore?.(block.id);
    }}
  >
    <RotateCcw className="h-3 w-3 mr-1" />
    Restore
  </Button>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate modal for edit | Inline editing in tooltip | - | Less context switching, faster UX |
| Confirm before skip | One-click skip | - | ADHD-friendly, immediate feedback |
| Exception stored client-side | Persisted to database | - | Survives refresh, multi-device |

**Deprecated/outdated:**
- Nothing deprecated - using established patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Exception cleanup policy**
   - What we know: Exceptions older than N days could be cleaned up
   - What's unclear: How long to keep, automatic vs manual cleanup
   - Recommendation: Defer cleanup to future - exceptions are lightweight, no immediate need

2. **Undo skip action**
   - What we know: Restore button removes exception
   - What's unclear: Time limit for undo, or always available
   - Recommendation: Always show Restore button for skipped blocks (same day only)

## Sources

### Primary (HIGH confidence)
- `backend/src/Entity/TimeBlock.php` - Existing TimeBlock entity
- `backend/src/Service/TimeBlockService.php` - Service pattern
- `backend/src/Controller/TimeBlockController.php` - Controller pattern
- `frontend/src/components/schedule/TimeBlockStrip.tsx` - UI component
- `frontend/src/components/schedule/EventBlock.tsx` - Inline edit pattern
- `frontend/src/store/timeBlockSlice.ts` - Redux slice pattern
- `frontend/src/lib/api.ts` - API client pattern

### Secondary (MEDIUM confidence)
- Migration patterns from `backend/migrations/` - Naming convention

### Tertiary (LOW confidence)
None - all findings verified from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project stack
- Architecture: HIGH - All patterns from existing code
- Pitfalls: HIGH - Derived from similar implementations

**Research date:** 2026-01-20
**Valid until:** Indefinitely (codebase-specific patterns)
