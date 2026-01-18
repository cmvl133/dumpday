import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type {
  PlanningTask,
  PlanningEvent,
  PlanningTaskData,
  GeneratedSchedule,
  PlanningStats,
  ScheduleSuggestion,
  SplitProposal,
  SplitPart,
  TimeSlot,
} from '@/types';

type PlanningStep = 'estimation' | 'fixed_time' | 'combine';

type PlanningPhase = 'conflicts' | 'planning' | 'split' | 'summary';

type SplitViewMode = 'options' | 'preview';

interface SplitState {
  tasksToSplit: PlanningTask[];
  currentSplitIndex: number;
  proposals: Record<number, SplitProposal>;
  availableSlots: Record<string, TimeSlot[]>;
  totalAvailable: Record<string, number>;
  viewMode: SplitViewMode;
  editingParts: SplitPart[] | null;
}

interface PlanningState {
  isOpen: boolean;
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
  error: string | null;
  split: SplitState;
}

const initialSplitState: SplitState = {
  tasksToSplit: [],
  currentSplitIndex: 0,
  proposals: {},
  availableSlots: {},
  totalAvailable: {},
  viewMode: 'options',
  editingParts: null,
};

const initialState: PlanningState = {
  isOpen: false,
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
  error: null,
  split: initialSplitState,
};

export const fetchPlanningTasks = createAsyncThunk(
  'planning/fetchTasks',
  async () => {
    const result = await api.planning.getTasks();
    return result;
  }
);

export const savePlanningTask = createAsyncThunk(
  'planning/saveTask',
  async ({ taskId, data }: { taskId: number; data: PlanningTaskData }) => {
    const result = await api.planning.saveTask(taskId, data);
    return { taskId, data, result };
  }
);

export const generateSchedule = createAsyncThunk(
  'planning/generateSchedule',
  async (taskIds: number[]) => {
    const result = await api.planning.generateSchedule(taskIds);
    return result;
  }
);

export const acceptSchedule = createAsyncThunk(
  'planning/acceptSchedule',
  async (modifiedSchedule: ScheduleSuggestion[] | undefined, { getState }) => {
    const state = getState() as { planning: PlanningState };
    const schedule = modifiedSchedule || state.planning.generatedSchedule?.schedule || [];
    await api.planning.acceptSchedule(schedule);
    return schedule;
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'planning/fetchAvailableSlots',
  async (date: string) => {
    const result = await api.schedule.getAvailableSlots(date);
    return { date, slots: result.slots, totalAvailable: result.totalAvailable };
  }
);

export const fetchSplitProposal = createAsyncThunk(
  'planning/fetchSplitProposal',
  async ({ taskId, date }: { taskId: number; date: string }) => {
    const result = await api.schedule.proposeSplit(taskId, date);
    return { taskId, proposal: result.proposal };
  }
);

export const executeSplit = createAsyncThunk(
  'planning/executeSplit',
  async ({ taskId, parts }: { taskId: number; parts: SplitPart[] }) => {
    const result = await api.task.split(taskId, parts);
    return { taskId, result };
  }
);

const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    openPlanning: (state) => {
      state.isOpen = true;
      state.currentPhase = 'conflicts';
      state.currentIndex = 0;
      state.currentStep = 'estimation';
      state.taskPlanData = {};
      state.resolvedConflicts = {};
      state.generatedSchedule = null;
      state.stats = {
        totalTasks: 0,
        planned: 0,
        skipped: 0,
        totalMinutes: 0,
      };
      state.error = null;
      state.split = initialSplitState;
    },
    closePlanning: (state) => {
      state.isOpen = false;
    },
    nextStep: (state) => {
      if (state.currentStep === 'estimation') {
        state.currentStep = 'fixed_time';
      } else if (state.currentStep === 'fixed_time') {
        state.currentStep = 'combine';
      }
    },
    previousStep: (state) => {
      if (state.currentStep === 'combine') {
        state.currentStep = 'fixed_time';
      } else if (state.currentStep === 'fixed_time') {
        state.currentStep = 'estimation';
      }
    },
    nextTask: (state) => {
      state.currentIndex += 1;
      state.currentStep = 'estimation';
    },
    skipTask: (state) => {
      state.stats.skipped += 1;
      state.currentIndex += 1;
      state.currentStep = 'estimation';
    },
    setEstimation: (state, action: PayloadAction<{ taskId: number; minutes: number }>) => {
      const { taskId, minutes } = action.payload;
      if (!state.taskPlanData[taskId]) {
        state.taskPlanData[taskId] = {};
      }
      state.taskPlanData[taskId].estimatedMinutes = minutes;
      state.stats.totalMinutes += minutes;
    },
    setFixedTime: (state, action: PayloadAction<{ taskId: number; time: string | null }>) => {
      const { taskId, time } = action.payload;
      if (!state.taskPlanData[taskId]) {
        state.taskPlanData[taskId] = {};
      }
      state.taskPlanData[taskId].fixedTime = time;
    },
    setCombineEvents: (state, action: PayloadAction<{ taskId: number; eventIds: number[] }>) => {
      const { taskId, eventIds } = action.payload;
      if (!state.taskPlanData[taskId]) {
        state.taskPlanData[taskId] = {};
      }
      state.taskPlanData[taskId].canCombineWithEvents = eventIds;
      state.taskPlanData[taskId].needsFullFocus = false;
    },
    setNeedsFullFocus: (state, action: PayloadAction<{ taskId: number; needsFocus: boolean }>) => {
      const { taskId, needsFocus } = action.payload;
      if (!state.taskPlanData[taskId]) {
        state.taskPlanData[taskId] = {};
      }
      state.taskPlanData[taskId].needsFullFocus = needsFocus;
      if (needsFocus) {
        state.taskPlanData[taskId].canCombineWithEvents = null;
      }
    },
    markTaskPlanned: (state) => {
      state.stats.planned += 1;
    },
    resolveConflict: (state, action: PayloadAction<{ taskId: number; resolution: 'keep' | 'reschedule' }>) => {
      const { taskId, resolution } = action.payload;
      state.resolvedConflicts[taskId] = resolution;
    },
    nextConflict: (state) => {
      state.currentIndex += 1;
    },
    finishConflictPhase: (state) => {
      // Move tasks marked for rescheduling to the tasks array
      const tasksToReschedule = state.conflictingTasks.filter(
        (t) => state.resolvedConflicts[t.id] === 'reschedule'
      );
      state.tasks = [...tasksToReschedule, ...state.tasks];
      state.currentPhase = 'planning';
      state.currentIndex = 0;
      state.stats.totalTasks = state.tasks.length;
    },
    setPhase: (state, action: PayloadAction<PlanningPhase>) => {
      state.currentPhase = action.payload;
      if (action.payload === 'planning') {
        state.currentIndex = 0;
      }
    },
    // Split-related actions
    setTasksToSplit: (state, action: PayloadAction<PlanningTask[]>) => {
      state.split.tasksToSplit = action.payload;
      state.split.currentSplitIndex = 0;
      state.split.viewMode = 'options';
      if (action.payload.length > 0) {
        state.currentPhase = 'split';
      }
    },
    nextSplitTask: (state) => {
      state.split.currentSplitIndex += 1;
      state.split.viewMode = 'options';
      state.split.editingParts = null;
    },
    skipSplitTask: (state) => {
      // Mark as skipped, move to next
      state.split.currentSplitIndex += 1;
      state.split.viewMode = 'options';
      state.split.editingParts = null;
    },
    showSplitPreview: (state, action: PayloadAction<SplitPart[]>) => {
      state.split.viewMode = 'preview';
      state.split.editingParts = action.payload;
    },
    hideSplitPreview: (state) => {
      state.split.viewMode = 'options';
      state.split.editingParts = null;
    },
    finishSplitPhase: (state) => {
      state.currentPhase = 'summary';
      state.split.tasksToSplit = [];
      state.split.currentSplitIndex = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlanningTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlanningTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.conflictingTasks = action.payload.conflictingTasks || [];
        state.events = action.payload.events;
        state.stats.totalTasks = action.payload.tasks.length;
        // Start with conflicts phase if there are conflicts, otherwise go to planning
        state.currentPhase = state.conflictingTasks.length > 0 ? 'conflicts' : 'planning';
        state.currentIndex = 0;
      })
      .addCase(fetchPlanningTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      .addCase(generateSchedule.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateSchedule.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedSchedule = action.payload;
      })
      .addCase(generateSchedule.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.error.message || 'Failed to generate schedule';
      })
      .addCase(acceptSchedule.fulfilled, (state) => {
        state.isOpen = false;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.split.availableSlots[action.payload.date] = action.payload.slots;
        state.split.totalAvailable[action.payload.date] = action.payload.totalAvailable;
      })
      .addCase(fetchSplitProposal.fulfilled, (state, action) => {
        state.split.proposals[action.payload.taskId] = action.payload.proposal;
      })
      .addCase(executeSplit.fulfilled, (state, action) => {
        // Remove the split task from tasksToSplit and move to next
        const taskId = action.payload.taskId;
        state.split.tasksToSplit = state.split.tasksToSplit.filter(t => t.id !== taskId);
        state.split.viewMode = 'options';
        state.split.editingParts = null;
        // Note: we don't increment currentSplitIndex since we removed the task
      });
  },
});

export const {
  openPlanning,
  closePlanning,
  nextStep,
  previousStep,
  nextTask,
  skipTask,
  setEstimation,
  setFixedTime,
  setCombineEvents,
  setNeedsFullFocus,
  markTaskPlanned,
  resolveConflict,
  nextConflict,
  finishConflictPhase,
  setPhase,
  setTasksToSplit,
  nextSplitTask,
  skipSplitTask,
  showSplitPreview,
  hideSplitPreview,
  finishSplitPhase,
} = planningSlice.actions;

export default planningSlice.reducer;
