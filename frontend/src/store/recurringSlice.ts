import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { RecurringTask, RecurrenceType, TaskCategory } from '@/types';

interface RecurringState {
  recurringTasks: RecurringTask[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecurringState = {
  recurringTasks: [],
  isLoading: false,
  error: null,
};

export const fetchRecurringTasks = createAsyncThunk(
  'recurring/fetch',
  async () => {
    return await api.recurring.list();
  }
);

export const createRecurringTask = createAsyncThunk(
  'recurring/create',
  async (data: {
    title: string;
    recurrenceType: RecurrenceType;
    recurrenceDays?: number[] | null;
    startDate?: string;
    endDate?: string | null;
    category?: TaskCategory;
    estimatedMinutes?: number | null;
    fixedTime?: string | null;
    linkTaskId?: number;
  }) => {
    return await api.recurring.create(data);
  }
);

export const updateRecurringTask = createAsyncThunk(
  'recurring/update',
  async ({ id, data }: { id: number; data: Partial<Omit<RecurringTask, 'id' | 'createdAt'>> }) => {
    return await api.recurring.update(id, data);
  }
);

export const deleteRecurringTask = createAsyncThunk(
  'recurring/delete',
  async (id: number) => {
    await api.recurring.delete(id);
    return id;
  }
);

export const deleteRecurringTaskAll = createAsyncThunk(
  'recurring/deleteAll',
  async (id: number) => {
    await api.recurring.deleteAll(id);
    return id;
  }
);

export const syncRecurringTasks = createAsyncThunk(
  'recurring/sync',
  async (date?: string) => {
    return await api.recurring.sync(date);
  }
);

const recurringSlice = createSlice({
  name: 'recurring',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchRecurringTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecurringTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recurringTasks = action.payload;
      })
      .addCase(fetchRecurringTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch recurring tasks';
      })
      // Create
      .addCase(createRecurringTask.fulfilled, (state, action) => {
        state.recurringTasks.unshift(action.payload);
      })
      .addCase(createRecurringTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create recurring task';
      })
      // Update
      .addCase(updateRecurringTask.fulfilled, (state, action) => {
        const index = state.recurringTasks.findIndex((rt) => rt.id === action.payload.id);
        if (index !== -1) {
          state.recurringTasks[index] = action.payload;
        }
      })
      .addCase(updateRecurringTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update recurring task';
      })
      // Delete (soft delete - becomes inactive)
      .addCase(deleteRecurringTask.fulfilled, (state, action) => {
        state.recurringTasks = state.recurringTasks.filter((rt) => rt.id !== action.payload);
      })
      .addCase(deleteRecurringTask.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete recurring task';
      })
      // Delete all (hard delete)
      .addCase(deleteRecurringTaskAll.fulfilled, (state, action) => {
        state.recurringTasks = state.recurringTasks.filter((rt) => rt.id !== action.payload);
      })
      .addCase(deleteRecurringTaskAll.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete recurring task';
      });
  },
});

export const { clearError } = recurringSlice.actions;
export default recurringSlice.reducer;
