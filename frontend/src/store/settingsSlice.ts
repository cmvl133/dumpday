import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import i18n from '@/i18n';
import { api } from '@/lib/api';
import type { CheckInInterval, ConfettiStyle, Language, ReminderTone, Settings } from '@/types';

interface SettingsState {
  checkInInterval: CheckInInterval;
  zenMode: boolean;
  reminderTone: ReminderTone;
  language: Language;
  confettiStyle: ConfettiStyle;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  checkInInterval: '3h',
  zenMode: false,
  reminderTone: 'normal',
  language: 'en',
  confettiStyle: 'neon',
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
        state.reminderTone = action.payload.reminderTone;
        state.language = action.payload.language;
        state.confettiStyle = action.payload.confettiStyle || 'neon';
        i18n.changeLanguage(action.payload.language);
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.checkInInterval = action.payload.checkInInterval;
        state.zenMode = action.payload.zenMode;
        state.reminderTone = action.payload.reminderTone;
        state.language = action.payload.language;
        state.confettiStyle = action.payload.confettiStyle || 'neon';
        i18n.changeLanguage(action.payload.language);
      });
  },
});

export default settingsSlice.reducer;
