import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openCheckIn, fetchCheckInTasks } from '@/store/checkInSlice';
import type { RootState, AppDispatch } from '@/store';

const INTERVAL_MS: Record<string, number> = {
  '2h': 2 * 60 * 60 * 1000,
  '3h': 3 * 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

export function useAutoCheckIn() {
  const dispatch = useDispatch<AppDispatch>();
  const { checkInInterval } = useSelector((state: RootState) => state.settings);
  const { lastCheckInAt, isOpen } = useSelector(
    (state: RootState) => state.checkIn
  );
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const checkRef = useRef<NodeJS.Timeout | null>(null);

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

    const checkAndOpen = () => {
      if (isOpen) return;

      const now = Date.now();
      const lastCheck = lastCheckInAt ? new Date(lastCheckInAt).getTime() : 0;

      if (now - lastCheck >= intervalMs) {
        dispatch(openCheckIn());
        dispatch(fetchCheckInTasks());
      }
    };

    // Check immediately on mount/interval change
    checkAndOpen();

    // Then check every minute
    checkRef.current = setInterval(checkAndOpen, 60 * 1000);

    return () => {
      if (checkRef.current) {
        clearInterval(checkRef.current);
      }
    };
  }, [checkInInterval, lastCheckInAt, isOpen, isAuthenticated, dispatch]);
}
