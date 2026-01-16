import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { CheckInInterval, Settings } from '@/types';

interface SettingsState {
  checkInInterval: CheckInInterval;
  zenMode: boolean;
  soundEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  checkInInterval: '3h',
  zenMode: false,
  soundEnabled: false,
  isLoading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  const result = await api.settings.get();
  return result;
});

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (data: Partial<Settings>) => {
    const result = await api.settings.update(data);
    return result;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkInInterval = action.payload.checkInInterval;
        state.zenMode = action.payload.zenMode;
        state.soundEnabled = action.payload.soundEnabled;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.checkInInterval = action.payload.checkInInterval;
        state.zenMode = action.payload.zenMode;
        state.soundEnabled = action.payload.soundEnabled;
      });
  },
});

export default settingsSlice.reducer;
