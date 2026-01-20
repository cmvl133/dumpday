# Phase 3: Settings Management UI - Research

**Researched:** 2026-01-20
**Domain:** React CRUD UI for TimeBlock Settings
**Confidence:** HIGH

## Summary

Phase 3 builds a Settings UI for TimeBlock template CRUD. The codebase already has established patterns for similar functionality:

1. **RecurringSettings.tsx** provides the exact UI pattern for recurrence selection (daily/weekly/custom days)
2. **TagSelector.tsx** provides the multi-select pattern for tag association
3. **TagManager.tsx** in SettingsModal.tsx provides the CRUD list/edit/delete pattern
4. **TimeBlockController.php** already has full CRUD API (created in Phase 1)

The implementation follows existing patterns exactly - no new libraries or architectural decisions needed.

**Primary recommendation:** Build TimeBlockSettings component following TagManager pattern, reuse RecurringSettings day selector pattern, and TagSelector for tag association. Add as new section in SettingsModal.tsx.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | UI Framework | Project standard |
| Redux Toolkit | - | State management | Already has pattern in tagSlice, recurringSlice |
| shadcn/ui | - | UI components | Dialog, Button, Input, Checkbox, Popover |
| react-i18next | - | i18n | Already configured with en.json, pl.json |
| Tailwind CSS | - | Styling | Project standard |
| lucide-react | - | Icons | Already used throughout |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/lib/utils | - | cn() classname utility | Conditional styling |
| @/lib/api | - | API wrapper | All backend calls |

### No New Dependencies
All required functionality exists in current stack. Do NOT add any new libraries.

**No installation needed - all libraries already in project.**

## Architecture Patterns

### Recommended Component Structure
```
frontend/src/
├── components/
│   ├── settings/
│   │   ├── SettingsModal.tsx          # Add TimeBlock section
│   │   └── TimeBlockSettings.tsx      # NEW: CRUD list like TagManager
│   └── timeblocks/                    # NEW folder
│       ├── TimeBlockForm.tsx          # NEW: Create/edit form
│       └── TimeBlockTagSelector.tsx   # NEW: Multi-select tags
├── store/
│   └── timeBlockSlice.ts              # NEW: Redux slice
└── i18n/locales/
    ├── en.json                        # Add timeBlocks section
    └── pl.json                        # Add timeBlocks section
```

### Pattern 1: Redux Slice for TimeBlock CRUD
**What:** State management following tagSlice pattern
**When to use:** All TimeBlock CRUD operations
**Example:**
```typescript
// Follow tagSlice.ts pattern exactly
interface TimeBlockState {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
}

export const fetchTimeBlocks = createAsyncThunk('timeBlocks/fetch', async () => {
  return await api.timeBlock.list();
});

export const createTimeBlock = createAsyncThunk(
  'timeBlocks/create',
  async (data: CreateTimeBlockData) => {
    return await api.timeBlock.create(data);
  }
);

// ... update, delete similarly
```

### Pattern 2: CRUD List Component
**What:** List view with inline edit/delete following TagManager
**When to use:** TimeBlockSettings main view
**Example:**
```typescript
// Follow TagManager.tsx pattern
export function TimeBlockSettings() {
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // List existing blocks
  // Inline edit mode toggle
  // Delete with confirmation
  // Create form toggle
}
```

### Pattern 3: Form Component
**What:** Create/edit form with all TimeBlock fields
**When to use:** TimeBlockForm component
**Example:**
```typescript
interface TimeBlockFormProps {
  initialData?: TimeBlock;
  onSave: (data: TimeBlockFormData) => void;
  onCancel: () => void;
}

interface TimeBlockFormData {
  name: string;
  color: string;
  startTime: string;      // "HH:MM"
  endTime: string;        // "HH:MM"
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null;
  tagIds: number[];
}
```

### Pattern 4: Day Selector (from RecurringSettings)
**What:** Toggle buttons for selecting days of week
**When to use:** Custom recurrence days selection
**Example:**
```typescript
// From RecurringSettings.tsx - reuse this pattern
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

<div className="flex gap-1">
  {DAY_KEYS.map((dayKey, index) => (
    <button
      key={dayKey}
      onClick={() => toggleDay(index)}
      className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
        customDays.includes(index)
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border hover:bg-accent'
      }`}
    >
      {t(`recurring.days.${dayKey}`)}
    </button>
  ))}
</div>
```

### Pattern 5: Color Picker (from TagManager)
**What:** Color selection with predefined colors
**When to use:** Block color selection
**Example:**
```typescript
// Colors from TimeBlockController.php ALLOWED_COLORS
const BLOCK_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c',
];

// Follow TAG_COLORS pattern from TagManager.tsx
<div className="flex gap-1 flex-wrap">
  {BLOCK_COLORS.map((color) => (
    <button
      key={color}
      type="button"
      onClick={() => setColor(color)}
      className={cn(
        'w-6 h-6 rounded-full transition-all',
        selectedColor === color
          ? 'ring-2 ring-offset-2 ring-offset-background ring-white'
          : 'hover:scale-110'
      )}
      style={{ backgroundColor: color }}
    />
  ))}
</div>
```

### Pattern 6: Tag Multi-Select (adapted from TagSelector)
**What:** Selecting multiple tags for a TimeBlock
**When to use:** Tag association in TimeBlock form
**Example:**
```typescript
// Adapt TagSelector pattern for form use (not popover)
interface TimeBlockTagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

export function TimeBlockTagSelector({ selectedTagIds, onChange }: TimeBlockTagSelectorProps) {
  const tags = useSelector((state: RootState) => state.tags.tags);

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggleTag(tag.id)}
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium transition-all",
            selectedTagIds.includes(tag.id)
              ? "opacity-100"
              : "opacity-50 hover:opacity-100"
          )}
          style={{
            backgroundColor: selectedTagIds.includes(tag.id)
              ? tag.color
              : `${tag.color}30`,
            color: selectedTagIds.includes(tag.id)
              ? getContrastColor(tag.color)
              : tag.color,
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Custom select components:** Use existing Input/Button patterns, not custom dropdowns
- **Separate settings page/route:** Add to SettingsModal, not new route
- **Complex state management:** Keep form state local, persist only on save
- **Inline API calls:** Always use Redux thunks through timeBlockSlice

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time input | Custom time picker | `<input type="time">` | Native, accessible |
| Day selection | Custom calendar | Toggle buttons (RecurringSettings pattern) | Simpler, matches existing UI |
| Tag multi-select | Custom multi-select | TagSelector-style toggle buttons | Existing pattern |
| Color picker | Radix color picker | Static color grid (TagManager pattern) | Colors are predefined |
| Form validation | Zod/Yup | Simple null/empty checks | Keep it simple |
| Delete confirmation | Alert dialog | Inline state toggle (TagManager pattern) | Existing pattern |

**Key insight:** Every UI pattern needed already exists in the codebase. Reuse them exactly.

## Common Pitfalls

### Pitfall 1: Time Input Format Mismatch
**What goes wrong:** API expects "HH:MM", input returns different format
**Why it happens:** Browser time inputs vary in format
**How to avoid:** Always format with input type="time" and validate server-side
**Warning signs:** 400 errors on create/update

### Pitfall 2: Tag State Sync
**What goes wrong:** Tags not loaded when form opens
**Why it happens:** TagSelector expects tags in Redux state
**How to avoid:** Ensure fetchTags() is called in SettingsModal on open (already done for TagManager)
**Warning signs:** Empty tag list in form

### Pitfall 3: Color Validation
**What goes wrong:** Invalid colors rejected by API (400 error)
**Why it happens:** Using colors not in ALLOWED_COLORS
**How to avoid:** Use exact colors from TimeBlockController.php ALLOWED_COLORS constant
**Warning signs:** "Invalid color" API error

### Pitfall 4: Modal Size Issues
**What goes wrong:** TimeBlock form too cramped in SettingsModal
**Why it happens:** SettingsModal has max-w-md constraint
**How to avoid:** Either expand modal width or use Dialog within Dialog for edit
**Warning signs:** UI feels cramped, poor UX

### Pitfall 5: Missing i18n Keys
**What goes wrong:** Translation keys render literally
**Why it happens:** Forgetting to add keys to both en.json and pl.json
**How to avoid:** Add all keys to both files before using in components
**Warning signs:** Literal translation keys visible in UI

### Pitfall 6: Recurrence Days Array Format
**What goes wrong:** Days saved as wrong format
**Why it happens:** 0=Sunday convention confusion
**How to avoid:** Use same convention as RecurringTask (0=Sunday, 1=Monday, etc.)
**Warning signs:** Blocks appear on wrong days

## Code Examples

### API Client Extension (api.ts)
```typescript
// Source: Follow existing api.ts patterns
timeBlock: {
  list: async (): Promise<TimeBlock[]> => {
    const response = await fetch(`${API_BASE}/time-block`, {
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch time blocks');
    }
    return response.json();
  },

  create: async (data: {
    name: string;
    color: string;
    startTime: string;
    endTime: string;
    recurrenceType?: RecurrenceType;
    recurrenceDays?: number[] | null;
    tagIds?: number[];
  }): Promise<TimeBlock> => {
    const response = await fetch(`${API_BASE}/time-block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create time block');
    }
    return response.json();
  },

  update: async (
    id: number,
    data: Partial<Omit<TimeBlock, 'id' | 'createdAt' | 'tags'>> & { tagIds?: number[] }
  ): Promise<TimeBlock> => {
    const response = await fetch(`${API_BASE}/time-block/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update time block');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/time-block/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete time block');
    }
  },
},
```

### Redux Slice (timeBlockSlice.ts)
```typescript
// Source: Follow tagSlice.ts pattern
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import type { TimeBlock, RecurrenceType } from '@/types';

interface TimeBlockState {
  timeBlocks: TimeBlock[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TimeBlockState = {
  timeBlocks: [],
  isLoading: false,
  error: null,
};

export const fetchTimeBlocks = createAsyncThunk(
  'timeBlocks/fetch',
  async () => {
    return await api.timeBlock.list();
  }
);

export const createTimeBlock = createAsyncThunk(
  'timeBlocks/create',
  async (data: {
    name: string;
    color: string;
    startTime: string;
    endTime: string;
    recurrenceType?: RecurrenceType;
    recurrenceDays?: number[] | null;
    tagIds?: number[];
  }) => {
    return await api.timeBlock.create(data);
  }
);

export const updateTimeBlock = createAsyncThunk(
  'timeBlocks/update',
  async ({ id, data }: {
    id: number;
    data: Partial<Omit<TimeBlock, 'id' | 'createdAt' | 'tags'>> & { tagIds?: number[] };
  }) => {
    return await api.timeBlock.update(id, data);
  }
);

export const deleteTimeBlock = createAsyncThunk(
  'timeBlocks/delete',
  async (id: number) => {
    await api.timeBlock.delete(id);
    return id;
  }
);

const timeBlockSlice = createSlice({
  name: 'timeBlocks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimeBlocks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimeBlocks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timeBlocks = action.payload;
      })
      .addCase(fetchTimeBlocks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch time blocks';
      })
      .addCase(createTimeBlock.fulfilled, (state, action) => {
        state.timeBlocks.push(action.payload);
      })
      .addCase(updateTimeBlock.fulfilled, (state, action) => {
        const index = state.timeBlocks.findIndex((tb) => tb.id === action.payload.id);
        if (index !== -1) {
          state.timeBlocks[index] = action.payload;
        }
      })
      .addCase(deleteTimeBlock.fulfilled, (state, action) => {
        state.timeBlocks = state.timeBlocks.filter((tb) => tb.id !== action.payload);
      });
  },
});

export const { clearError } = timeBlockSlice.actions;
export default timeBlockSlice.reducer;
```

### i18n Keys Structure
```json
// Add to en.json and pl.json
{
  "timeBlocks": {
    "title": "Time Blocks",
    "addBlock": "Add time block",
    "editBlock": "Edit time block",
    "deleteBlock": "Delete time block",
    "deleteConfirm": "Delete this time block?",
    "noBlocks": "No time blocks yet",
    "manageBlocksDesc": "Create blocks to organize your day by time",
    "name": "Block name",
    "namePlaceholder": "e.g., Deep Work, Meetings",
    "color": "Color",
    "startTime": "Start time",
    "endTime": "End time",
    "recurrence": "Recurrence",
    "tags": "Associated tags",
    "tagsDesc": "Tasks with these tags fit this block",
    "noTags": "No tags selected"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate settings pages | Modal-based settings | Already in project | Use SettingsModal pattern |
| Complex form libraries | Simple React state | Current practice | Local state for forms |

**Deprecated/outdated:**
- Nothing deprecated - following current codebase patterns

## Open Questions

Things that couldn't be fully resolved:

1. **Weekly Preview Component (REQ-017 "Should")**
   - What we know: Not strictly required (Should priority)
   - What's unclear: How detailed the preview should be
   - Recommendation: Defer to Phase 3 if time permits, or Phase 4

2. **SettingsModal Width**
   - What we know: Currently max-w-md (448px)
   - What's unclear: Will TimeBlock form fit well?
   - Recommendation: May need to expand to max-w-lg or use nested dialog for form

## Sources

### Primary (HIGH confidence)
- `/home/kamil/Code/dumpday/frontend/src/components/settings/SettingsModal.tsx` - Current settings pattern
- `/home/kamil/Code/dumpday/frontend/src/components/tags/TagManager.tsx` - CRUD list pattern
- `/home/kamil/Code/dumpday/frontend/src/components/tags/TagSelector.tsx` - Multi-select pattern
- `/home/kamil/Code/dumpday/frontend/src/components/tasks/RecurringSettings.tsx` - Recurrence UI pattern
- `/home/kamil/Code/dumpday/frontend/src/store/tagSlice.ts` - Redux slice pattern
- `/home/kamil/Code/dumpday/backend/src/Controller/TimeBlockController.php` - API endpoints and validation
- `/home/kamil/Code/dumpday/frontend/src/i18n/locales/en.json` - i18n structure

### Secondary (MEDIUM confidence)
- `/home/kamil/Code/dumpday/frontend/src/types/index.ts` - TypeScript types

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project
- Architecture: HIGH - exact patterns exist in codebase
- Pitfalls: HIGH - based on codebase patterns and API contract

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable patterns, no external dependencies)
