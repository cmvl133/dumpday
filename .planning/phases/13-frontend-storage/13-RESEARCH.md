# Phase 13: Frontend Storage - Research

**Researched:** 2026-01-22
**Domain:** React localStorage centralization, TypeScript type safety
**Confidence:** HIGH

## Summary

This phase centralizes scattered localStorage calls into a typed `useStorage` hook with centralized key definitions. The codebase currently has 7 distinct localStorage usage points spread across 6 files, using 5 different storage keys. Each location implements its own get/set/parse logic with varying error handling.

The standard approach is to create a generic `useStorage<T>` hook that wraps localStorage with:
1. TypeScript generics for value types
2. Centralized key constants for compile-time safety
3. JSON serialization/deserialization with error handling
4. SSR compatibility checks (though not strictly needed for this SPA)

**Primary recommendation:** Create a custom `useStorage` hook with typed key-value mapping rather than installing an external library, as the project's needs are simple and the codebase patterns favor custom hooks.

## Current State Analysis

### Storage Keys Currently in Use

| Key | File | Data Type | Purpose |
|-----|------|-----------|---------|
| `dopaminder_last_modal` | `howAreYouSlice.ts`, `checkInFlowSlice.ts` | `string` (ISO date) | Track last modal open time |
| `tagFilter` | `tagSlice.ts` | `{ activeFilters: number[], filterMode: 'and' \| 'or' }` | Persist tag filter selection |
| `dopaminder_sent_reminders` | `useReminders.ts` | `Record<string, number>` | Track sent reminders with timestamps |
| `dopaminder_session_start` | `useAutoModal.ts` | `string` (timestamp) | Track session start for auto-modal timing |
| `dopaminder_collapsed_boxes` | `AnalysisResults.tsx` | `BoxId[]` (array of string literals) | Track collapsed UI sections |
| `i18nextLng` | `i18n/index.ts` | `string` | Language preference (managed by i18next) |

### Current Implementation Patterns

**Pattern A: Slice-level helpers (howAreYouSlice, checkInFlowSlice, tagSlice)**
```typescript
// Separate get/set functions per slice
function getStoredValue(): Type | null {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function storeValue(value: Type): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Ignore
  }
}
```

**Pattern B: Hook-level helpers (useReminders, useAutoModal)**
```typescript
// Functions defined inside hook file
function getSentReminders(): Set<string> { /* ... */ }
function markReminderSent(taskId: number, reminderTime: string): void { /* ... */ }
```

**Pattern C: Component-level helpers (AnalysisResults.tsx)**
```typescript
// Functions at component file top level
function getCollapsedBoxes(): BoxId[] { /* ... */ }
function saveCollapsedBoxes(boxes: BoxId[]): void { /* ... */ }
```

### Issues with Current Approach

1. **Duplicated code** - Each file reimplements try/catch JSON parse/stringify
2. **Scattered keys** - Keys defined as string literals in multiple locations
3. **No type connection** - Key and value type relationship not enforced
4. **Inconsistent patterns** - Some use separate functions, others inline
5. **Duplicate key definition** - `dopaminder_last_modal` defined in two slices (both howAreYouSlice and checkInFlowSlice)

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native localStorage | - | Browser storage | Already using, no dependencies needed |
| TypeScript generics | - | Type safety | Built into existing stack |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom hook | usehooks-ts | External dependency for simple need; project favors custom hooks |
| Custom hook | @uidotdev/usehooks | Same as above |
| localStorage | IndexedDB | Overkill for simple key-value storage |

**Decision:** Custom implementation. The project has 4 custom hooks already (`useDebounce`, `useReminders`, `useAutoModal`, `useTagFilter`). Adding another follows established patterns without new dependencies.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   └── storage.ts           # Storage constants and types
├── hooks/
│   └── useStorage.ts        # Generic useStorage hook
└── store/
    └── ...slices.ts         # Refactored to use useStorage
```

### Pattern 1: Typed Storage Key Registry

**What:** Define all storage keys and their value types in a single location
**When to use:** Any project with 3+ localStorage keys

```typescript
// src/lib/storage.ts

// Storage key constants - prevents typos, enables find-all-references
export const STORAGE_KEYS = {
  LAST_MODAL: 'dopaminder_last_modal',
  TAG_FILTER: 'dopaminder_tag_filter',  // Renamed for consistency
  SENT_REMINDERS: 'dopaminder_sent_reminders',
  SESSION_START: 'dopaminder_session_start',
  COLLAPSED_BOXES: 'dopaminder_collapsed_boxes',
} as const;

// Type for any storage key
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Value type mapping - connects key to its stored type
export interface StorageSchema {
  [STORAGE_KEYS.LAST_MODAL]: string | null;
  [STORAGE_KEYS.TAG_FILTER]: { activeFilters: number[]; filterMode: 'and' | 'or' };
  [STORAGE_KEYS.SENT_REMINDERS]: Record<string, number>;
  [STORAGE_KEYS.SESSION_START]: string;
  [STORAGE_KEYS.COLLAPSED_BOXES]: ('scheduled' | 'someday' | 'notes' | 'journal')[];
}
```

### Pattern 2: Generic useStorage Hook

**What:** React hook providing typed get/set/remove for any storage key
**When to use:** Any localStorage access in React components or hooks

```typescript
// src/hooks/useStorage.ts
import { useState, useCallback, useEffect } from 'react';
import type { StorageKey, StorageSchema } from '@/lib/storage';

export function useStorage<K extends StorageKey>(
  key: K,
  initialValue: StorageSchema[K]
): [StorageSchema[K], (value: StorageSchema[K]) => void, () => void] {
  // Initialize from localStorage or fallback to initial
  const [storedValue, setStoredValue] = useState<StorageSchema[K]>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Setter that persists to localStorage
  const setValue = useCallback((value: StorageSchema[K]) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail - storage might be full or disabled
    }
  }, [key]);

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      localStorage.removeItem(key);
    } catch {
      // Silently fail
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

### Pattern 3: Non-Hook Storage Utilities

**What:** For Redux slices that can't use hooks, provide typed utility functions
**When to use:** Inside Redux slice files, thunks, or non-component code

```typescript
// src/lib/storage.ts (additional exports)

export function getStorageItem<K extends StorageKey>(
  key: K,
  fallback: StorageSchema[K]
): StorageSchema[K] {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem<K extends StorageKey>(
  key: K,
  value: StorageSchema[K]
): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail
  }
}

export function removeStorageItem<K extends StorageKey>(key: K): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}
```

### Anti-Patterns to Avoid

- **Hardcoded string keys:** `localStorage.getItem('tagFilter')` - use `STORAGE_KEYS.TAG_FILTER`
- **Inline JSON.parse without try/catch:** Always wrap in try/catch
- **Direct localStorage in components:** Use `useStorage` hook instead
- **Duplicating storage key in multiple files:** Single source of truth in `storage.ts`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-tab sync | Custom storage events | Not needed | This app doesn't need cross-tab sync |
| SSR handling | Window checks | Not needed | Pure SPA, no SSR |
| Complex state | localStorage wrapper | Redux persist | For complex state, but not needed here |

**Key insight:** The project's localStorage needs are simple (5 keys, no cross-tab sync, no SSR). A minimal custom implementation is better than a full-featured library.

## Common Pitfalls

### Pitfall 1: Migration Breaking Existing Data

**What goes wrong:** Renaming keys or changing data shapes breaks existing user data
**Why it happens:** Storage key rename without migration
**How to avoid:**
- Keep existing key names OR add migration logic
- For `tagFilter` -> `dopaminder_tag_filter`: check old key, migrate, delete old
**Warning signs:** Users losing settings after update

### Pitfall 2: Circular Dependencies with Slices

**What goes wrong:** Storage utilities importing from slices, slices importing storage
**Why it happens:** Trying to share types between storage and Redux
**How to avoid:**
- Storage module has NO imports from store
- Types live in `lib/storage.ts` or `types/index.ts`
**Warning signs:** Webpack/Vite circular dependency warnings

### Pitfall 3: Storage Quota Exceeded

**What goes wrong:** `setItem` throws when quota exceeded (5-10MB typical)
**Why it happens:** Storing too much data or many keys
**How to avoid:** Always wrap in try/catch, which current code does
**Warning signs:** Storage operations silently failing

### Pitfall 4: Duplicate Key Between Slices

**What goes wrong:** Two slices reading/writing same key with different logic
**Why it happens:** `howAreYouSlice` and `checkInFlowSlice` both use `dopaminder_last_modal`
**How to avoid:**
- Centralize key access in storage utility
- One "owner" for each key, others read-only or use via Redux
**Warning signs:** Inconsistent state between components

## Code Examples

### Migration Example: tagSlice.ts

**Before:**
```typescript
const loadFilterState = (): { activeFilters: number[]; filterMode: TagFilterMode } => {
  try {
    const saved = localStorage.getItem('tagFilter');
    // ...
  } catch { /* ... */ }
};
```

**After:**
```typescript
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

const loadFilterState = () => getStorageItem(
  STORAGE_KEYS.TAG_FILTER,
  { activeFilters: [], filterMode: 'or' }
);

const saveFilterState = (activeFilters: number[], filterMode: TagFilterMode) =>
  setStorageItem(STORAGE_KEYS.TAG_FILTER, { activeFilters, filterMode });
```

### Migration Example: useAutoModal.ts

**Before:**
```typescript
const SESSION_START_KEY = 'dopaminder_session_start';

function getSessionStart(): number {
  const stored = localStorage.getItem(SESSION_START_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    // ...
  }
  // ...
}
```

**After:**
```typescript
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

function getSessionStart(): number {
  const stored = getStorageItem(STORAGE_KEYS.SESSION_START, '');
  if (stored) {
    const parsed = parseInt(stored, 10);
    // ...
  }
  // ...
}
```

### Migration Example: AnalysisResults.tsx (Component with useState)

**Before:**
```typescript
const COLLAPSED_BOXES_KEY = 'dopaminder_collapsed_boxes';

function getCollapsedBoxes(): BoxId[] {
  try {
    const stored = localStorage.getItem(COLLAPSED_BOXES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// In component:
const [collapsedBoxes, setCollapsedBoxes] = useState<BoxId[]>([]);
useEffect(() => {
  setCollapsedBoxes(getCollapsedBoxes());
}, []);
```

**After:**
```typescript
import { useStorage } from '@/hooks/useStorage';
import { STORAGE_KEYS } from '@/lib/storage';

// In component:
const [collapsedBoxes, setCollapsedBoxes] = useStorage(STORAGE_KEYS.COLLAPSED_BOXES, []);
// No useEffect needed - initial value comes from storage
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based storage services | Hook-based useStorage | React 16.8+ | Cleaner component integration |
| String literal keys | Const objects with `as const` | TypeScript 3.4+ | Compile-time key validation |
| External libraries (redux-persist) | Custom hooks for simple needs | 2022+ | Less dependencies, more control |

**Note:** i18next localStorage usage (language preference) should NOT be migrated - it's managed by the i18next-browser-languagedetector plugin and has its own key naming convention.

## Open Questions

1. **Key migration for tagFilter**
   - What we know: Current key is `tagFilter`, proposed is `dopaminder_tag_filter`
   - What's unclear: Should we migrate or keep existing key for backward compatibility?
   - Recommendation: Keep `tagFilter` for backward compatibility, just move definition to constants

2. **howAreYouSlice vs checkInFlowSlice key sharing**
   - What we know: Both slices access `dopaminder_last_modal`
   - What's unclear: Should one be the "owner" or should we keep both?
   - Recommendation: Review during implementation - likely howAreYouSlice should be sole owner

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `frontend/src/store/*.ts`, `frontend/src/hooks/*.ts`, `frontend/src/components/analysis/AnalysisResults.tsx`
- TypeScript Handbook - Enums: https://www.typescriptlang.org/docs/handbook/enums.html

### Secondary (MEDIUM confidence)
- usehooks-ts documentation: https://usehooks-ts.com/react-hook/use-local-storage
- HeroDevs Type-Safe Storage Pattern: https://www.herodevs.com/blog-posts/interact-with-browser-storage-type-safe

### Tertiary (LOW confidence)
- Community patterns from WebSearch (verified against codebase)

## Metadata

**Confidence breakdown:**
- Current state analysis: HIGH - Direct codebase inspection
- Standard stack: HIGH - Using existing project patterns
- Architecture patterns: HIGH - Based on established TypeScript/React patterns
- Migration strategy: MEDIUM - Implementation details may need adjustment

**Research date:** 2026-01-22
**Valid until:** 90 days (stable patterns, no fast-moving dependencies)
