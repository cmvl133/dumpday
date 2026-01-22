import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { selectMode, closeModal } from './howAreYouSlice';
import type { Task, PlanningEvent, RebuildParsedItems, GeneratedSchedule, ScheduleSuggestion } from '@/types';

export type RebuildStep = 'whats_happening' | 'anything_else' | 'work_until' | 'preview';

export interface RebuildFlowState {
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
  error: string | null;
}

const initialState: RebuildFlowState = {
  step: 'whats_happening',
  tasks: [],
  events: [],
  selectedTaskIds: [],
  selectedEventIds: [],
  additionalInput: '',
  workUntilTime: '18:00',
  parsedItems: { newTasks: [], journalEntries: 0, notes: 0 },
  generatedSchedule: null,
  isLoading: false,
  isGenerating: false,
  error: null,
};

// Rebuild async thunks
export const fetchRebuildData = createAsyncThunk('rebuildFlow/fetchData', async () => api.planning.getTasks());

export const generateRebuild = createAsyncThunk('rebuildFlow/generate', async (_, { getState }) => {
  const state = getState() as { rebuildFlow: RebuildFlowState };
  const { selectedTaskIds, selectedEventIds, additionalInput, workUntilTime } = state.rebuildFlow;
  return await api.rebuild.generate({
    keepTaskIds: selectedTaskIds,
    keepEventIds: selectedEventIds,
    additionalInput: additionalInput.trim() || null,
    workUntilTime,
  });
});

export const acceptRebuild = createAsyncThunk(
  'rebuildFlow/accept',
  async (modifiedSchedule: ScheduleSuggestion[] | undefined, { getState }) => {
    const state = getState() as { rebuildFlow: RebuildFlowState };
    const schedule = modifiedSchedule || state.rebuildFlow.generatedSchedule?.schedule || [];
    await api.rebuild.accept(schedule);
    return schedule;
  }
);

const rebuildFlowSlice = createSlice({
  name: 'rebuildFlow',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<RebuildStep>) => { state.step = action.payload; },
    toggleTaskSelection: (state, action: PayloadAction<number>) => {
      const idx = state.selectedTaskIds.indexOf(action.payload);
      if (idx === -1) state.selectedTaskIds.push(action.payload);
      else state.selectedTaskIds.splice(idx, 1);
    },
    toggleEventSelection: (state, action: PayloadAction<number>) => {
      const idx = state.selectedEventIds.indexOf(action.payload);
      if (idx === -1) state.selectedEventIds.push(action.payload);
      else state.selectedEventIds.splice(idx, 1);
    },
    setAdditionalInput: (state, action: PayloadAction<string>) => { state.additionalInput = action.payload; },
    setWorkUntilTime: (state, action: PayloadAction<string>) => { state.workUntilTime = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectMode, (_state, action) => { if (action.payload === 'rebuild') return { ...initialState }; })
      .addCase(closeModal, () => {})
      .addCase(fetchRebuildData.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchRebuildData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks.map(t => ({
          id: t.id, title: t.title, isCompleted: t.isCompleted,
          dueDate: t.dueDate, estimatedMinutes: t.estimatedMinutes, fixedTime: t.fixedTime,
        }));
        state.events = action.payload.events;
        state.selectedTaskIds = action.payload.tasks.map(t => t.id);
        state.selectedEventIds = action.payload.events.map(e => e.id);
      })
      .addCase(fetchRebuildData.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message || 'Failed to fetch data'; })
      .addCase(generateRebuild.pending, (state) => { state.isGenerating = true; state.error = null; })
      .addCase(generateRebuild.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.generatedSchedule = { schedule: action.payload.schedule, warnings: action.payload.warnings };
        state.parsedItems = action.payload.parsedItems;
        state.step = 'preview';
      })
      .addCase(generateRebuild.rejected, (state, action) => { state.isGenerating = false; state.error = action.error.message || 'Failed to generate rebuild schedule'; })
      .addCase(acceptRebuild.fulfilled, () => {});
  },
});

export const { setStep, toggleTaskSelection, toggleEventSelection, setAdditionalInput, setWorkUntilTime, clearError } = rebuildFlowSlice.actions;

export default rebuildFlowSlice.reducer;
