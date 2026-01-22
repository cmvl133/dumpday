---
phase: 08-ai-planning-fixes
plan: 02
subsystem: api
tags: [doctrine, repository, planning, overdue-tasks]

# Dependency graph
requires:
  - phase: 08-01
    provides: AI planning mode foundation with event overlap control
provides:
  - Overdue tasks now included in planning view
  - Task splitting verified as working correctly
affects: [planning-mode, ai-scheduling]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - backend/src/Repository/TaskRepository.php

key-decisions:
  - "Use dueDate <= today to include both today's and overdue tasks"
  - "Apply same fix to findPlannedTasksForToday() for consistency"
  - "Task splitting works as designed - no changes needed"

patterns-established: []

# Metrics
duration: 8min
completed: 2026-01-22
---

# Phase 08 Plan 02: PLAN-02/PLAN-03 Investigation Summary

**Fixed overdue tasks not appearing in AI planning view; verified task splitting works correctly**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-22T14:30:00Z
- **Completed:** 2026-01-22T14:38:00Z
- **Tasks:** 3 (2 completed before checkpoint, 1 after)
- **Files modified:** 1

## Accomplishments

- Fixed PLAN-03: Overdue tasks (dueDate < today) now appear in planning view
- Verified PLAN-02: Task splitting works as designed - no changes needed
- Applied consistent fix to both findUnplannedTasksForToday() and findPlannedTasksForToday()

## Task Commits

1. **Tasks 1-2: Verification + Checkpoint** - (handled before continuation)
2. **Task 3: Fix overdue tasks bug** - `2fc7cc6` (fix)

## Investigation Results

### PLAN-02: Task Splitting

**Status:** Verified - Works as designed

User confirmed during checkpoint that task splitting behavior is correct. No issue found with:
- TaskSplitService.proposeSplit() logic
- Frontend SplitPreview component
- Split/Move to Tomorrow/Handle Manually flow

### PLAN-03: Scheduled Tasks in Planning

**Status:** Bug found and fixed

**Problem:** Tasks with `dueDate < today` (overdue tasks) were NOT included in planning view. User reported: "mam taski jako overdue, poza tym nie mam zadnych innych taskow i one nie sa brane pod uwage do planowania: No tasks to plan"

**Root cause:** The query in `findUnplannedTasksForToday()` used:
```sql
WHERE t.dueDate = :today OR (t.category = 'today' AND dn.date = :today)
```

This only matched tasks due exactly today, not overdue tasks.

**Fix:** Changed `=` to `<=`:
```sql
WHERE t.dueDate <= :today OR (t.category = 'today' AND dn.date = :today)
```

## Files Created/Modified

- `backend/src/Repository/TaskRepository.php` - Fixed findUnplannedTasksForToday() and findPlannedTasksForToday() to include overdue tasks

## Decisions Made

1. **Use `<=` instead of `=` for dueDate comparison** - Overdue tasks should always be considered for planning since they're past due and need to be addressed
2. **Apply same fix to findPlannedTasksForToday()** - For consistency, planned overdue tasks should also be visible in conflict detection

## Deviations from Plan

None - plan executed as specified after checkpoint decision.

## Issues Encountered

None - the fix was straightforward once the bug was identified during verification.

## Next Phase Readiness

- PLAN-02 (task splitting) and PLAN-03 (scheduled tasks) both resolved
- AI planning mode now correctly includes all tasks that need scheduling:
  - Tasks with category='today' from today's daily note
  - Tasks with dueDate = today
  - Tasks with dueDate < today (overdue - NEW)
- Ready for further AI planning improvements if needed

---
*Phase: 08-ai-planning-fixes*
*Completed: 2026-01-22*
