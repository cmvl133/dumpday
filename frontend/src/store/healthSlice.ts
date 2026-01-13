import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface HealthStatus {
  status: string;
}

interface HealthState {
  status: HealthStatus | null;
  loading: boolean;
  error: string | null;
}

const initialState: HealthState = {
  status: null,
  loading: false,
  error: null,
};

export const fetchHealth = createAsyncThunk('health/fetchHealth', async () => {
  const response = await fetch('/api/health');
  if (!response.ok) {
    throw new Error('Failed to fetch health status');
  }
  return response.json() as Promise<HealthStatus>;
});

const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Unknown error';
      });
  },
});

export default healthSlice.reducer;
