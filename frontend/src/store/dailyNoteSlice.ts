import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { calculateTopPercent, calculateHeightPercent } from '@/lib/utils';
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

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

// Task operations
export const toggleTaskComplete = createAsyncThunk(
  'dailyNote/toggleTask',
  async ({ id, isCompleted }: { id: number; isCompleted: boolean }) => {
    const result = await api.task.update(id, { isCompleted });
    return result;
  }
);

export const updateTask = createAsyncThunk(
  'dailyNote/updateTask',
  async ({ id, title }: { id: number; title: string }) => {
    const result = await api.task.update(id, { title });
    return result;
  }
);

export const updateTaskDueDate = createAsyncThunk(
  'dailyNote/updateTaskDueDate',
  async (
    { id, dueDate }: { id: number; dueDate: string | null },
    { dispatch, getState }
  ) => {
    await api.task.update(id, { dueDate });
    // Refetch to get correct task categorization from backend
    const state = getState() as { dailyNote: DailyNoteState };
    dispatch(fetchDailyNote(state.dailyNote.currentDate));
  }
);

export const deleteTask = createAsyncThunk(
  'dailyNote/deleteTask',
  async (id: number) => {
    await api.task.delete(id);
    return id;
  }
);

// Event operations
export const updateEvent = createAsyncThunk(
  'dailyNote/updateEvent',
  async ({
    id,
    data,
  }: {
    id: number;
    data: { title?: string; startTime?: string; endTime?: string };
  }) => {
    const result = await api.event.update(id, data);
    return result;
  }
);

export const deleteEvent = createAsyncThunk(
  'dailyNote/deleteEvent',
  async (id: number) => {
    await api.event.delete(id);
    return id;
  }
);

// Journal operations
export const updateJournalEntry = createAsyncThunk(
  'dailyNote/updateJournal',
  async ({ id, content }: { id: number; content: string }) => {
    const result = await api.journal.update(id, { content });
    return result;
  }
);

export const deleteJournalEntry = createAsyncThunk(
  'dailyNote/deleteJournal',
  async (id: number) => {
    await api.journal.delete(id);
    return id;
  }
);

// Note operations
export const updateNote = createAsyncThunk(
  'dailyNote/updateNote',
  async ({ id, content }: { id: number; content: string }) => {
    const result = await api.note.update(id, { content });
    return result;
  }
);

export const deleteNote = createAsyncThunk(
  'dailyNote/deleteNote',
  async (id: number) => {
    await api.note.delete(id);
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
        // Don't restore rawContent - user should start fresh each time
        state.rawContent = '';
        state.analysisPreview = null;
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
        state.rawContent = ''; // Clear brain dump after save
      })
      .addCase(saveDailyNote.rejected, (state, action) => {
        state.isSaving = false;
        state.error = (action.payload as string) || 'Failed to save';
      })

      // Task handlers
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

      .addCase(updateTask.fulfilled, (state, action) => {
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
      })

      // Event handlers
      .addCase(updateEvent.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const updatedEvent = action.payload;
          const index = state.dailyNote.events.findIndex(
            (e) => e.id === updatedEvent.id
          );
          if (index !== -1) {
            state.dailyNote.events[index] = {
              ...state.dailyNote.events[index],
              ...updatedEvent,
            };
          }
          // Also update schedule with recalculated positions
          const scheduleIndex = state.dailyNote.schedule.findIndex(
            (e) => e.id === updatedEvent.id
          );
          if (scheduleIndex !== -1) {
            const newStartTime = updatedEvent.startTime;
            const newEndTime = updatedEvent.endTime;
            state.dailyNote.schedule[scheduleIndex] = {
              ...state.dailyNote.schedule[scheduleIndex],
              ...updatedEvent,
              topPercent: calculateTopPercent(newStartTime),
              heightPercent: calculateHeightPercent(newStartTime, newEndTime),
            };
          }
        }
      })

      .addCase(deleteEvent.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const eventId = action.payload;
          state.dailyNote.events = state.dailyNote.events.filter(
            (e) => e.id !== eventId
          );
          state.dailyNote.schedule = state.dailyNote.schedule.filter(
            (e) => e.id !== eventId
          );
        }
      })

      // Journal handlers
      .addCase(updateJournalEntry.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const updated = action.payload;
          const index = state.dailyNote.journal.findIndex(
            (j) => j.id === updated.id
          );
          if (index !== -1) {
            state.dailyNote.journal[index] = {
              ...state.dailyNote.journal[index],
              ...updated,
            };
          }
        }
      })

      .addCase(deleteJournalEntry.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const id = action.payload;
          state.dailyNote.journal = state.dailyNote.journal.filter(
            (j) => j.id !== id
          );
        }
      })

      // Note handlers
      .addCase(updateNote.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const updated = action.payload;
          const index = state.dailyNote.notes.findIndex(
            (n) => n.id === updated.id
          );
          if (index !== -1) {
            state.dailyNote.notes[index] = {
              ...state.dailyNote.notes[index],
              ...updated,
            };
          }
        }
      })

      .addCase(deleteNote.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const id = action.payload;
          state.dailyNote.notes = state.dailyNote.notes.filter(
            (n) => n.id !== id
          );
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
