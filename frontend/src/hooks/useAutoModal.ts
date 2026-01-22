import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '@/store/howAreYouSlice';
import type { RootState, AppDispatch } from '@/store';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';

const INTERVAL_MS: Record<string, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

function getSessionStart(): number {
  const stored = getStorageItem(STORAGE_KEYS.SESSION_START, '');
  if (stored) {
    const parsed = parseInt(stored, 10);
    // Check if session start is from today
    const today = new Date().toDateString();
    const storedDate = new Date(parsed).toDateString();
    if (today === storedDate) {
      return parsed;
    }
  }
  // New day or no stored value - set new session start
  const now = Date.now();
  setStorageItem(STORAGE_KEYS.SESSION_START, String(now));
  return now;
}

export function useAutoModal() {
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval } = useSelector((state: RootState) => state.settings);
  const { lastModalAt, isOpen } = useSelector(
    (state: RootState) => state.howAreYou
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const checkRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (checkRef.current) {
      clearInterval(checkRef.current);
      checkRef.current = null;
    }

    if (!isAuthenticated || checkInInterval === 'off') {
      return;
    }

    const intervalMs = INTERVAL_MS[checkInInterval];
    if (!intervalMs) return;

    // Get or initialize session start time
    if (sessionStartRef.current === null) {
      sessionStartRef.current = getSessionStart();
    }

    const checkAndOpen = () => {
      if (isOpen) return;

      const now = Date.now();

      // If we have a last modal open, use it as the reference
      // Otherwise, use the session start time (so modal appears after interval from page load)
      const lastCheck = lastModalAt
        ? new Date(lastModalAt).getTime()
        : sessionStartRef.current!;

      if (now - lastCheck >= intervalMs) {
        dispatch(openModal());
      }
    };

    // Check every minute (not immediately on mount to avoid instant popup)
    checkRef.current = setInterval(checkAndOpen, 60 * 1000);

    return () => {
      if (checkRef.current) {
        clearInterval(checkRef.current);
      }
    };
  }, [checkInInterval, lastModalAt, isOpen, isAuthenticated, dispatch]);
}
