import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { selectMode, closeModal } from './howAreYouSlice';
import type { PlanningTask, PlanningEvent, PlanningTaskData, GeneratedSchedule, PlanningStats, ScheduleSuggestion } from '@/types';

export type PlanningStep = 'estimation' | 'fixed_time' | 'combine';
export type PlanningPhase = 'conflicts' | 'planning' | 'summary';

export interface PlanningFlowState {
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

const initialState: PlanningFlowState = {
  tasks: [],
  conflictingTasks: [],
  events: [],
  currentPhase: 'conflicts',
  currentIndex: 0,
  currentStep: 'estimation',
  taskPlanData: {},
  resolvedConflicts: {},
  generatedSchedule: null,
  stats: { totalTasks: 0, planned: 0, skipped: 0, totalMinutes: 0 },
  isLoading: false,
  isGenerating: false,
  error: null,
};

// Planning async thunks
export const fetchPlanningTasks = createAsyncThunk('planningFlow/fetchTasks', async () => api.planning.getTasks());

export const savePlanningTask = createAsyncThunk(
  'planningFlow/saveTask',
  async ({ taskId, data }: { taskId: number; data: PlanningTaskData }) => {
    const result = await api.planning.saveTask(taskId, data);
    return { taskId, data, result };
  }
);

export const generateSchedule = createAsyncThunk('planningFlow/generateSchedule', async (taskIds: number[]) => api.planning.generateSchedule(taskIds));

export const acceptSchedule = createAsyncThunk(
  'planningFlow/acceptSchedule',
  async (modifiedSchedule: ScheduleSuggestion[] | undefined, { getState }) => {
    const state = getState() as { planningFlow: PlanningFlowState };
    const schedule = modifiedSchedule || state.planningFlow.generatedSchedule?.schedule || [];
    await api.planning.acceptSchedule(schedule);
    return schedule;
  }
);

const ensureTaskData = (state: PlanningFlowState, taskId: number) => {
  if (!state.taskPlanData[taskId]) state.taskPlanData[taskId] = {};
};

const planningFlowSlice = createSlice({
  name: 'planningFlow',
  initialState,
  reducers: {
    nextStep: (state) => {
      if (state.currentStep === 'estimation') state.currentStep = 'fixed_time';
      else if (state.currentStep === 'fixed_time') state.currentStep = 'combine';
    },
    previousStep: (state) => {
      if (state.currentStep === 'combine') state.currentStep = 'fixed_time';
      else if (state.currentStep === 'fixed_time') state.currentStep = 'estimation';
    },
    nextTask: (state) => { state.currentIndex += 1; state.currentStep = 'estimation'; },
    skipTask: (state) => { state.stats.skipped += 1; state.currentIndex += 1; state.currentStep = 'estimation'; },
    setEstimation: (state, action: PayloadAction<{ taskId: number; minutes: number }>) => {
      const { taskId, minutes } = action.payload;
      ensureTaskData(state, taskId);
      state.taskPlanData[taskId].estimatedMinutes = minutes;
      state.stats.totalMinutes += minutes;
    },
    setFixedTime: (state, action: PayloadAction<{ taskId: number; time: string | null }>) => {
      const { taskId, time } = action.payload;
      ensureTaskData(state, taskId);
      state.taskPlanData[taskId].fixedTime = time;
    },
    setCombineEvents: (state, action: PayloadAction<{ taskId: number; eventIds: number[] }>) => {
      const { taskId, eventIds } = action.payload;
      ensureTaskData(state, taskId);
      state.taskPlanData[taskId].canCombineWithEvents = eventIds;
      state.taskPlanData[taskId].needsFullFocus = false;
    },
    setNeedsFullFocus: (state, action: PayloadAction<{ taskId: number; needsFocus: boolean }>) => {
      const { taskId, needsFocus } = action.payload;
      ensureTaskData(state, taskId);
      state.taskPlanData[taskId].needsFullFocus = needsFocus;
      if (needsFocus) state.taskPlanData[taskId].canCombineWithEvents = null;
    },
    markTaskPlanned: (state) => { state.stats.planned += 1; },
    resolveConflict: (state, action: PayloadAction<{ taskId: number; resolution: 'keep' | 'reschedule' }>) => {
      state.resolvedConflicts[action.payload.taskId] = action.payload.resolution;
    },
    nextConflict: (state) => { state.currentIndex += 1; },
    finishConflictPhase: (state) => {
      const tasksToReschedule = state.conflictingTasks.filter((t) => state.resolvedConflicts[t.id] === 'reschedule');
      state.tasks = [...tasksToReschedule, ...state.tasks];
      state.currentPhase = 'planning';
      state.currentIndex = 0;
      state.stats.totalTasks = state.tasks.length;
    },
    setPhase: (state, action: PayloadAction<PlanningPhase>) => {
      state.currentPhase = action.payload;
      if (action.payload === 'planning') state.currentIndex = 0;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectMode, (state, action) => { if (action.payload === 'planning') return { ...initialState }; })
      .addCase(closeModal, () => {})
      .addCase(fetchPlanningTasks.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchPlanningTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.conflictingTasks = action.payload.conflictingTasks || [];
        state.events = action.payload.events;
        state.stats.totalTasks = action.payload.tasks.length;
        state.currentPhase = state.conflictingTasks.length > 0 ? 'conflicts' : 'planning';
        state.currentIndex = 0;
      })
      .addCase(fetchPlanningTasks.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message || 'Failed to fetch tasks'; })
      .addCase(generateSchedule.pending, (state) => { state.isGenerating = true; state.error = null; })
      .addCase(generateSchedule.fulfilled, (state, action) => { state.isGenerating = false; state.generatedSchedule = action.payload; })
      .addCase(generateSchedule.rejected, (state, action) => { state.isGenerating = false; state.error = action.error.message || 'Failed to generate schedule'; })
      .addCase(acceptSchedule.fulfilled, () => {});
  },
});

export const {
  nextStep, previousStep, nextTask, skipTask, setEstimation, setFixedTime,
  setCombineEvents, setNeedsFullFocus, markTaskPlanned, resolveConflict,
  nextConflict, finishConflictPhase, setPhase, clearError,
} = planningFlowSlice.actions;

export default planningFlowSlice.reducer;
