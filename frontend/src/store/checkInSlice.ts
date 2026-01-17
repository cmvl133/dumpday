import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { CheckInTask, CheckInStats } from '@/types';

interface CheckInState {
  isOpen: boolean;
  tasks: { overdue: CheckInTask[]; today: CheckInTask[] };
  currentIndex: number;
  combo: number;
  bestCombo: number;
  stats: CheckInStats;
  isLoading: boolean;
  lastCheckInAt: string | null;
  error: string | null;
}

const initialState: CheckInState = {
  isOpen: false,
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
  lastCheckInAt: null,
  error: null,
};

export const fetchCheckInTasks = createAsyncThunk(
  'checkIn/fetchTasks',
  async () => {
    const result = await api.checkIn.getTasks();
    return result;
  }
);

export const performTaskAction = createAsyncThunk(
  'checkIn/taskAction',
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
  'checkIn/complete',
  async (stats: CheckInStats) => {
    const result = await api.checkIn.complete(stats);
    return result;
  }
);

const checkInSlice = createSlice({
  name: 'checkIn',
  initialState,
  reducers: {
    openCheckIn: (state) => {
      state.isOpen = true;
      state.currentIndex = 0;
      state.combo = 0;
      state.bestCombo = 0;
      state.stats = {
        done: 0,
        tomorrow: 0,
        today: 0,
        dropped: 0,
        overdueCleared: 0,
        bestCombo: 0,
      };
      state.error = null;
      // Update lastCheckInAt when opening to prevent immediate re-open if dismissed
      state.lastCheckInAt = new Date().toISOString();
    },
    closeCheckIn: (state) => {
      state.isOpen = false;
    },
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
  },
  extraReducers: (builder) => {
    builder
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
        state.lastCheckInAt = action.payload.lastCheckInAt;
      })
      .addCase(fetchCheckInTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      .addCase(completeCheckIn.fulfilled, (state, action) => {
        state.lastCheckInAt = action.payload.checkIn.completedAt;
      });
  },
});

export const {
  openCheckIn,
  closeCheckIn,
  nextTask,
  incrementCombo,
  resetCombo,
  incrementStat,
} = checkInSlice.actions;

export default checkInSlice.reducer;
