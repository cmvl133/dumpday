import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type {
  PlanningTask,
  PlanningEvent,
  PlanningTaskData,
  GeneratedSchedule,
  PlanningStats,
  ScheduleSuggestion,
} from '@/types';

type PlanningStep = 'estimation' | 'fixed_time' | 'combine';

type PlanningPhase = 'conflicts' | 'planning' | 'summary';

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
}

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
} = planningSlice.actions;

export default planningSlice.reducer;
