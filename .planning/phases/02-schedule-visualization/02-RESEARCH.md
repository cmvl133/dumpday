# Phase 2: Schedule Visualization - Research

**Researched:** 2026-01-20
**Domain:** React component architecture, CSS diagonal patterns, Redux state management
**Confidence:** HIGH

## Summary

This phase creates visual time block backgrounds in the DaySchedule component. The research examined the existing schedule component architecture (DaySchedule.tsx, EventBlock.tsx, TaskBlock.tsx), Redux slice patterns (recurringSlice.ts, dailyNoteSlice.ts), and CSS techniques for diagonal stripe patterns.

The DaySchedule component uses a relative container with absolute-positioned elements for events and tasks. Time blocks should be rendered as background layer (z-index lower than events/tasks) with narrow strips on the left side. The existing codebase uses custom hover tooltips (via useState + onMouseEnter/Leave) rather than Radix UI Tooltip, which is the pattern to follow.

**Primary recommendation:** Create TimeBlockBackground component as absolute-positioned divs with inline style `background: repeating-linear-gradient(45deg, ...)` for diagonal stripes, positioned behind events/tasks via lower z-index. Fetch time blocks via dailyNoteSlice extension (timeBlocks already included in DailyNote response per Phase 1 design).

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0.0 | UI framework | Already in use |
| Redux Toolkit | Latest | State management | Already in use, createAsyncThunk pattern |
| Tailwind CSS | Latest | Styling | Already in use for all components |
| TypeScript | Latest | Type safety | Already in use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | Latest | Class merging | Already via `cn()` utility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline repeating-linear-gradient | SVG pattern | More complex, no benefit for simple stripes |
| Custom tooltip | Radix Tooltip | Codebase uses custom hover state pattern |
| Separate timeBlockSlice | Extend dailyNoteSlice | DailyNote already returns timeBlocks per Phase 1 |

**Installation:**
No new packages needed - using existing stack.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   └── schedule/
│       ├── DaySchedule.tsx           # Existing - add TimeBlockBackground layer
│       ├── TimeBlockBackground.tsx   # NEW - renders all blocks as background
│       └── TimeBlockStrip.tsx        # NEW - single block strip with hover
├── store/
│   └── dailyNoteSlice.ts            # Extend with timeBlocks from response
└── types/
    └── index.ts                      # Add TimeBlock type
```

### Pattern 1: Background Layer via Z-Index
**What:** Time blocks render behind events/tasks using z-index ordering
**When to use:** Visual layers in schedule that shouldn't obstruct content
**Example:**
```tsx
// Source: DaySchedule.tsx existing pattern
// Events render at default z-index (implicitly 0-10)
// Tasks render at z-index: 30 (TaskBlock.tsx line 53)
// Current time indicator at z-index: 20

// Time blocks should use z-index: 5 (behind events, above grid)
<div
  className="absolute"
  style={{
    top: `${topPercent}%`,
    left: '56px', // After time label column (w-14 = 56px)
    width: '24px', // Narrow strip
    height: `${heightPercent}%`,
    zIndex: 5,
  }}
/>
```

### Pattern 2: Diagonal Stripe Background
**What:** CSS repeating-linear-gradient for striped pattern
**When to use:** Visual distinction for time blocks vs solid events
**Example:**
```tsx
// Source: CSS-Tricks stripes guide (verified)
const stripeStyle = {
  background: `repeating-linear-gradient(
    45deg,
    ${color}20,
    ${color}20 4px,
    ${color}40 4px,
    ${color}40 8px
  )`,
  borderLeft: `3px solid ${color}`,
};

// Alternative: thicker stripes for better rendering
const thickStripeStyle = {
  background: `repeating-linear-gradient(
    45deg,
    ${color}15,
    ${color}15 6px,
    ${color}35 6px,
    ${color}35 12px
  )`,
};
```

### Pattern 3: Custom Hover Tooltip (Codebase Pattern)
**What:** useState + onMouseEnter/Leave for tooltip visibility
**When to use:** Hover interactions throughout this codebase
**Example:**
```tsx
// Source: TaskBlock.tsx lines 25, 55-57, 97-149
function TimeBlockStrip({ block }: TimeBlockStripProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ zIndex: showTooltip ? 100 : 5 }}
    >
      {/* Block visual */}

      {showTooltip && (
        <div className="absolute left-full ml-2 top-0 bg-popover border rounded-lg shadow-lg px-3 py-2 z-[100] w-[200px]">
          <p className="text-sm font-medium">{block.name}</p>
          <p className="text-xs text-muted-foreground">
            {block.startTime} - {block.endTime}
          </p>
          {/* Edit button */}
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Schedule Position Calculation (Existing)
**What:** Convert time to percentage position
**When to use:** All schedule items
**Example:**
```tsx
// Source: frontend/src/lib/utils.ts
const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 22;
const TOTAL_HOURS = SCHEDULE_END_HOUR - SCHEDULE_START_HOUR;

export function calculateTopPercent(startTime: string | null | undefined): number {
  if (!startTime) return 0;
  const [hours, minutes] = startTime.split(':').map(Number);
  const hoursFromStart = Math.max(0, hours - SCHEDULE_START_HOUR) + minutes / 60;
  return (hoursFromStart / TOTAL_HOURS) * 100;
}

export function calculateHeightPercent(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number {
  if (!startTime || !endTime) {
    return (1 / TOTAL_HOURS) * 100; // Default 1 hour
  }
  // ... calculation
}
```

### Pattern 5: Redux State from DailyNote Response
**What:** timeBlocks come via DailyNote GET, not separate endpoint
**When to use:** Data already included in DailyNote response (Phase 1 design)
**Example:**
```tsx
// Source: Phase 1 research - backend returns timeBlocks in DailyNote response
interface DailyNoteData {
  // ... existing fields
  timeBlocks: TimeBlock[]; // NEW - added by Phase 1
}

// In component:
const timeBlocks = useSelector((state: RootState) =>
  state.dailyNote.dailyNote?.timeBlocks ?? []
);
```

### Anti-Patterns to Avoid
- **Creating separate timeBlockSlice for fetching:** DailyNote already includes timeBlocks per Phase 1 design
- **Using Radix Tooltip:** Codebase consistently uses custom hover state pattern (TaskBlock, TaskDot)
- **Thin stripe patterns (<5px):** Cause rendering jank with repeating-linear-gradient
- **Hard-coded colors:** Use block.color from backend with opacity variants
- **Blocking event/task interaction:** Ensure z-index allows clicking through to events

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-to-position conversion | Custom calculation | calculateTopPercent/calculateHeightPercent from utils.ts | Already handles edge cases |
| Class name merging | Manual concatenation | cn() utility | Handles Tailwind conflicts |
| Tooltip positioning | Custom position math | Absolute positioning with left-full ml-2 | Pattern from TaskBlock |
| Color opacity | Manual hex manipulation | Tailwind opacity syntax (color + "20") | Cleaner, consistent |

**Key insight:** The schedule already has working patterns for position calculation, hover tooltips, and z-index layering. Follow these exactly.

## Common Pitfalls

### Pitfall 1: Stripe Rendering Jank
**What goes wrong:** Stripes appear wobbly or shimmer during scroll
**Why it happens:** Subpixel rendering with thin stripes in repeating-linear-gradient
**How to avoid:** Use stripe widths >= 5px, or use linear-gradient with background-size
**Warning signs:** Visual artifacts when scrolling schedule

### Pitfall 2: Z-Index Stacking Context
**What goes wrong:** Time blocks appear above events despite lower z-index
**Why it happens:** Creating new stacking context with position: relative
**How to avoid:** Keep all schedule items in same stacking context (the schedule container)
**Warning signs:** Blocks covering event text

### Pitfall 3: Tooltip Appearing Under Other Elements
**What goes wrong:** Hover tooltip gets cut off or appears behind events
**Why it happens:** z-index not high enough on tooltip
**How to avoid:** Use z-index: 100 on tooltip container (matches TaskBlock pattern)
**Warning signs:** Partially visible tooltips

### Pitfall 4: Missing TimeBlock Type
**What goes wrong:** TypeScript errors when accessing timeBlocks
**Why it happens:** Type not defined in frontend types/index.ts
**How to avoid:** Add TimeBlock interface matching backend response
**Warning signs:** "Property 'timeBlocks' does not exist" errors

### Pitfall 5: Blocks Not Updating on Date Change
**What goes wrong:** Blocks show for wrong date after navigation
**Why it happens:** timeBlocks not part of fetchDailyNote response handling
**How to avoid:** Ensure Phase 1 backend returns computed blocks for current date
**Warning signs:** Yesterday's blocks showing on today's schedule

## Code Examples

Verified patterns from existing codebase:

### TimeBlock Type Definition
```typescript
// Add to frontend/src/types/index.ts
export interface TimeBlock {
  id: number;
  name: string;
  color: string;           // Hex color, e.g., "#9d4edd"
  startTime: string;       // "HH:MM" format
  endTime: string;         // "HH:MM" format
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null;
  isActive: boolean;
  createdAt: string;
  tags: Tag[];
}
```

### TimeBlockStrip Component
```tsx
// Source: Composite of TaskBlock.tsx and TaskDot.tsx patterns
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockStripProps {
  block: TimeBlock;
  topPercent: number;
  heightPercent: number;
  onEdit?: (block: TimeBlock) => void;
}

export function TimeBlockStrip({
  block,
  topPercent,
  heightPercent,
  onEdit,
}: TimeBlockStripProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Diagonal stripe pattern with block color
  const stripeStyle = {
    background: `repeating-linear-gradient(
      45deg,
      ${block.color}15,
      ${block.color}15 6px,
      ${block.color}35 6px,
      ${block.color}35 12px
    )`,
    borderLeft: `3px solid ${block.color}`,
  };

  return (
    <div
      className="absolute cursor-pointer transition-all hover:brightness-110"
      style={{
        top: `${topPercent}%`,
        left: '56px',        // After time label (w-14)
        width: '20px',       // Narrow strip
        height: `${Math.max(heightPercent, 2)}%`,
        minHeight: '16px',
        zIndex: showTooltip ? 100 : 5,
        ...stripeStyle,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Tooltip on hover */}
      {showTooltip && (
        <div
          className="absolute left-full ml-2 top-0 bg-popover border rounded-lg shadow-lg px-3 py-2 z-[100] w-[180px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{block.name}</p>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => onEdit(block)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {block.startTime} - {block.endTime}
          </p>
          {block.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {block.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: `${tag.color}30`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### TimeBlockBackground Container
```tsx
// Source: Follows DaySchedule.tsx layout pattern
import { useMemo } from 'react';
import { TimeBlockStrip } from './TimeBlockStrip';
import { calculateTopPercent, calculateHeightPercent } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockBackgroundProps {
  timeBlocks: TimeBlock[];
  onEditBlock?: (block: TimeBlock) => void;
}

export function TimeBlockBackground({
  timeBlocks,
  onEditBlock,
}: TimeBlockBackgroundProps) {
  const blocksWithLayout = useMemo(() => {
    return timeBlocks.map((block) => ({
      block,
      topPercent: calculateTopPercent(block.startTime),
      heightPercent: calculateHeightPercent(block.startTime, block.endTime),
    }));
  }, [timeBlocks]);

  return (
    <>
      {blocksWithLayout.map((item) => (
        <TimeBlockStrip
          key={item.block.id}
          block={item.block}
          topPercent={item.topPercent}
          heightPercent={item.heightPercent}
          onEdit={onEditBlock}
        />
      ))}
    </>
  );
}
```

### DaySchedule Integration Point
```tsx
// In DaySchedule.tsx, add after half-hour lines, before events
{/* Time block backgrounds - render before events */}
{timeBlocks && timeBlocks.length > 0 && (
  <TimeBlockBackground
    timeBlocks={timeBlocks}
    onEditBlock={onEditTimeBlock}
  />
)}

{/* Current time indicator */}
{/* ... existing code ... */}

{/* Event blocks */}
{/* ... existing code ... */}
```

### Alternative: No-Jank Stripe Pattern
```tsx
// If rendering issues occur with repeating-linear-gradient
// Use linear-gradient with background-size instead
const noJankStripeStyle = {
  background: `linear-gradient(
    45deg,
    ${block.color}15 25%,
    ${block.color}35 25%,
    ${block.color}35 50%,
    ${block.color}15 50%,
    ${block.color}15 75%,
    ${block.color}35 75%
  )`,
  backgroundSize: '11.3px 11.3px', // sqrt(2) * 8px for 45deg
  borderLeft: `3px solid ${block.color}`,
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG patterns | CSS gradients | 2020+ | Simpler, performant for stripes |
| Radix Tooltip | Custom hover state | Project convention | Consistent with existing code |
| Separate API call | Include in DailyNote | Phase 1 design | Fewer network requests |

**Deprecated/outdated:**
- SVG-based stripe patterns for simple diagonal lines (CSS is simpler)
- External stripe generator tools (inline styles work fine)

## Open Questions

Things that couldn't be fully resolved:

1. **Edit modal implementation**
   - What we know: REQ-012 requires edit option on hover
   - What's unclear: Whether edit opens inline form or modal
   - Recommendation: Use modal (consistent with EventBlock edit pattern)

2. **Multiple overlapping blocks**
   - What we know: Blocks could theoretically overlap in time
   - What's unclear: Business rule for handling overlaps
   - Recommendation: Stack horizontally like TaskBlock (offsetIndex pattern)

3. **ScheduleExpandedModal integration**
   - What we know: Modal exists for full-screen schedule view
   - What's unclear: Should time blocks appear there too?
   - Recommendation: Include in Phase 2, same pattern as DaySchedule

## Sources

### Primary (HIGH confidence)
- `frontend/src/components/schedule/DaySchedule.tsx` - Schedule container pattern
- `frontend/src/components/schedule/TaskBlock.tsx` - Narrow strip with hover tooltip
- `frontend/src/components/schedule/TaskDot.tsx` - Custom hover state pattern
- `frontend/src/components/schedule/EventBlock.tsx` - Event rendering and edit pattern
- `frontend/src/store/dailyNoteSlice.ts` - Redux async thunk pattern
- `frontend/src/store/recurringSlice.ts` - Reference slice pattern
- `frontend/src/lib/utils.ts` - calculateTopPercent/calculateHeightPercent
- `frontend/src/types/index.ts` - Type definitions

### Secondary (MEDIUM confidence)
- [CSS-Tricks: Stripes in CSS](https://css-tricks.com/stripes-css/) - Diagonal stripe technique
- [CSS-Tricks: No-Jank CSS Stripes](https://css-tricks.com/no-jank-css-stripes/) - Performance optimization
- Phase 1 Research (01-RESEARCH.md) - Backend TimeBlock structure

### Tertiary (LOW confidence)
None - all findings verified from codebase or authoritative CSS documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project stack exclusively
- Architecture: HIGH - All patterns copied from working schedule components
- CSS patterns: HIGH - Verified with CSS-Tricks authoritative guides
- Pitfalls: MEDIUM - Some rendering behavior may vary by browser

**Research date:** 2026-01-20
**Valid until:** Indefinitely (codebase-specific patterns, stable CSS features)
