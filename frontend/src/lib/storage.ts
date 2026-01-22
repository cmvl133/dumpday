/**
 * Centralized storage module for typed localStorage access.
 * All storage keys and their types are defined here to ensure consistency.
 */

export const STORAGE_KEYS = {
  LAST_MODAL: 'dopaminder_last_modal',
  TAG_FILTER: 'tagFilter', // Keep existing key for backward compatibility
  SENT_REMINDERS: 'dopaminder_sent_reminders',
  SESSION_START: 'dopaminder_session_start',
  COLLAPSED_BOXES: 'dopaminder_collapsed_boxes',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// BoxId type for collapsed boxes (from AnalysisResults.tsx)
export type BoxId = 'scheduled' | 'someday' | 'notes' | 'journal';

export interface StorageSchema {
  [STORAGE_KEYS.LAST_MODAL]: string | null;
  [STORAGE_KEYS.TAG_FILTER]: { activeFilters: number[]; filterMode: 'and' | 'or' };
  [STORAGE_KEYS.SENT_REMINDERS]: Record<string, number>;
  [STORAGE_KEYS.SESSION_START]: string;
  [STORAGE_KEYS.COLLAPSED_BOXES]: BoxId[];
}

/**
 * Get a typed value from localStorage.
 * @param key - Storage key from STORAGE_KEYS
 * @param fallback - Default value if nothing stored or parse fails
 * @returns The stored value or fallback
 */
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

/**
 * Set a typed value in localStorage.
 * @param key - Storage key from STORAGE_KEYS
 * @param value - Value to store (will be JSON stringified)
 */
export function setStorageItem<K extends StorageKey>(
  key: K,
  value: StorageSchema[K]
): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail - storage might be full or disabled
  }
}

/**
 * Remove a key from localStorage.
 * @param key - Storage key from STORAGE_KEYS
 */
export function removeStorageItem<K extends StorageKey>(key: K): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}
