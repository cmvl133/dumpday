# Technology Stack: Time Blocks Feature

**Project:** Dopaminder - Time Blocks
**Researched:** 2026-01-20
**Focus:** Additional technologies for time blocking feature

## Executive Summary

The existing Dopaminder stack is well-suited for implementing time blocks. **No major new dependencies required.** The current tooling (@dnd-kit, Tailwind CSS, custom schedule components) can handle all requirements. Two optional additions are recommended for improved recurrence handling.

## Current Stack (Already in Place)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| @dnd-kit/core | ^6.3.1 | Drag & drop | Already used for task/event DnD |
| @dnd-kit/sortable | ^10.0.0 | Sortable lists | Already installed |
| Tailwind CSS | ^3.4.17 | Styling | Supports arbitrary values for patterns |
| React | ^19.0.0 | UI framework | Current |
| Redux Toolkit | ^2.5.0 | State management | Handles async thunks |

**Assessment:** Existing stack covers 90% of needs.

## Recommended Additions

### 1. Diagonal Stripe Pattern (CSS Only - No Library)

**Recommendation:** Use Tailwind arbitrary values with `repeating-linear-gradient`

No library needed. Tailwind CSS supports diagonal stripe patterns via arbitrary values:

```tsx
// Time block with diagonal stripes
<div
  className="bg-[repeating-linear-gradient(45deg,var(--stripe-color)_0,var(--stripe-color)_1px,transparent_1px,transparent_6px)]
             [--stripe-color:rgba(59,130,246,0.3)]"
/>
```

**Why this approach:**
- Zero additional bundle size
- Consistent with existing Tailwind patterns
- Customizable per-block via CSS variables
- Works with existing color system

**Alternative considered:** SVG patterns via PatternFills library
- Rejected: Adds complexity for minimal benefit

### 2. Recurrence Handling (Optional Enhancement)

**Current state:** Dopaminder already has custom recurrence logic in `RecurrenceType` enum:
- `daily`, `weekly`, `weekdays`, `monthly`, `custom`
- `recurrenceDays` JSON array for custom patterns

**Recommendation:** Extend existing pattern rather than adding rrule library

**Rationale:**
- Time blocks have simpler recurrence than iCalendar (same times each week)
- Adding rrule.js (2.8.1, ~10kb) would duplicate existing recurrence logic
- Existing `recurrenceDays` pattern (array of day indices 0-6) covers time block needs

**If more complex recurrence needed later:** Consider [rrule](https://github.com/jkbrzt/rrule) library (v2.8.1), but be aware of timezone handling quirks - it returns "UTC" dates meant to be interpreted as local time.

### 3. Date/Time Utilities

**Current state:** Project uses native JavaScript Date objects throughout

**Recommendation:** Continue with native Date for now

**Rationale:**
- Time blocks operate on time-of-day (HH:MM) strings, not complex date math
- Existing codebase uses string times consistently ("09:00", "17:00")
- Adding date-fns (~18kb) or dayjs (~6kb) would be overkill for time block needs

**If date math becomes complex later:** [date-fns](https://date-fns.org/) is preferred for tree-shaking, but dayjs has smaller minimum bundle.

## Installation

```bash
# No new packages required for MVP
# Existing stack sufficient
```

**Optional future additions:**

```bash
# Only if complex recurrence patterns needed (e.g., "every 2nd Tuesday")
npm install rrule

# Only if date manipulation becomes complex
npm install date-fns
```

## UI Component Patterns

### Time Block Visualization

**Approach:** Narrow left-side strips with diagonal stripes

```tsx
// Recommended component structure
interface TimeBlockProps {
  startTime: string;  // "09:00"
  endTime: string;    // "17:00"
  label: string;      // "Work"
  color: string;      // Tailwind color class or hex
  isActive: boolean;  // Is current time within block
}

// Position calculation (reuse existing timeToMinutes from DaySchedule.tsx)
const topPercent = ((startMinutes - SCHEDULE_START_HOUR * 60) / TOTAL_MINUTES) * 100;
const heightPercent = ((endMinutes - startMinutes) / TOTAL_MINUTES) * 100;
```

**Key insight:** `DaySchedule.tsx` already has `timeToMinutes()` and layout calculation logic. Time blocks can reuse this.

### Drag & Drop for Time Blocks

**Approach:** Extend existing @dnd-kit setup

Current implementation uses:
- `DndContext` for drag operations
- `SortableContext` for reorderable lists
- Custom collision detection

**For time blocks:**
- Add new droppable zones for time block assignment
- Use `useDroppable` hook for time block containers
- Tasks dragged onto blocks get `timeBlockId` assignment

**No new DnD library needed** - @dnd-kit is modern, well-maintained, and already integrated.

## Backend Considerations

### Entity Design

**Recommended approach:** New `TimeBlock` entity similar to `RecurringTask`

```php
// Similar structure to existing RecurringTask entity
class TimeBlock {
    private ?int $id;
    private ?User $user;
    private ?string $label;        // "Work", "Focus Time"
    private ?string $startTime;    // TIME_IMMUTABLE "09:00"
    private ?string $endTime;      // TIME_IMMUTABLE "17:00"
    private ?array $daysOfWeek;    // JSON [1,2,3,4,5] for Mon-Fri
    private ?string $color;        // "#3b82f6"
    private bool $isActive;
}
```

**Existing pattern to follow:** `RecurringTask` entity uses `recurrenceDays` JSON array for day-of-week storage.

### Recurrence Generation

**Approach:** Server-side generation (consistent with existing recurring tasks)

- On daily sync, generate "active time blocks for today"
- Similar to `RecurringTaskService::sync()` pattern
- Returns blocks applicable to given date based on `daysOfWeek`

## Alternatives Considered

### Full Calendar Libraries

| Library | Why Not |
|---------|---------|
| react-big-calendar | Heavyweight, would require UI rewrite |
| FullCalendar | Paid for full features, overkill for time blocks |
| Syncfusion Scheduler | Paid, enterprise-focused |

**Decision:** Custom implementation using existing schedule component is simpler and maintains design consistency.

### State Management

| Option | Why Not |
|--------|---------|
| Zustand | Would fragment state management |
| React Query | Overkill, Redux Toolkit already handles async |

**Decision:** Continue with Redux Toolkit slices (consistent with existing `recurringSlice.ts` pattern).

## Confidence Assessment

| Recommendation | Confidence | Source |
|----------------|------------|--------|
| No new DnD library | HIGH | Verified existing @dnd-kit in package.json |
| CSS diagonal stripes | HIGH | [Tailwind arbitrary values documentation](https://www.bavaga.com/blog/2025/02/13/css-tricks-striped-background-pure-css-tailwind/) |
| Skip rrule for MVP | HIGH | Verified existing recurrence logic in codebase |
| Entity pattern | HIGH | Verified RecurringTask.php as reference |

## Summary

**Add nothing for MVP.** The existing stack handles time blocks:

1. **Visualization:** Tailwind CSS + existing schedule layout
2. **Interaction:** @dnd-kit already integrated
3. **Recurrence:** Extend existing `recurrenceDays` pattern
4. **State:** New Redux slice following `recurringSlice.ts` pattern
5. **Backend:** New entity following `RecurringTask` pattern

This is a brownfield feature that fits cleanly into existing architecture.

## Sources

- [dnd-kit official documentation](https://dndkit.com/)
- [Tailwind diagonal stripes tutorial](https://www.bavaga.com/blog/2025/02/13/css-tricks-striped-background-pure-css-tailwind/)
- [rrule GitHub repository](https://github.com/jkbrzt/rrule) - considered but not recommended for MVP
- [date-fns vs dayjs comparison](https://npm-compare.com/date-fns,dayjs,moment) - considered but not needed
- Codebase analysis: `/home/kamil/Code/dumpday/frontend/package.json`, `DaySchedule.tsx`, `RecurringTask.php`
