import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

interface AuthUser {
  id: number;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  codeSent: boolean;
  codeEmail: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  codeSent: false,
  codeEmail: null,
};

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  const response = await api.auth.me();
  return response;
});

export const requestCode = createAsyncThunk(
  'auth/requestCode',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.auth.requestCode(email);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { email, message: response.message };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Wystąpił błąd'
      );
    }
  }
);

export const verifyCode = createAsyncThunk(
  'auth/verifyCode',
  async ({ email, code }: { email: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await api.auth.verifyCode(email, code);
      if (!response.success || !response.user) {
        return rejectWithValue(response.message || 'Weryfikacja nie powiodła się');
      }
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Wystąpił błąd'
      );
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.auth.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetCodeSent: (state) => {
      state.codeSent = false;
      state.codeEmail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && action.payload.user) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(requestCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.codeSent = true;
        state.codeEmail = action.payload.email;
      })
      .addCase(requestCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.codeSent = false;
        state.codeEmail = null;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.codeSent = false;
        state.codeEmail = null;
      });
  },
});

export const { clearError, resetCodeSent } = authSlice.actions;
export default authSlice.reducer;
