import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

export type ModalMode = 'selection' | 'checkin' | 'planning' | 'rebuild';

interface HowAreYouState {
  isOpen: boolean;
  mode: ModalMode;
  lastModalAt: string | null;
  error: string | null;
}

const initialState: HowAreYouState = {
  isOpen: false,
  mode: 'selection',
  lastModalAt: getStorageItem(STORAGE_KEYS.LAST_MODAL, null),
  error: null,
};

const howAreYouSlice = createSlice({
  name: 'howAreYou',
  initialState,
  reducers: {
    openModal: (state) => {
      state.isOpen = true;
      state.mode = 'selection';
      state.error = null;
      // Update lastModalAt when opening to prevent immediate re-open if dismissed
      const now = new Date().toISOString();
      state.lastModalAt = now;
      setStorageItem(STORAGE_KEYS.LAST_MODAL, now);
    },
    closeModal: (state) => {
      state.isOpen = false;
      // Update lastModalAt on close to prevent immediate reopen
      const now = new Date().toISOString();
      state.lastModalAt = now;
      setStorageItem(STORAGE_KEYS.LAST_MODAL, now);
    },
    selectMode: (state, action: PayloadAction<ModalMode>) => {
      state.mode = action.payload;
      state.error = null;
    },
    backToSelection: (state) => {
      state.mode = 'selection';
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  openModal,
  closeModal,
  selectMode,
  backToSelection,
  setError,
  clearError,
} = howAreYouSlice.actions;

export default howAreYouSlice.reducer;
