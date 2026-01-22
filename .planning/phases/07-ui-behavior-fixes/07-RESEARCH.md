# Phase 7: UI Behavior Fixes - Research

**Researched:** 2026-01-22
**Domain:** React state management, Redux Toolkit, UI responsiveness
**Confidence:** HIGH

## Summary

This phase addresses two distinct UI behavior bugs related to state management and user experience:

1. **CHKN-01**: Check-in modal reappears after manual dismiss before the next scheduled interval
2. **UIST-01**: Task category changes from check-in don't reflect immediately in the main UI

Both issues stem from state management gaps in the existing Redux architecture. The check-in modal issue involves localStorage timing and state synchronization, while the task list update issue requires optimistic UI updates or proper refetching after check-in actions.

**Primary recommendation:** Fix modal dismiss behavior by ensuring `lastModalAt` is updated on close (not just open), and implement immediate UI updates for task category changes through proper Redux state management.

## Current Implementation Analysis

### CHKN-01: Check-in Modal Behavior

**Current Flow:**
1. `useAutoModal` hook (line 32-85 of `useAutoModal.ts`) monitors check-in intervals
2. Modal opens via `openModal` action in `howAreYouSlice.ts` (line 268-276)
3. On open, `lastModalAt` is set to current timestamp and persisted to localStorage
4. Modal can be closed via `closeModal` action (line 277-279)
5. `closeModal` only sets `isOpen = false` - does NOT update `lastModalAt`

**Root Cause Identified:**
The `lastModalAt` timestamp is set when the modal OPENS (line 273-275 in howAreYouSlice.ts):
```typescript
openModal: (state) => {
  state.isOpen = true;
  // ...
  const now = new Date().toISOString();
  state.lastModalAt = now;
  storeLastModal(now);
}
```

This is correct behavior - the timestamp marks when the user was last "checked in on". However, the issue may occur in edge cases:

1. **Session Start Issue**: If `lastModalAt` is null and user dismisses before completing, the next interval check uses `sessionStartRef.current` which may have been set long ago
2. **Race Condition**: The 60-second check interval in `useAutoModal` (line 77) may not align with user expectations of "next interval"
3. **State Persistence**: The `closeModal` action doesn't explicitly confirm the dismiss was intentional vs accidental

**Files Involved:**
- `/frontend/src/store/howAreYouSlice.ts` (lines 263-279, 430-462)
- `/frontend/src/hooks/useAutoModal.ts` (entire file)
- `/frontend/src/components/how-are-you/HowAreYouModal.tsx` (lines 26-28)

### UIST-01: Task List Immediate Updates

**Current Flow:**
1. User opens check-in modal via HowAreYouModal
2. CheckInFlow displays tasks from `state.howAreYou.checkIn.tasks`
3. Task action (done/tomorrow/today) calls `performTaskAction` thunk (line 171-183 howAreYouSlice.ts)
4. Backend updates task via `api.checkIn.taskAction`
5. Response contains updated task data but it's NOT used to update main task list
6. `dailyNoteSlice` task state is only updated when `fetchDailyNote` is called
7. `fetchDailyNote` is triggered in `handleClose` of CheckInFlow ONLY when check-in is complete (line 52)

**Root Cause Identified:**
The check-in flow operates on a separate state slice (`howAreYou.checkIn`) from the main task display (`dailyNote.dailyNote.tasks`). When a task action is performed:

1. `performTaskAction` calls `api.checkIn.taskAction` which updates the backend
2. The response is used to update check-in UI state but NOT the main task list
3. There's no cross-slice communication to update `dailyNoteSlice`
4. The main task list only refreshes on:
   - Page load/date change (via `fetchDailyNote`)
   - After brain dump save
   - After check-in COMPLETE (not individual actions)

**Files Involved:**
- `/frontend/src/store/howAreYouSlice.ts` (lines 171-183, 431-462)
- `/frontend/src/store/dailyNoteSlice.ts` (entire file, especially lines 352-415)
- `/frontend/src/components/how-are-you/CheckInFlow.tsx` (lines 61-156)
- `/frontend/src/components/analysis/AnalysisResults.tsx` (lines 159-181)
- `/frontend/src/App.tsx` (lines 93-181 for displayData computation)

## Standard Stack

The existing implementation already uses the standard stack:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Redux Toolkit | Used | State management | Already in codebase, createSlice/createAsyncThunk |
| React 19 | Current | UI framework | Already in codebase |
| TypeScript | Used | Type safety | Already in codebase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | Native | Persistence | Already used for `lastModalAt` |

**No new libraries needed** - solutions use existing patterns.

## Architecture Patterns

### Pattern 1: Cross-Slice State Updates

**What:** When an action in one slice needs to update another slice's state
**When to use:** Check-in task actions need to update main task list
**Recommended approach:** Use `extraReducers` to listen for actions from other slices

```typescript
// In dailyNoteSlice.ts
extraReducers: (builder) => {
  // Listen for check-in task actions from howAreYouSlice
  builder.addCase(performTaskAction.fulfilled, (state, action) => {
    // Update task in local state based on action result
    if (state.dailyNote) {
      const updatedTask = action.payload.result.task;
      // Move/update task in appropriate category
    }
  });
}
```

### Pattern 2: Optimistic UI Updates

**What:** Update UI immediately before server confirms, rollback on error
**When to use:** Task category changes where server latency affects UX
**Alternative to refetching:** Direct state manipulation based on action type

```typescript
// Before API call, optimistically update local state
// After API success, confirm the change
// On API failure, rollback to previous state
```

### Pattern 3: Modal Dismiss with Explicit Timestamp Update

**What:** Update timestamp when user explicitly dismisses modal
**When to use:** Ensuring manual dismiss is respected until next interval
**Current gap:** `closeModal` doesn't distinguish between dismiss types

### Anti-Patterns to Avoid
- **Full refetch on every action:** Expensive and causes UI flicker
- **Separate state for same data:** Check-in tasks should reference the same source
- **Time-based state without clear boundaries:** Intervals should be explicit

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-slice communication | Custom event system | Redux extraReducers | Built-in, type-safe |
| Timestamp management | Complex time calculations | Simple Date comparison | localStorage already used |
| Task category updates | Manual array manipulation | Redux state updates | Immer handles mutations |

## Common Pitfalls

### Pitfall 1: State Synchronization Between Slices
**What goes wrong:** Check-in and daily note slices have separate task lists that can diverge
**Why it happens:** Original design separated concerns without shared state
**How to avoid:** Either share state via selectors or use cross-slice listeners
**Warning signs:** User sees different task states in different views

### Pitfall 2: Interval Timing Edge Cases
**What goes wrong:** Modal appears "too soon" after dismiss
**Why it happens:** 60-second polling doesn't align with user's mental model of "interval"
**How to avoid:** Ensure `lastModalAt` reflects user intent, not just modal state
**Warning signs:** User reports modal reappearing unexpectedly

### Pitfall 3: Race Conditions in Async Updates
**What goes wrong:** UI shows stale state while update is in flight
**Why it happens:** Multiple async operations complete out of order
**How to avoid:** Use proper loading states and sequential updates
**Warning signs:** Tasks appear in wrong category momentarily

## Recommended Fix Approaches

### Fix for CHKN-01: Modal Dismiss Behavior

**Option A: Explicit Dismiss Timestamp (Recommended)**
Add a dedicated action for intentional dismiss that updates `lastModalAt`:

```typescript
// In howAreYouSlice.ts
dismissModal: (state) => {
  state.isOpen = false;
  // Explicitly set lastModalAt to ensure next interval starts from dismiss
  const now = new Date().toISOString();
  state.lastModalAt = now;
  storeLastModal(now);
}
```

Use `dismissModal` when user clicks close/dismiss, `closeModal` for programmatic close.

**Option B: Update Timestamp on Close**
Simpler - just update `lastModalAt` in `closeModal`:

```typescript
closeModal: (state) => {
  state.isOpen = false;
  const now = new Date().toISOString();
  state.lastModalAt = now;
  storeLastModal(now);
}
```

**Recommended:** Option B for simplicity, with clear comments explaining the behavior.

### Fix for UIST-01: Immediate Task List Updates

**Option A: Cross-Slice Listener (Recommended)**
Add `extraReducers` in `dailyNoteSlice` to listen for check-in actions:

```typescript
// In dailyNoteSlice.ts extraReducers
.addCase(performTaskAction.fulfilled, (state, action) => {
  if (!state.dailyNote) return;

  const { action: taskAction, result } = action.payload;
  const taskId = result.task.id;

  // Find and update/move task based on action
  const categories = ['today', 'scheduled', 'someday', 'overdue'] as const;

  for (const category of categories) {
    const taskList = state.dailyNote.tasks[category];
    if (!taskList) continue;

    const index = taskList.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      if (taskAction === 'done') {
        taskList[index] = { ...taskList[index], isCompleted: true };
      } else if (taskAction === 'tomorrow') {
        // Move to scheduled with new dueDate
        const task = taskList.splice(index, 1)[0];
        task.dueDate = result.task.dueDate;
        state.dailyNote.tasks.scheduled.push(task);
      }
      // ... handle other actions
      break;
    }
  }
})
```

**Option B: Import Action and Dispatch**
Import `fetchDailyNote` into check-in flow and dispatch after each action:

```typescript
// In CheckInFlow.tsx handleTaskAction
await dispatch(performTaskAction({ taskId, action })).unwrap();
// Immediately refetch
dispatch(fetchDailyNote(currentDate));
```

**Recommended:** Option A for better performance (no extra API call) and smoother UX.

## Files to Modify

### CHKN-01 Fix
| File | Change |
|------|--------|
| `/frontend/src/store/howAreYouSlice.ts` | Update `closeModal` reducer to set `lastModalAt` |

### UIST-01 Fix
| File | Change |
|------|--------|
| `/frontend/src/store/dailyNoteSlice.ts` | Add `extraReducers` for `performTaskAction.fulfilled` |
| `/frontend/src/store/howAreYouSlice.ts` | Import may be needed if not already circular-safe |

## Edge Cases and Risks

### CHKN-01 Risks
1. **Rapid open/close:** User rapidly opening and closing could update timestamp repeatedly - acceptable behavior
2. **Interval setting change:** If user changes interval setting, existing `lastModalAt` still applies - correct behavior
3. **Page refresh:** `lastModalAt` persists in localStorage - correct behavior

### UIST-01 Risks
1. **Circular imports:** Need to ensure importing action from `howAreYouSlice` into `dailyNoteSlice` doesn't create circular dependency
2. **Task not found:** Task may not exist in current date's task list (if viewing different date than task's due date)
3. **Overdue section updates:** Tasks moving from overdue need special handling since overdue is computed, not stored

### Mitigation for Circular Import
Use `addCase` with the action type string instead of imported action:
```typescript
.addCase('howAreYou/taskAction/fulfilled', (state, action) => {
  // Handler
})
```

## Code Examples

### Cross-Slice Listener Pattern
```typescript
// Source: Redux Toolkit documentation pattern
// File: dailyNoteSlice.ts

import { performTaskAction } from './howAreYouSlice';

// In extraReducers
builder.addCase(performTaskAction.fulfilled, (state, action) => {
  if (!state.dailyNote) return;

  const { action: taskAction, result } = action.payload;
  const updatedTask = result.task;
  const categories = ['today', 'scheduled', 'someday'] as const;

  // Find the task in any category
  for (const category of categories) {
    const taskList = state.dailyNote.tasks[category];
    const index = taskList.findIndex((t) => t.id === updatedTask.id);

    if (index !== -1) {
      if (taskAction === 'done') {
        // Mark as completed in place
        taskList[index] = {
          ...taskList[index],
          isCompleted: true,
          completedAt: updatedTask.completedAt
        };
      } else if (taskAction === 'tomorrow') {
        // Remove from current category, add to scheduled
        const [task] = taskList.splice(index, 1);
        state.dailyNote.tasks.scheduled.push({
          ...task,
          dueDate: updatedTask.dueDate
        });
      } else if (taskAction === 'today') {
        // Update dueDate in place
        taskList[index] = {
          ...taskList[index],
          dueDate: updatedTask.dueDate
        };
      }
      break;
    }
  }
});
```

### Modal Close with Timestamp
```typescript
// File: howAreYouSlice.ts

closeModal: (state) => {
  state.isOpen = false;
  // Update lastModalAt on close to prevent immediate reopen
  // This ensures the next interval counts from dismiss time
  const now = new Date().toISOString();
  state.lastModalAt = now;
  storeLastModal(now);
}
```

## Open Questions

1. **Task in different date context:**
   - What we know: User may be viewing a date different from the task's due date when check-in runs
   - What's unclear: Should the task appear/update in the viewed date's list or only when viewing the correct date?
   - Recommendation: Only update if task belongs to currently viewed date

2. **Overdue section handling:**
   - What we know: Overdue tasks are computed based on dueDate < today
   - What's unclear: If task is moved to "tomorrow", should it immediately leave overdue section?
   - Recommendation: Yes, move immediately since dueDate changes

## Sources

### Primary (HIGH confidence)
- Codebase analysis of:
  - `/frontend/src/store/howAreYouSlice.ts`
  - `/frontend/src/store/dailyNoteSlice.ts`
  - `/frontend/src/hooks/useAutoModal.ts`
  - `/frontend/src/components/how-are-you/CheckInFlow.tsx`
  - `/frontend/src/components/analysis/AnalysisResults.tsx`
  - `/frontend/src/App.tsx`

### Secondary (MEDIUM confidence)
- Redux Toolkit patterns for cross-slice communication

## Metadata

**Confidence breakdown:**
- Root cause analysis: HIGH - Based on direct code analysis
- Fix approaches: HIGH - Standard Redux patterns
- Edge cases: MEDIUM - Some scenarios need validation

**Research date:** 2026-01-22
**Valid until:** Stable - these are bug fixes, not dependent on external libraries
