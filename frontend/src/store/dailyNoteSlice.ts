import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { DailyNoteData, AnalysisResponse } from '@/types';

interface DailyNoteState {
  currentDate: string;
  rawContent: string;
  dailyNote: DailyNoteData | null;
  analysisPreview: AnalysisResponse | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

const getToday = () => new Date().toISOString().split('T')[0];

const initialState: DailyNoteState = {
  currentDate: getToday(),
  rawContent: '',
  dailyNote: null,
  analysisPreview: null,
  isAnalyzing: false,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const fetchDailyNote = createAsyncThunk(
  'dailyNote/fetch',
  async (date: string) => {
    const result = await api.dailyNote.get(date);
    return result;
  }
);

export const analyzeBrainDump = createAsyncThunk(
  'dailyNote/analyze',
  async ({ rawContent, date }: { rawContent: string; date: string }) => {
    const result = await api.brainDump.analyze(rawContent, date);
    return result;
  }
);

export const saveDailyNote = createAsyncThunk(
  'dailyNote/save',
  async (
    {
      rawContent,
      date,
      analysis,
    }: { rawContent: string; date: string; analysis: AnalysisResponse },
    { rejectWithValue }
  ) => {
    try {
      const result = await api.dailyNote.save({ rawContent, date, analysis });
      return result;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to save'
      );
    }
  }
);

export const toggleTaskComplete = createAsyncThunk(
  'dailyNote/toggleTask',
  async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
    const result = await api.task.update(id, { isCompleted });
    return result;
  }
);

export const deleteTask = createAsyncThunk(
  'dailyNote/deleteTask',
  async (id: number) => {
    await api.task.delete(id);
    return id;
  }
);

const dailyNoteSlice = createSlice({
  name: 'dailyNote',
  initialState,
  reducers: {
    setCurrentDate: (state, action: PayloadAction<string>) => {
      state.currentDate = action.payload;
      state.analysisPreview = null;
      state.rawContent = '';
    },
    setRawContent: (state, action: PayloadAction<string>) => {
      state.rawContent = action.payload;
    },
    clearAnalysisPreview: (state) => {
      state.analysisPreview = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyNote.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyNote = action.payload;
        if (action.payload?.rawContent) {
          state.rawContent = action.payload.rawContent;
        }
      })
      .addCase(fetchDailyNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch';
      })

      .addCase(analyzeBrainDump.pending, (state) => {
        state.isAnalyzing = true;
        state.error = null;
      })
      .addCase(analyzeBrainDump.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.analysisPreview = action.payload;
      })
      .addCase(analyzeBrainDump.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.error.message || 'Analysis failed';
      })

      .addCase(saveDailyNote.pending, (state) => {
        state.isSaving = true;
        state.error = null;
      })
      .addCase(saveDailyNote.fulfilled, (state, action) => {
        state.isSaving = false;
        state.dailyNote = action.payload;
        state.analysisPreview = null;
      })
      .addCase(saveDailyNote.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to save';
      })

      .addCase(toggleTaskComplete.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const task = action.payload;
          const categories = ['today', 'scheduled', 'someday'] as const;
          for (const category of categories) {
            const taskList = state.dailyNote.tasks[category];
            const index = taskList.findIndex((t) => t.id === task.id);
            if (index !== -1) {
              taskList[index] = { ...taskList[index], ...task };
              break;
            }
          }
        }
      })

      .addCase(deleteTask.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const taskId = action.payload;
          const categories = ['today', 'scheduled', 'someday'] as const;
          for (const category of categories) {
            state.dailyNote.tasks[category] = state.dailyNote.tasks[
              category
            ].filter((t) => t.id !== taskId);
          }
        }
      });
  },
});

export const {
  setCurrentDate,
  setRawContent,
  clearAnalysisPreview,
  clearError,
} = dailyNoteSlice.actions;

export default dailyNoteSlice.reducer;
