import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import { getRandomReminderMessage } from '@/lib/toneMessages';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '@/lib/storage';
import type { Task } from '@/types';

function getSentReminders(): Set<string> {
  const data = getStorageItem(STORAGE_KEYS.SENT_REMINDERS, {});
  // Clean up old entries (older than 24 hours)
  const now = Date.now();
  const filtered = Object.entries(data).filter(
    ([, timestamp]) => now - (timestamp as number) < 24 * 60 * 60 * 1000
  );
  return new Set(filtered.map(([key]) => key));
}

function markReminderSent(taskId: number, reminderTime: string): void {
  const data = getStorageItem(STORAGE_KEYS.SENT_REMINDERS, {});
  const key = `${taskId}-${reminderTime}`;
  data[key] = Date.now();
  setStorageItem(STORAGE_KEYS.SENT_REMINDERS, data);
}

function getCurrentTimeHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered');
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

function showNotification(title: string, body: string): void {
  if (Notification.permission !== 'granted') return;

  // Try to use service worker notification
  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body,
      icon: '/vite.svg',
      tag: 'reminder',
      requireInteraction: true,
    });
  }).catch(() => {
    // Fallback to regular notification
    new Notification(title, { body, icon: '/vite.svg' });
  });
}

export function useReminders() {
  const { reminderTone } = useSelector((state: RootState) => state.settings);
  const dailyNote = useSelector((state: RootState) => state.dailyNote.dailyNote);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const hasPermissionRef = useRef<boolean>(false);

  // Register service worker on mount
  useEffect(() => {
    if (!isAuthenticated) return;

    registerServiceWorker().then((reg) => {
      swRegistrationRef.current = reg;
    });

    requestNotificationPermission().then((granted) => {
      hasPermissionRef.current = granted;
    });
  }, [isAuthenticated]);

  // Get all tasks with reminders
  const getAllTasksWithReminders = useCallback((): Task[] => {
    if (!dailyNote) return [];

    const allTasks: Task[] = [
      ...dailyNote.tasks.today,
      ...dailyNote.tasks.scheduled,
      ...dailyNote.tasks.someday,
    ];

    return allTasks.filter(
      (task) => task.reminderTime && !task.isCompleted && task.id
    );
  }, [dailyNote]);

  // Check reminders every minute
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkReminders = () => {
      if (!hasPermissionRef.current) return;

      const currentTime = getCurrentTimeHHMM();
      const tasks = getAllTasksWithReminders();
      const sentReminders = getSentReminders();

      for (const task of tasks) {
        if (!task.id || !task.reminderTime) continue;

        const key = `${task.id}-${task.reminderTime}`;

        // Check if it's time and we haven't sent this reminder today
        if (task.reminderTime === currentTime && !sentReminders.has(key)) {
          const message = getRandomReminderMessage(reminderTone, task.title);
          showNotification('Dopaminder', message);
          markReminderSent(task.id, task.reminderTime);
        }
      }
    };

    // Check immediately
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getAllTasksWithReminders, reminderTone]);

  // Return function to manually request permission
  return {
    requestPermission: requestNotificationPermission,
  };
}
