import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const LAST_MODAL_KEY = 'dopaminder_last_modal';

function getStoredLastModal(): string | null {
  try {
    const stored = localStorage.getItem(LAST_MODAL_KEY);
    if (stored) {
      const date = new Date(stored);
      if (!isNaN(date.getTime())) {
        return stored;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

function storeLastModal(value: string | null): void {
  try {
    if (value) {
      localStorage.setItem(LAST_MODAL_KEY, value);
    } else {
      localStorage.removeItem(LAST_MODAL_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

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
  lastModalAt: getStoredLastModal(),
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
      storeLastModal(now);
    },
    closeModal: (state) => {
      state.isOpen = false;
      // Update lastModalAt on close to prevent immediate reopen
      const now = new Date().toISOString();
      state.lastModalAt = now;
      storeLastModal(now);
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
