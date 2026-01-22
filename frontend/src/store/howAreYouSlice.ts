import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type {
  CheckInTask,
  CheckInStats,
  PlanningTask,
  PlanningEvent,
  PlanningTaskData,
  GeneratedSchedule,
  PlanningStats,
  ScheduleSuggestion,
  RebuildParsedItems,
  Task,
} from '@/types';

const LAST_MODAL_KEY = 'dopaminder_last_modal';

function getStoredLastModal(): string | null {
  try {
    const stored = localStorage.getItem(LAST_MODAL_KEY);
    if (stored) {
      const date = new Date(stored);
      if (!isNaN(date.getTime())) {
        return stored;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function storeLastModal(value: string | null): void {
  try {
    if (value) {
      localStorage.setItem(LAST_MODAL_KEY, value);
    } else {
      localStorage.removeItem(LAST_MODAL_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export type ModalMode = 'selection' | 'checkin' | 'planning' | 'rebuild';
export type RebuildStep = 'whats_happening' | 'anything_else' | 'work_until' | 'preview';
type PlanningStep = 'estimation' | 'fixed_time' | 'combine';
type PlanningPhase = 'conflicts' | 'planning' | 'summary';

interface CheckInState {
  tasks: { overdue: CheckInTask[]; today: CheckInTask[] };
  currentIndex: number;
  combo: number;
  bestCombo: number;
  stats: CheckInStats;
  isLoading: boolean;
}

interface PlanningState {
  tasks: PlanningTask[];
  conflictingTasks: PlanningTask[];
  events: PlanningEvent[];
  currentPhase: PlanningPhase;
  currentIndex: number;
  currentStep: PlanningStep;
  taskPlanData: Record<number, PlanningTaskData>;
  resolvedConflicts: Record<number, 'keep' | 'reschedule'>;
  generatedSchedule: GeneratedSchedule | null;
  stats: PlanningStats;
  isLoading: boolean;
  isGenerating: boolean;
}

interface RebuildState {
  step: RebuildStep;
  tasks: Task[];
  events: PlanningEvent[];
  selectedTaskIds: number[];
  selectedEventIds: number[];
  additionalInput: string;
  workUntilTime: string;
  parsedItems: RebuildParsedItems;
  generatedSchedule: GeneratedSchedule | null;
  isLoading: boolean;
  isGenerating: boolean;
}

interface HowAreYouState {
  isOpen: boolean;
  mode: ModalMode;
  checkIn: CheckInState;
  planning: PlanningState;
  rebuild: RebuildState;
  lastModalAt: string | null;
  error: string | null;
}

const initialCheckInState: CheckInState = {
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
};

const initialPlanningState: PlanningState = {
  tasks: [],
  conflictingTasks: [],
  events: [],
  currentPhase: 'conflicts',
  currentIndex: 0,
  currentStep: 'estimation',
  taskPlanData: {},
  resolvedConflicts: {},
  generatedSchedule: null,
  stats: {
    totalTasks: 0,
    planned: 0,
    skipped: 0,
    totalMinutes: 0,
  },
  isLoading: false,
  isGenerating: false,
};

const initialRebuildState: RebuildState = {
  step: 'whats_happening',
  tasks: [],
  events: [],
  selectedTaskIds: [],
  selectedEventIds: [],
  additionalInput: '',
  workUntilTime: '18:00',
  parsedItems: {
    newTasks: [],
    journalEntries: 0,
    notes: 0,
  },
  generatedSchedule: null,
  isLoading: false,
  isGenerating: false,
};

const initialState: HowAreYouState = {
  isOpen: false,
  mode: 'selection',
  checkIn: initialCheckInState,
  planning: initialPlanningState,
  rebuild: initialRebuildState,
  lastModalAt: getStoredLastModal(),
  error: null,
};

// Check-in async thunks
export const fetchCheckInTasks = createAsyncThunk(
  'howAreYou/fetchCheckInTasks',
  async () => {
    const result = await api.checkIn.getTasks();
    return result;
  }
);

export const performTaskAction = createAsyncThunk(
  'howAreYou/taskAction',
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
  'howAreYou/completeCheckIn',
  async (stats: CheckInStats) => {
    const result = await api.checkIn.complete(stats);
    return result;
  }
);

// Planning async thunks
export const fetchPlanningTasks = createAsyncThunk(
  'howAreYou/fetchPlanningTasks',
  async () => {
    const result = await api.planning.getTasks();
    return result;
  }
);

export const savePlanningTask = createAsyncThunk(
  'howAreYou/savePlanningTask',
  async ({ taskId, data }: { taskId: number; data: PlanningTaskData }) => {
    const result = await api.planning.saveTask(taskId, data);
    return { taskId, data, result };
  }
);

export const generateSchedule = createAsyncThunk(
  'howAreYou/generateSchedule',
  async (taskIds: number[]) => {
    const result = await api.planning.generateSchedule(taskIds);
    return result;
  }
);

export const acceptSchedule = createAsyncThunk(
  'howAreYou/acceptSchedule',
  async (modifiedSchedule: ScheduleSuggestion[] | undefined, { getState }) => {
    const state = getState() as { howAreYou: HowAreYouState };
    const schedule = modifiedSchedule || state.howAreYou.planning.generatedSchedule?.schedule || [];
    await api.planning.acceptSchedule(schedule);
    return schedule;
  }
);

// Rebuild async thunks
export const fetchRebuildData = createAsyncThunk(
  'howAreYou/fetchRebuildData',
  async () => {
    // Reuse planning tasks endpoint to get today's tasks and events
    const result = await api.planning.getTasks();
    return result;
  }
);

export const generateRebuild = createAsyncThunk(
  'howAreYou/generateRebuild',
  async (_, { getState }) => {
    const state = getState() as { howAreYou: HowAreYouState };
    const { selectedTaskIds, selectedEventIds, additionalInput, workUntilTime } = state.howAreYou.rebuild;
    const result = await api.rebuild.generate({
      keepTaskIds: selectedTaskIds,
      keepEventIds: selectedEventIds,
      additionalInput: additionalInput.trim() || null,
      workUntilTime,
    });
    return result;
  }
);

export const acceptRebuild = createAsyncThunk(
  'howAreYou/acceptRebuild',
  async (modifiedSchedule: ScheduleSuggestion[] | undefined, { getState }) => {
    const state = getState() as { howAreYou: HowAreYouState };
    const schedule = modifiedSchedule || state.howAreYou.rebuild.generatedSchedule?.schedule || [];
    await api.rebuild.accept(schedule);
    return schedule;
  }
);

const howAreYouSlice = createSlice({
  name: 'howAreYou',
  initialState,
  reducers: {
    // Modal controls
    openModal: (state) => {
      state.isOpen = true;
      state.mode = 'selection';
      state.error = null;
      // Update lastModalAt when opening to prevent immediate re-open if dismissed
      const now = new Date().toISOString();
      state.lastModalAt = now;
      storeLastModal(now);
    },
    closeModal: (state) => {
      state.isOpen = false;
      // Update lastModalAt on close to prevent immediate reopen
      // This ensures the next interval counts from dismiss time, not open time
      const now = new Date().toISOString();
      state.lastModalAt = now;
      storeLastModal(now);
    },
    selectMode: (state, action: PayloadAction<ModalMode>) => {
      state.mode = action.payload;
      state.error = null;

      // Reset the appropriate mode state
      if (action.payload === 'checkin') {
        state.checkIn = { ...initialCheckInState };
      } else if (action.payload === 'planning') {
        state.planning = { ...initialPlanningState };
      } else if (action.payload === 'rebuild') {
        state.rebuild = { ...initialRebuildState };
      }
    },
    backToSelection: (state) => {
      state.mode = 'selection';
      state.error = null;
    },

    // Check-in actions
    nextCheckInTask: (state) => {
      state.checkIn.currentIndex += 1;
    },
    incrementCombo: (state) => {
      state.checkIn.combo += 1;
      if (state.checkIn.combo > state.checkIn.bestCombo) {
        state.checkIn.bestCombo = state.checkIn.combo;
        state.checkIn.stats.bestCombo = state.checkIn.combo;
      }
    },
    resetCombo: (state) => {
      state.checkIn.combo = 0;
    },
    incrementStat: (
      state,
      action: PayloadAction<keyof Omit<CheckInStats, 'bestCombo'>>
    ) => {
      state.checkIn.stats[action.payload] += 1;
    },

    // Planning actions
    nextPlanningStep: (state) => {
      if (state.planning.currentStep === 'estimation') {
        state.planning.currentStep = 'fixed_time';
      } else if (state.planning.currentStep === 'fixed_time') {
        state.planning.currentStep = 'combine';
      }
    },
    previousPlanningStep: (state) => {
      if (state.planning.currentStep === 'combine') {
        state.planning.currentStep = 'fixed_time';
      } else if (state.planning.currentStep === 'fixed_time') {
        state.planning.currentStep = 'estimation';
      }
    },
    nextPlanningTask: (state) => {
      state.planning.currentIndex += 1;
      state.planning.currentStep = 'estimation';
    },
    skipPlanningTask: (state) => {
      state.planning.stats.skipped += 1;
      state.planning.currentIndex += 1;
      state.planning.currentStep = 'estimation';
    },
    setEstimation: (state, action: PayloadAction<{ taskId: number; minutes: number }>) => {
      const { taskId, minutes } = action.payload;
      if (!state.planning.taskPlanData[taskId]) {
        state.planning.taskPlanData[taskId] = {};
      }
      state.planning.taskPlanData[taskId].estimatedMinutes = minutes;
      state.planning.stats.totalMinutes += minutes;
    },
    setFixedTime: (state, action: PayloadAction<{ taskId: number; time: string | null }>) => {
      const { taskId, time } = action.payload;
      if (!state.planning.taskPlanData[taskId]) {
        state.planning.taskPlanData[taskId] = {};
      }
      state.planning.taskPlanData[taskId].fixedTime = time;
    },
    setCombineEvents: (state, action: PayloadAction<{ taskId: number; eventIds: number[] }>) => {
      const { taskId, eventIds } = action.payload;
      if (!state.planning.taskPlanData[taskId]) {
        state.planning.taskPlanData[taskId] = {};
      }
      state.planning.taskPlanData[taskId].canCombineWithEvents = eventIds;
      state.planning.taskPlanData[taskId].needsFullFocus = false;
    },
    setNeedsFullFocus: (state, action: PayloadAction<{ taskId: number; needsFocus: boolean }>) => {
      const { taskId, needsFocus } = action.payload;
      if (!state.planning.taskPlanData[taskId]) {
        state.planning.taskPlanData[taskId] = {};
      }
      state.planning.taskPlanData[taskId].needsFullFocus = needsFocus;
      if (needsFocus) {
        state.planning.taskPlanData[taskId].canCombineWithEvents = null;
      }
    },
    markTaskPlanned: (state) => {
      state.planning.stats.planned += 1;
    },
    resolveConflict: (state, action: PayloadAction<{ taskId: number; resolution: 'keep' | 'reschedule' }>) => {
      const { taskId, resolution } = action.payload;
      state.planning.resolvedConflicts[taskId] = resolution;
    },
    nextConflict: (state) => {
      state.planning.currentIndex += 1;
    },
    finishConflictPhase: (state) => {
      const tasksToReschedule = state.planning.conflictingTasks.filter(
        (t) => state.planning.resolvedConflicts[t.id] === 'reschedule'
      );
      state.planning.tasks = [...tasksToReschedule, ...state.planning.tasks];
      state.planning.currentPhase = 'planning';
      state.planning.currentIndex = 0;
      state.planning.stats.totalTasks = state.planning.tasks.length;
    },
    setPlanningPhase: (state, action: PayloadAction<PlanningPhase>) => {
      state.planning.currentPhase = action.payload;
      if (action.payload === 'planning') {
        state.planning.currentIndex = 0;
      }
    },

    // Rebuild actions
    setRebuildStep: (state, action: PayloadAction<RebuildStep>) => {
      state.rebuild.step = action.payload;
    },
    toggleTaskSelection: (state, action: PayloadAction<number>) => {
      const taskId = action.payload;
      const index = state.rebuild.selectedTaskIds.indexOf(taskId);
      if (index === -1) {
        state.rebuild.selectedTaskIds.push(taskId);
      } else {
        state.rebuild.selectedTaskIds.splice(index, 1);
      }
    },
    toggleEventSelection: (state, action: PayloadAction<number>) => {
      const eventId = action.payload;
      const index = state.rebuild.selectedEventIds.indexOf(eventId);
      if (index === -1) {
        state.rebuild.selectedEventIds.push(eventId);
      } else {
        state.rebuild.selectedEventIds.splice(index, 1);
      }
    },
    setAdditionalInput: (state, action: PayloadAction<string>) => {
      state.rebuild.additionalInput = action.payload;
    },
    setWorkUntilTime: (state, action: PayloadAction<string>) => {
      state.rebuild.workUntilTime = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check-in thunks
      .addCase(fetchCheckInTasks.pending, (state) => {
        state.checkIn.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCheckInTasks.fulfilled, (state, action) => {
        state.checkIn.isLoading = false;
        state.checkIn.tasks = {
          overdue: action.payload.overdue,
          today: action.payload.today,
        };
        const apiLastModal = action.payload.lastCheckInAt;
        if (apiLastModal) {
          const apiDate = new Date(apiLastModal).getTime();
          const localDate = state.lastModalAt ? new Date(state.lastModalAt).getTime() : 0;
          if (apiDate > localDate) {
            state.lastModalAt = apiLastModal;
            storeLastModal(apiLastModal);
          }
        }
      })
      .addCase(fetchCheckInTasks.rejected, (state, action) => {
        state.checkIn.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      .addCase(completeCheckIn.fulfilled, (state, action) => {
        const completedAt = action.payload.checkIn.completedAt;
        state.lastModalAt = completedAt;
        storeLastModal(completedAt);
      })

      // Planning thunks
      .addCase(fetchPlanningTasks.pending, (state) => {
        state.planning.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlanningTasks.fulfilled, (state, action) => {
        state.planning.isLoading = false;
        state.planning.tasks = action.payload.tasks;
        state.planning.conflictingTasks = action.payload.conflictingTasks || [];
        state.planning.events = action.payload.events;
        state.planning.stats.totalTasks = action.payload.tasks.length;
        state.planning.currentPhase = state.planning.conflictingTasks.length > 0 ? 'conflicts' : 'planning';
        state.planning.currentIndex = 0;
      })
      .addCase(fetchPlanningTasks.rejected, (state, action) => {
        state.planning.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      .addCase(generateSchedule.pending, (state) => {
        state.planning.isGenerating = true;
        state.error = null;
      })
      .addCase(generateSchedule.fulfilled, (state, action) => {
        state.planning.isGenerating = false;
        state.planning.generatedSchedule = action.payload;
      })
      .addCase(generateSchedule.rejected, (state, action) => {
        state.planning.isGenerating = false;
        state.error = action.error.message || 'Failed to generate schedule';
      })
      .addCase(acceptSchedule.fulfilled, (state) => {
        state.isOpen = false;
      })

      // Rebuild thunks
      .addCase(fetchRebuildData.pending, (state) => {
        state.rebuild.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRebuildData.fulfilled, (state, action) => {
        state.rebuild.isLoading = false;
        // Convert PlanningTask to Task for rebuild
        state.rebuild.tasks = action.payload.tasks.map(t => ({
          id: t.id,
          title: t.title,
          isCompleted: t.isCompleted,
          dueDate: t.dueDate,
          estimatedMinutes: t.estimatedMinutes,
          fixedTime: t.fixedTime,
        }));
        state.rebuild.events = action.payload.events;
        // Select all tasks and events by default
        state.rebuild.selectedTaskIds = action.payload.tasks.map(t => t.id);
        state.rebuild.selectedEventIds = action.payload.events.map(e => e.id);
      })
      .addCase(fetchRebuildData.rejected, (state, action) => {
        state.rebuild.isLoading = false;
        state.error = action.error.message || 'Failed to fetch data';
      })
      .addCase(generateRebuild.pending, (state) => {
        state.rebuild.isGenerating = true;
        state.error = null;
      })
      .addCase(generateRebuild.fulfilled, (state, action) => {
        state.rebuild.isGenerating = false;
        state.rebuild.generatedSchedule = {
          schedule: action.payload.schedule,
          warnings: action.payload.warnings,
        };
        state.rebuild.parsedItems = action.payload.parsedItems;
        state.rebuild.step = 'preview';
      })
      .addCase(generateRebuild.rejected, (state, action) => {
        state.rebuild.isGenerating = false;
        state.error = action.error.message || 'Failed to generate rebuild schedule';
      })
      .addCase(acceptRebuild.fulfilled, (state) => {
        state.isOpen = false;
      });
  },
});

export const {
  openModal,
  closeModal,
  selectMode,
  backToSelection,
  // Check-in
  nextCheckInTask,
  incrementCombo,
  resetCombo,
  incrementStat,
  // Planning
  nextPlanningStep,
  previousPlanningStep,
  nextPlanningTask,
  skipPlanningTask,
  setEstimation,
  setFixedTime,
  setCombineEvents,
  setNeedsFullFocus,
  markTaskPlanned,
  resolveConflict,
  nextConflict,
  finishConflictPhase,
  setPlanningPhase,
  // Rebuild
  setRebuildStep,
  toggleTaskSelection,
  toggleEventSelection,
  setAdditionalInput,
  setWorkUntilTime,
} = howAreYouSlice.actions;

export default howAreYouSlice.reducer;
