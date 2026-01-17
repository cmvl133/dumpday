import { configureStore } from '@reduxjs/toolkit';
import healthReducer from './healthSlice';
import dailyNoteReducer from './dailyNoteSlice';
import authReducer from './authSlice';
import checkInReducer from './checkInSlice';
import settingsReducer from './settingsSlice';
import planningReducer from './planningSlice';

export const store = configureStore({
  reducer: {
    health: healthReducer,
    dailyNote: dailyNoteReducer,
    auth: authReducer,
    checkIn: checkInReducer,
    settings: settingsReducer,
    planning: planningReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
