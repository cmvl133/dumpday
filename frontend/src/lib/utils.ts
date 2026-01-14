import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Schedule calculation utilities (must match backend ScheduleBuilder)
const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 22;
const TOTAL_HOURS = SCHEDULE_END_HOUR - SCHEDULE_START_HOUR;

export function calculateTopPercent(startTime: string | null | undefined): number {
  if (!startTime) return 0;

  const [hours, minutes] = startTime.split(':').map(Number);
  const hoursFromStart = Math.max(0, hours - SCHEDULE_START_HOUR) + minutes / 60;

  return (hoursFromStart / TOTAL_HOURS) * 100;
}

export function calculateHeightPercent(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): number {
  if (!startTime || !endTime) {
    return (1 / TOTAL_HOURS) * 100; // Default 1 hour
  }

  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const durationMinutes = Math.max(30, endTotalMinutes - startTotalMinutes);
  const durationHours = durationMinutes / 60;

  return (durationHours / TOTAL_HOURS) * 100;
}
