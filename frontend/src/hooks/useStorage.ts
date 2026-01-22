import { useState, useCallback } from 'react';
import type { StorageKey, StorageSchema } from '@/lib/storage';

/**
 * React hook for typed localStorage access.
 * Provides useState-like API with automatic persistence.
 *
 * @param key - Storage key from STORAGE_KEYS
 * @param initialValue - Default value if nothing stored
 * @returns [value, setValue, removeValue] tuple
 */
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
  const setValue = useCallback(
    (value: StorageSchema[K]) => {
      try {
        setStoredValue(value);
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silently fail - storage might be full or disabled
      }
    },
    [key]
  );

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
