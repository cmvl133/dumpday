import { configureStore } from '@reduxjs/toolkit';
import healthReducer from './healthSlice';
import dailyNoteReducer from './dailyNoteSlice';
import authReducer from './authSlice';
import checkInReducer from './checkInSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    health: healthReducer,
    dailyNote: dailyNoteReducer,
    auth: authReducer,
    checkIn: checkInReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
