import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';
import { selectMode, closeModal } from './howAreYouSlice';
import type { CheckInTask, CheckInStats } from '@/types';

// State interface
export interface CheckInFlowState {
  tasks: { overdue: CheckInTask[]; today: CheckInTask[] };
  currentIndex: number;
  combo: number;
  bestCombo: number;
  stats: CheckInStats;
  isLoading: boolean;
  lastCheckInAt: string | null;
  error: string | null;
}

const initialState: CheckInFlowState = {
  tasks: { overdue: [], today: [] },
  currentIndex: 0,
  combo: 0,
  bestCombo: 0,
  stats: {
    done: 0,
    tomorrow: 0,
    today: 0,
    dropped: 0,
    overdueCleared: 0,
    bestCombo: 0,
  },
  isLoading: false,
  lastCheckInAt: getStorageItem(STORAGE_KEYS.LAST_MODAL, null),
  error: null,
};

// Async thunks with new action type prefixes
export const fetchCheckInTasks = createAsyncThunk(
  'checkInFlow/fetchTasks',
  async () => {
    const result = await api.checkIn.getTasks();
    return result;
  }
);

export const performTaskAction = createAsyncThunk(
  'checkInFlow/taskAction',
  async ({
    taskId,
    action,
  }: {
    taskId: number;
    action: 'done' | 'tomorrow' | 'today' | 'drop';
  }) => {
    const result = await api.checkIn.taskAction(taskId, action);
    return { action, result };
  }
);

export const completeCheckIn = createAsyncThunk(
  'checkInFlow/complete',
  async (stats: CheckInStats) => {
    const result = await api.checkIn.complete(stats);
    return result;
  }
);

const checkInFlowSlice = createSlice({
  name: 'checkInFlow',
  initialState,
  reducers: {
    nextTask: (state) => {
      state.currentIndex += 1;
    },
    incrementCombo: (state) => {
      state.combo += 1;
      if (state.combo > state.bestCombo) {
        state.bestCombo = state.combo;
        state.stats.bestCombo = state.combo;
      }
    },
    resetCombo: (state) => {
      state.combo = 0;
    },
    incrementStat: (
      state,
      action: PayloadAction<keyof Omit<CheckInStats, 'bestCombo'>>
    ) => {
      state.stats[action.payload] += 1;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Reset state when checkin mode is selected
      .addCase(selectMode, (state, action) => {
        if (action.payload === 'checkin') {
          // Reset to initial state but preserve lastCheckInAt
          const lastCheckInAt = state.lastCheckInAt;
          Object.assign(state, { ...initialState, lastCheckInAt });
        }
      })
      // Optionally clear state when modal closes
      .addCase(closeModal, (state) => {
        // Reset to initial state but preserve lastCheckInAt
        const lastCheckInAt = state.lastCheckInAt;
        Object.assign(state, { ...initialState, lastCheckInAt });
      })
      // fetchCheckInTasks thunk
      .addCase(fetchCheckInTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCheckInTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = {
          overdue: action.payload.overdue,
          today: action.payload.today,
        };
        // Sync lastCheckInAt with API response
        const apiLastModal = action.payload.lastCheckInAt;
        if (apiLastModal) {
          const apiDate = new Date(apiLastModal).getTime();
          const localDate = state.lastCheckInAt ? new Date(state.lastCheckInAt).getTime() : 0;
          if (apiDate > localDate) {
            state.lastCheckInAt = apiLastModal;
            setStorageItem(STORAGE_KEYS.LAST_MODAL, apiLastModal);
          }
        }
      })
      .addCase(fetchCheckInTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      // completeCheckIn thunk
      .addCase(completeCheckIn.fulfilled, (state, action) => {
        const completedAt = action.payload.checkIn.completedAt;
        state.lastCheckInAt = completedAt;
        setStorageItem(STORAGE_KEYS.LAST_MODAL, completedAt);
      });
  },
});

export const {
  nextTask,
  incrementCombo,
  resetCombo,
  incrementStat,
  clearError,
} = checkInFlowSlice.actions;

export default checkInFlowSlice.reducer;
