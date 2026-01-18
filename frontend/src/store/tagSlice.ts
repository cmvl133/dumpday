import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { Tag, TagFilterMode } from '@/types';

interface TagState {
  tags: Tag[];
  activeFilters: number[];
  filterMode: TagFilterMode;
  isLoading: boolean;
  error: string | null;
}

// Load filter state from localStorage
const loadFilterState = (): { activeFilters: number[]; filterMode: TagFilterMode } => {
  try {
    const saved = localStorage.getItem('tagFilter');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        activeFilters: parsed.activeFilters || [],
        filterMode: parsed.filterMode || 'or',
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { activeFilters: [], filterMode: 'or' };
};

const savedFilterState = loadFilterState();

const initialState: TagState = {
  tags: [],
  activeFilters: savedFilterState.activeFilters,
  filterMode: savedFilterState.filterMode,
  isLoading: false,
  error: null,
};

// Persist filter state to localStorage
const saveFilterState = (activeFilters: number[], filterMode: TagFilterMode) => {
  try {
    localStorage.setItem('tagFilter', JSON.stringify({ activeFilters, filterMode }));
  } catch {
    // Ignore storage errors
  }
};

export const fetchTags = createAsyncThunk('tags/fetch', async () => {
  const result = await api.tag.list();
  return result;
});

export const createTag = createAsyncThunk(
  'tags/create',
  async (data: { name: string; color: string }) => {
    const result = await api.tag.create(data);
    return result;
  }
);

export const updateTag = createAsyncThunk(
  'tags/update',
  async ({ id, data }: { id: number; data: Partial<Pick<Tag, 'name' | 'color'>> }) => {
    const result = await api.tag.update(id, data);
    return result;
  }
);

export const deleteTag = createAsyncThunk('tags/delete', async (id: number) => {
  await api.tag.delete(id);
  return id;
});

const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    setActiveFilters: (state, action: PayloadAction<number[]>) => {
      state.activeFilters = action.payload;
      saveFilterState(state.activeFilters, state.filterMode);
    },
    toggleFilter: (state, action: PayloadAction<number>) => {
      const tagId = action.payload;
      const index = state.activeFilters.indexOf(tagId);
      if (index === -1) {
        state.activeFilters.push(tagId);
      } else {
        state.activeFilters.splice(index, 1);
      }
      saveFilterState(state.activeFilters, state.filterMode);
    },
    setFilterMode: (state, action: PayloadAction<TagFilterMode>) => {
      state.filterMode = action.payload;
      saveFilterState(state.activeFilters, state.filterMode);
    },
    clearFilters: (state) => {
      state.activeFilters = [];
      saveFilterState(state.activeFilters, state.filterMode);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tags = action.payload;
        // Clean up filters for deleted tags
        state.activeFilters = state.activeFilters.filter((id) =>
          action.payload.some((tag) => tag.id === id)
        );
        saveFilterState(state.activeFilters, state.filterMode);
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch tags';
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.tags.push(action.payload);
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        const index = state.tags.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tags[index] = action.payload;
        }
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.tags = state.tags.filter((t) => t.id !== action.payload);
        state.activeFilters = state.activeFilters.filter((id) => id !== action.payload);
        saveFilterState(state.activeFilters, state.filterMode);
      });
  },
});

export const { setActiveFilters, toggleFilter, setFilterMode, clearFilters } = tagSlice.actions;
export default tagSlice.reducer;
