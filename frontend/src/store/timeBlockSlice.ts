import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { TimeBlock, RecurrenceType } from '@/types';

interface TimeBlockState {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TimeBlockState = {
  timeBlocks: [],
  isLoading: false,
  error: null,
};

export const fetchTimeBlocks = createAsyncThunk('timeBlocks/fetch', async () => {
  const result = await api.timeBlock.list();
  return result;
});

export const createTimeBlock = createAsyncThunk(
  'timeBlocks/create',
  async (data: {
    name: string;
    color: string;
    startTime: string;
    endTime: string;
    recurrenceType?: RecurrenceType;
    recurrenceDays?: number[] | null;
    tagIds?: number[];
  }) => {
    const result = await api.timeBlock.create(data);
    return result;
  }
);

export const updateTimeBlock = createAsyncThunk(
  'timeBlocks/update',
  async ({
    id,
    data,
  }: {
    id: number;
    data: Partial<Omit<TimeBlock, 'id' | 'createdAt' | 'tags'>> & { tagIds?: number[] };
  }) => {
    const result = await api.timeBlock.update(id, data);
    return result;
  }
);

export const deleteTimeBlock = createAsyncThunk('timeBlocks/delete', async (id: number) => {
  await api.timeBlock.delete(id);
  return id;
});

const timeBlockSlice = createSlice({
  name: 'timeBlocks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeBlocks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimeBlocks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timeBlocks = action.payload;
      })
      .addCase(fetchTimeBlocks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch time blocks';
      })
      .addCase(createTimeBlock.fulfilled, (state, action) => {
        state.timeBlocks.push(action.payload);
      })
      .addCase(updateTimeBlock.fulfilled, (state, action) => {
        const index = state.timeBlocks.findIndex((tb) => tb.id === action.payload.id);
        if (index !== -1) {
          state.timeBlocks[index] = action.payload;
        }
      })
      .addCase(deleteTimeBlock.fulfilled, (state, action) => {
        state.timeBlocks = state.timeBlocks.filter((tb) => tb.id !== action.payload);
      });
  },
});

export const { clearError } = timeBlockSlice.actions;
export default timeBlockSlice.reducer;
