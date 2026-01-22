import { configureStore } from '@reduxjs/toolkit';
import healthReducer from './healthSlice';
import dailyNoteReducer from './dailyNoteSlice';
import authReducer from './authSlice';
import checkInReducer from './checkInSlice';
import settingsReducer from './settingsSlice';
import planningReducer from './planningSlice';
import howAreYouReducer from './howAreYouSlice';
import checkInFlowReducer from './checkInFlowSlice';
import planningFlowReducer from './planningFlowSlice';
import rebuildFlowReducer from './rebuildFlowSlice';
import recurringReducer from './recurringSlice';
import tagReducer from './tagSlice';
import timeBlockReducer from './timeBlockSlice';

export const store = configureStore({
  reducer: {
    health: healthReducer,
    dailyNote: dailyNoteReducer,
    auth: authReducer,
    checkIn: checkInReducer,
    settings: settingsReducer,
    planning: planningReducer,
    howAreYou: howAreYouReducer,
    checkInFlow: checkInFlowReducer,
    planningFlow: planningFlowReducer,
    rebuildFlow: rebuildFlowReducer,
    recurring: recurringReducer,
    tags: tagReducer,
    timeBlocks: timeBlockReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
