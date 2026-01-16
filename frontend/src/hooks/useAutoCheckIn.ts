import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openCheckIn, fetchCheckInTasks } from '@/store/checkInSlice';
import type { RootState, AppDispatch } from '@/store';

const INTERVAL_MS: Record<string, number> = {
  '1h': 1 * 60 * 60 * 1000,
  '2h': 2 * 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

const SESSION_START_KEY = 'dopaminder_session_start';

function getSessionStart(): number {
  const stored = localStorage.getItem(SESSION_START_KEY);
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
  localStorage.setItem(SESSION_START_KEY, String(now));
  return now;
}

export function useAutoCheckIn() {
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval } = useSelector((state: RootState) => state.settings);
  const { lastCheckInAt, isOpen } = useSelector(
    (state: RootState) => state.checkIn
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

      // If we have a last check-in, use it as the reference
      // Otherwise, use the session start time (so check-in appears after interval from page load)
      const lastCheck = lastCheckInAt
        ? new Date(lastCheckInAt).getTime()
        : sessionStartRef.current!;

      if (now - lastCheck >= intervalMs) {
        dispatch(openCheckIn());
        dispatch(fetchCheckInTasks());
      }
    };

    // Check every minute (not immediately on mount to avoid instant popup)
    checkRef.current = setInterval(checkAndOpen, 60 * 1000);

    return () => {
      if (checkRef.current) {
        clearInterval(checkRef.current);
      }
    };
  }, [checkInInterval, lastCheckInAt, isOpen, isAuthenticated, dispatch]);
}
