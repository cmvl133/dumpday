# Phase 12: Frontend Slices - Research

**Researched:** 2026-01-22
**Domain:** Redux Toolkit Slice Organization
**Confidence:** HIGH

## Summary

The `howAreYouSlice.ts` (583 lines) is a monolithic slice managing three distinct flows: CheckIn, Planning, and Rebuild - all within a single modal interface. The codebase already has separate `checkInSlice.ts` and `planningSlice.ts` files that are NOT currently used (they appear to be earlier implementations or intended for refactoring). This creates duplication and confusion.

The howAreYouSlice has one critical cross-slice dependency: `dailyNoteSlice` imports `performTaskAction` thunk and uses it in `extraReducers` to sync task state when check-in actions occur. This pattern must be preserved.

**Primary recommendation:** Extract CheckIn, Planning, and Rebuild state into focused slices, keep a minimal "coordinator" slice for modal/mode state, and remove the unused duplicate slices.

## Current State Analysis

### howAreYouSlice.ts Breakdown (583 lines)

| Section | Lines | Purpose |
|---------|-------|---------|
| Imports & localStorage helpers | 1-43 | Modal state persistence |
| Type definitions | 45-96 | ModalMode, CheckInState, PlanningState, RebuildState, HowAreYouState |
| Initial states | 98-160 | Separate initial states for each flow |
| CheckIn thunks | 162-191 | `fetchCheckInTasks`, `performTaskAction`, `completeCheckIn` |
| Planning thunks | 193-226 | `fetchPlanningTasks`, `savePlanningTask`, `generateSchedule`, `acceptSchedule` |
| Rebuild thunks | 228-261 | `fetchRebuildData`, `generateRebuild`, `acceptRebuild` |
| Slice definition | 263-548 | Reducers organized by: Modal controls (267-301), CheckIn actions (303-322), Planning actions (324-405), Rebuild actions (407-434), extraReducers (436-548) |
| Exports | 551-583 | All action exports |

### Duplicate Slices Already Exist

**checkInSlice.ts (187 lines):**
- Has its own `CheckInState` interface (different shape than howAreYou version)
- Has `isOpen` field (modal state)
- Has `lastCheckInAt` field (vs. `lastModalAt` in howAreYou)
- Different localStorage key: `LAST_CHECK_IN_KEY` vs `LAST_MODAL_KEY`
- **NOT imported anywhere except store/index.ts**
- Reducers are NOT used by any component

**planningSlice.ts (358 lines):**
- Has its own `PlanningState` interface (similar to howAreYou but includes split state)
- Has `isOpen` field
- Includes extra "split" functionality not in howAreYou
- Different thunk action type prefixes: `planning/*` vs `howAreYou/*`
- **NOT imported anywhere except store/index.ts**
- Reducers are NOT used by any component

### Cross-Slice Dependencies

**Critical dependency (MUST preserve):**
```typescript
// dailyNoteSlice.ts line 4
import { performTaskAction } from './howAreYouSlice';

// dailyNoteSlice.ts extraReducers (line 555-596)
.addCase(performTaskAction.fulfilled, (state, action) => {
  // Syncs task state when check-in actions (done/tomorrow/today/drop) occur
})
```

**Other imports:**
- `useAutoModal.ts` imports `openModal` action
- `Header.tsx` imports `openModal` action
- `HowAreYouModal.tsx` imports `closeModal`, `selectMode`, `ModalMode`
- `ModeSelection.tsx` imports `ModalMode` type
- Flow components import their respective actions

### State Shape Differences

| Field | checkInSlice | howAreYouSlice.checkIn |
|-------|--------------|------------------------|
| `isOpen` | Yes (top-level) | No (on parent) |
| `lastCheckInAt` | Yes | No (`lastModalAt` on parent) |
| `tasks` | Same shape | Same shape |
| `stats` | Same shape | Same shape |

| Field | planningSlice | howAreYouSlice.planning |
|-------|---------------|-------------------------|
| `isOpen` | Yes (top-level) | No (on parent) |
| `split` | Yes (nested SplitState) | No |
| `error` | Yes (own field) | No (`error` on parent) |
| Other fields | Same | Same |

## Architecture Patterns

### Recommended New Structure

```
src/store/
├── index.ts                    # configureStore
├── hooks.ts                    # useAppDispatch, useAppSelector
├── howAreYouSlice.ts          # COORDINATOR: modal state + mode only (~50 lines)
├── checkInFlowSlice.ts        # CheckIn flow state + thunks (~150 lines)
├── planningFlowSlice.ts       # Planning flow state + thunks (~200 lines)
├── rebuildFlowSlice.ts        # Rebuild flow state + thunks (~150 lines)
├── checkInSlice.ts            # DELETE (unused duplicate)
├── planningSlice.ts           # DELETE or MERGE split functionality
└── [other existing slices]
```

### Pattern 1: Coordinator Slice

The modal/mode coordination should stay in a thin `howAreYouSlice`:

```typescript
// howAreYouSlice.ts - COORDINATOR ONLY
interface HowAreYouState {
  isOpen: boolean;
  mode: ModalMode;
  lastModalAt: string | null;
  error: string | null;
}

const howAreYouSlice = createSlice({
  name: 'howAreYou',
  initialState,
  reducers: {
    openModal,
    closeModal,
    selectMode,
    backToSelection,
    setError,
    clearError,
  },
  // No extraReducers needed - flows handle their own thunks
});
```

### Pattern 2: Flow Slices with extraReducers

Each flow slice handles its own state and responds to coordinator actions:

```typescript
// checkInFlowSlice.ts
import { selectMode, closeModal } from './howAreYouSlice';

const checkInFlowSlice = createSlice({
  name: 'checkInFlow',
  initialState,
  reducers: { /* flow-specific actions */ },
  extraReducers: (builder) => {
    builder
      .addCase(selectMode, (state, action) => {
        if (action.payload === 'checkin') {
          // Reset state when entering check-in mode
          return initialCheckInState;
        }
      })
      .addCase(closeModal, (state) => {
        // Optional: clear state on modal close
      })
      // Handle own async thunks
      .addCase(fetchCheckInTasks.fulfilled, ...)
  },
});
```

### Pattern 3: Cross-Slice Action Import

To maintain the `dailyNoteSlice` dependency, export `performTaskAction` from the new flow slice:

```typescript
// checkInFlowSlice.ts
export const performTaskAction = createAsyncThunk(
  'checkInFlow/taskAction',  // Note: new prefix
  async ({ taskId, action }) => {
    const result = await api.checkIn.taskAction(taskId, action);
    return { action, result };
  }
);

// dailyNoteSlice.ts - update import
import { performTaskAction } from './checkInFlowSlice';
```

### Anti-Patterns to Avoid

- **Circular imports:** Don't import flow actions into coordinator, use `extraReducers` pattern
- **Shared state at coordinator level:** Each flow owns its state completely
- **Duplicate types:** Define shared types once in types/index.ts or a shared types file
- **Mixed action prefixes:** Keep thunk prefixes matching slice name (e.g., `checkInFlow/*`)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-slice action listening | Manual dispatching in thunks | `extraReducers` builder pattern | Built-in Redux Toolkit pattern, avoids circular deps |
| State reset on mode change | Manual reset in each component | `extraReducers` responding to `selectMode` | Centralizes reset logic, DRY |
| Action type constants | Separate constants file | `slice.actions` auto-generated types | Redux Toolkit handles this |

## Common Pitfalls

### Pitfall 1: Circular Import Hell

**What goes wrong:** Flow slices import coordinator actions, coordinator imports flow slices
**Why it happens:** Trying to dispatch flow actions from coordinator
**How to avoid:** Coordinator is "dumb" - only manages modal/mode. Flows react to coordinator via `extraReducers`
**Warning signs:** TypeScript errors about undefined, or actions firing but state not updating

### Pitfall 2: Breaking Cross-Slice Dependencies

**What goes wrong:** `dailyNoteSlice` stops syncing with check-in actions after refactor
**Why it happens:** Changed thunk action type prefix or forgot to update import path
**How to avoid:** Update import path in dailyNoteSlice, verify action type string matches
**Warning signs:** Tasks marked done in check-in don't update in main view until page refresh

### Pitfall 3: Duplicate Type Definitions

**What goes wrong:** `CheckInState` defined differently in multiple files
**Why it happens:** Copy-paste from howAreYouSlice without consolidation
**How to avoid:** Extract types to `types/` or dedicated `store/types.ts`, import everywhere
**Warning signs:** TypeScript mismatches, runtime undefined errors

### Pitfall 4: localStorage Key Conflicts

**What goes wrong:** New slices use different keys, old values persist incorrectly
**Why it happens:** Each slice has its own localStorage helpers
**How to avoid:** Document localStorage keys, consider centralizing storage logic
**Warning signs:** Modal keeps reappearing, or check-in data from wrong session

### Pitfall 5: Breaking Component Imports

**What goes wrong:** Components fail to compile after slice split
**Why it happens:** Import paths changed, action names changed
**How to avoid:** Update all 7 component files that import from howAreYouSlice systematically
**Warning signs:** Build failures, missing action errors

## Code Examples

### Coordinator Slice (Target: ~50 lines)

```typescript
// howAreYouSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const LAST_MODAL_KEY = 'dopaminder_last_modal';

function getStoredLastModal(): string | null { /* existing logic */ }
function storeLastModal(value: string | null): void { /* existing logic */ }

export type ModalMode = 'selection' | 'checkin' | 'planning' | 'rebuild';

interface HowAreYouState {
  isOpen: boolean;
  mode: ModalMode;
  lastModalAt: string | null;
  error: string | null;
}

const initialState: HowAreYouState = {
  isOpen: false,
  mode: 'selection',
  lastModalAt: getStoredLastModal(),
  error: null,
};

const howAreYouSlice = createSlice({
  name: 'howAreYou',
  initialState,
  reducers: {
    openModal: (state) => {
      state.isOpen = true;
      state.mode = 'selection';
      state.error = null;
      const now = new Date().toISOString();
      state.lastModalAt = now;
      storeLastModal(now);
    },
    closeModal: (state) => {
      state.isOpen = false;
      const now = new Date().toISOString();
      state.lastModalAt = now;
      storeLastModal(now);
    },
    selectMode: (state, action: PayloadAction<ModalMode>) => {
      state.mode = action.payload;
      state.error = null;
    },
    backToSelection: (state) => {
      state.mode = 'selection';
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { openModal, closeModal, selectMode, backToSelection, setError, clearError } = howAreYouSlice.actions;
export default howAreYouSlice.reducer;
```

### Flow Slice Template

```typescript
// checkInFlowSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { selectMode, closeModal } from './howAreYouSlice';
import type { CheckInTask, CheckInStats } from '@/types';

interface CheckInFlowState {
  tasks: { overdue: CheckInTask[]; today: CheckInTask[] };
  currentIndex: number;
  combo: number;
  bestCombo: number;
  stats: CheckInStats;
  isLoading: boolean;
}

const initialState: CheckInFlowState = { /* ... */ };

// Thunks
export const fetchCheckInTasks = createAsyncThunk('checkInFlow/fetchTasks', async () => {
  return await api.checkIn.getTasks();
});

export const performTaskAction = createAsyncThunk(
  'checkInFlow/taskAction',
  async ({ taskId, action }: { taskId: number; action: 'done' | 'tomorrow' | 'today' | 'drop' }) => {
    const result = await api.checkIn.taskAction(taskId, action);
    return { action, result };
  }
);

export const completeCheckIn = createAsyncThunk('checkInFlow/complete', async (stats: CheckInStats) => {
  return await api.checkIn.complete(stats);
});

const checkInFlowSlice = createSlice({
  name: 'checkInFlow',
  initialState,
  reducers: {
    nextTask: (state) => { state.currentIndex += 1; },
    incrementCombo: (state) => { /* ... */ },
    resetCombo: (state) => { state.combo = 0; },
    incrementStat: (state, action: PayloadAction<keyof Omit<CheckInStats, 'bestCombo'>>) => {
      state.stats[action.payload] += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reset on mode selection
      .addCase(selectMode, (state, action) => {
        if (action.payload === 'checkin') {
          return { ...initialState };
        }
      })
      // Handle thunks
      .addCase(fetchCheckInTasks.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCheckInTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = { overdue: action.payload.overdue, today: action.payload.today };
      })
      // ... other cases
  },
});

export const { nextTask, incrementCombo, resetCombo, incrementStat } = checkInFlowSlice.actions;
export default checkInFlowSlice.reducer;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single monolithic slice | Feature-based slices | Redux Toolkit 1.0+ | Better maintainability |
| combineReducers only | combineSlices (RTK 2.0) | RTK 2.0 (Dec 2023) | Supports lazy loading |
| Manual action type strings | createSlice auto-generation | RTK 1.0+ | Less boilerplate |

**Note:** This project uses RTK 2.5.0, so `combineSlices` is available but NOT NEEDED for this refactor. Standard `configureStore` with `reducer` object is sufficient.

## Component Import Updates Required

The following files import from `howAreYouSlice` and must be updated:

| File | Current Imports | New Imports |
|------|-----------------|-------------|
| `HowAreYouModal.tsx` | closeModal, selectMode, ModalMode | howAreYouSlice (unchanged) |
| `ModeSelection.tsx` | ModalMode | howAreYouSlice (unchanged) |
| `CheckInFlow.tsx` | 8 actions + thunks | checkInFlowSlice |
| `PlanningFlow.tsx` | 15 actions + thunks | planningFlowSlice |
| `RebuildFlow.tsx` | 8 actions + thunks | rebuildFlowSlice |
| `useAutoModal.ts` | openModal | howAreYouSlice (unchanged) |
| `Header.tsx` | openModal | howAreYouSlice (unchanged) |
| `dailyNoteSlice.ts` | performTaskAction | checkInFlowSlice |

## Files to Delete

After migration:
- `checkInSlice.ts` - unused duplicate, can be deleted
- `planningSlice.ts` - EVALUATE: has split functionality not in howAreYouSlice, may be needed for Phase 8 (AI Planning Fixes)

## Open Questions

1. **planningSlice.ts split functionality**
   - What we know: Has `SplitState`, `fetchSplitProposal`, `executeSplit` thunks
   - What's unclear: Is this used anywhere? Is it for future AI planning features?
   - Recommendation: Check if any components import from it before deleting

2. **localStorage consolidation**
   - What we know: Multiple localStorage keys used across slices
   - What's unclear: Whether Phase 13 will address this
   - Recommendation: Document keys, but don't consolidate in this phase

## Sources

### Primary (HIGH confidence)
- Code analysis of `/home/kamil/Code/dumpday/frontend/src/store/howAreYouSlice.ts`
- Code analysis of `/home/kamil/Code/dumpday/frontend/src/store/checkInSlice.ts`
- Code analysis of `/home/kamil/Code/dumpday/frontend/src/store/planningSlice.ts`
- Code analysis of `/home/kamil/Code/dumpday/frontend/src/store/dailyNoteSlice.ts`
- [Redux Toolkit createSlice docs](https://redux-toolkit.js.org/api/createSlice)
- [Redux Splitting Reducer Logic](https://redux.js.org/usage/structuring-reducers/splitting-reducer-logic)

### Secondary (MEDIUM confidence)
- [Redux Toolkit Usage Guide](https://redux-toolkit.js.org/usage/usage-guide)
- [Redux Code Splitting](https://redux.js.org/usage/code-splitting)
- [Redux Toolkit Circular Dependencies Solution](https://yuji.wordpress.com/2021/03/16/redux-toolkit-solving-circular-action-dependencies/)

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH - direct code inspection
- Split pattern: HIGH - established Redux Toolkit pattern
- Cross-slice deps: HIGH - verified in codebase
- Component updates: HIGH - verified via grep

**Research date:** 2026-01-22
**Valid until:** 60 days (stable patterns, no major RTK updates expected)
