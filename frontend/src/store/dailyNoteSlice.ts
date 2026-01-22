import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { calculateTopPercent, calculateHeightPercent } from '@/lib/utils';
import { performTaskAction } from './checkInFlowSlice';
import type { DailyNoteData, AnalysisResponse, TaskCategory } from '@/types';

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
    // In dev mode, sync recurring tasks before fetching daily note
    if (import.meta.env.DEV) {
      try {
        await api.recurring.sync(date);
      } catch {
        // Ignore sync errors in dev mode - endpoint may not be available
      }
    }
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
export const createTask = createAsyncThunk(
  'dailyNote/createTask',
  async ({
    title,
    date,
    dueDate,
    category,
  }: {
    title: string;
    date: string;
    dueDate?: string | null;
    category?: TaskCategory;
  }) => {
    const result = await api.task.create({ title, date, dueDate, category });
    return { task: result, category: category || 'today' };
  }
);

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

export const updateTaskFixedTime = createAsyncThunk(
  'dailyNote/updateTaskFixedTime',
  async ({ id, fixedTime }: { id: number; fixedTime: string | null }) => {
    const result = await api.task.update(id, { fixedTime });
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

// Event operations
export const createEvent = createAsyncThunk(
  'dailyNote/createEvent',
  async ({
    title,
    date,
    startTime,
    endTime,
  }: {
    title: string;
    date: string;
    startTime: string;
    endTime?: string | null;
  }) => {
    const result = await api.event.create({ title, date, startTime, endTime });
    return result;
  }
);

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
export const createJournalEntry = createAsyncThunk(
  'dailyNote/createJournal',
  async ({ content, date }: { content: string; date: string }) => {
    const result = await api.journal.create({ content, date });
    return result;
  }
);

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
export const createNote = createAsyncThunk(
  'dailyNote/createNote',
  async ({ content, date }: { content: string; date: string }) => {
    const result = await api.note.create({ content, date });
    return result;
  }
);

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

// Tag operations
export const assignTaskTags = createAsyncThunk(
  'dailyNote/assignTaskTags',
  async ({ id, tagIds }: { id: number; tagIds: number[] }) => {
    const result = await api.task.assignTags(id, tagIds);
    return result;
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
    updateTaskRecurringId: (
      state,
      action: PayloadAction<{ taskId: number; recurringTaskId: number }>
    ) => {
      if (state.dailyNote) {
        const { taskId, recurringTaskId } = action.payload;
        const categories = ['today', 'scheduled', 'someday'] as const;
        for (const category of categories) {
          const taskList = state.dailyNote.tasks[category];
          const index = taskList.findIndex((t) => t.id === taskId);
          if (index !== -1) {
            taskList[index] = { ...taskList[index], recurringTaskId };
            break;
          }
        }
      }
    },
    clearTaskRecurringId: (state, action: PayloadAction<{ taskId: number }>) => {
      if (state.dailyNote) {
        const { taskId } = action.payload;
        const categories = ['today', 'scheduled', 'someday'] as const;
        for (const category of categories) {
          const taskList = state.dailyNote.tasks[category];
          const index = taskList.findIndex((t) => t.id === taskId);
          if (index !== -1) {
            taskList[index] = { ...taskList[index], recurringTaskId: null };
            break;
          }
        }
      }
    },
    removeTaskFromUI: (state, action: PayloadAction<{ taskId: number }>) => {
      if (state.dailyNote) {
        const { taskId } = action.payload;
        const categories = ['today', 'scheduled', 'someday'] as const;
        for (const category of categories) {
          state.dailyNote.tasks[category] = state.dailyNote.tasks[category].filter(
            (t) => t.id !== taskId
          );
        }
      }
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
      .addCase(createTask.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const { task, category } = action.payload;
          state.dailyNote.tasks[category as 'today' | 'scheduled' | 'someday'].push(task);
        }
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

      .addCase(updateTaskFixedTime.fulfilled, (state, action) => {
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
      .addCase(createEvent.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const event = action.payload;
          // Add to events array
          state.dailyNote.events.push(event);
          // Add to schedule with calculated positions
          state.dailyNote.schedule.push({
            ...event,
            topPercent: calculateTopPercent(event.startTime),
            heightPercent: calculateHeightPercent(event.startTime, event.endTime),
          });
        }
      })

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
      .addCase(createJournalEntry.fulfilled, (state, action) => {
        if (state.dailyNote) {
          state.dailyNote.journal.push(action.payload);
        }
      })

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
      .addCase(createNote.fulfilled, (state, action) => {
        if (state.dailyNote) {
          state.dailyNote.notes.push(action.payload);
        }
      })

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
      })

      // Tag handlers
      .addCase(assignTaskTags.fulfilled, (state, action) => {
        if (state.dailyNote) {
          const task = action.payload;
          const categories = ['today', 'scheduled', 'someday', 'overdue'] as const;
          for (const category of categories) {
            const taskList = state.dailyNote.tasks[category];
            if (taskList) {
              const index = taskList.findIndex((t) => t.id === task.id);
              if (index !== -1) {
                taskList[index] = { ...taskList[index], tags: task.tags };
                break;
              }
            }
          }
        }
      })

      // Cross-slice: Update task when check-in actions are performed
      .addCase(performTaskAction.fulfilled, (state, action) => {
        if (!state.dailyNote) return;

        const { action: taskAction, result } = action.payload;
        const updatedTask = result.task;
        const categories = ['today', 'scheduled', 'someday', 'overdue'] as const;

        // Find the task in any category
        for (const category of categories) {
          const taskList = state.dailyNote.tasks[category];
          if (!taskList) continue;

          const index = taskList.findIndex((t) => t.id === updatedTask.id);
          if (index !== -1) {
            if (taskAction === 'done') {
              // Mark as completed in place
              taskList[index] = {
                ...taskList[index],
                isCompleted: true,
                completedAt: updatedTask.completedAt,
              };
            } else if (taskAction === 'tomorrow') {
              // Remove from current category, add to scheduled
              const [task] = taskList.splice(index, 1);
              state.dailyNote.tasks.scheduled.push({
                ...task,
                dueDate: updatedTask.dueDate,
              });
            } else if (taskAction === 'today') {
              // Update dueDate in place (task stays in current category for now)
              taskList[index] = {
                ...taskList[index],
                dueDate: updatedTask.dueDate,
              };
            } else if (taskAction === 'drop') {
              // Remove from list entirely
              taskList.splice(index, 1);
            }
            break;
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
  updateTaskRecurringId,
  clearTaskRecurringId,
  removeTaskFromUI,
} = dailyNoteSlice.actions;

export default dailyNoteSlice.reducer;
