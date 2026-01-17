import type {
  AnalysisResponse,
  DailyNoteData,
  SaveDailyNoteRequest,
  Task,
  TaskCategory,
  Event,
  JournalEntry,
  Note,
  CheckInTasksResponse,
  CheckInStats,
  CheckIn,
  Settings,
  PlanningTasksResponse,
  PlanningTaskData,
  GeneratedSchedule,
  ScheduleSuggestion,
} from '@/types';

const API_BASE = '/api';

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: { id: number; email: string };
}

export const api = {
  auth: {
    requestCode: async (email: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE}/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });
      return response.json();
    },

    verifyCode: async (email: string, code: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
        credentials: 'include',
      });
      return response.json();
    },

    logout: async (): Promise<void> => {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    },

    me: async (): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      if (!response.ok) {
        return { success: false };
      }
      return response.json();
    },
  },

  brainDump: {
    analyze: async (
      rawContent: string,
      date: string
    ): Promise<AnalysisResponse> => {
      const response = await fetch(`${API_BASE}/brain-dump/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent, date }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Analysis failed');
      }
      return response.json();
    },
  },

  dailyNote: {
    get: async (date: string): Promise<DailyNoteData | null> => {
      const response = await fetch(`${API_BASE}/daily-note/${date}`, {
        credentials: 'include',
      });
      if (response.status === 404) return null;
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch daily note');
      }
      return response.json();
    },

    save: async (data: SaveDailyNoteRequest): Promise<DailyNoteData> => {
      const response = await fetch(`${API_BASE}/daily-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save');
      }
      return response.json();
    },
  },

  task: {
    create: async (data: {
      title: string;
      date: string;
      dueDate?: string | null;
      category?: TaskCategory;
    }): Promise<Task> => {
      const response = await fetch(`${API_BASE}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create task');
      }
      return response.json();
    },

    update: async (
      id: number,
      data: Partial<Pick<Task, 'isCompleted' | 'title' | 'dueDate' | 'reminderTime' | 'estimatedMinutes' | 'fixedTime' | 'canCombineWithEvents' | 'needsFullFocus'>>
    ): Promise<Task> => {
      const response = await fetch(`${API_BASE}/task/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update task');
      }
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/task/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete task');
      }
    },
  },

  event: {
    update: async (
      id: number,
      data: Partial<Pick<Event, 'title' | 'startTime' | 'endTime'>>
    ): Promise<Event> => {
      const response = await fetch(`${API_BASE}/event/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update event');
      }
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/event/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete event');
      }
    },
  },

  journal: {
    create: async (data: { content: string; date: string }): Promise<JournalEntry> => {
      const response = await fetch(`${API_BASE}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create journal entry');
      }
      return response.json();
    },

    update: async (
      id: number,
      data: Partial<Pick<JournalEntry, 'content'>>
    ): Promise<JournalEntry> => {
      const response = await fetch(`${API_BASE}/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update journal entry');
      }
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/journal/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete journal entry');
      }
    },
  },

  note: {
    create: async (data: { content: string; date: string }): Promise<Note> => {
      const response = await fetch(`${API_BASE}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create note');
      }
      return response.json();
    },

    update: async (
      id: number,
      data: Partial<Pick<Note, 'content'>>
    ): Promise<Note> => {
      const response = await fetch(`${API_BASE}/note/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update note');
      }
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/note/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete note');
      }
    },
  },

  checkIn: {
    getTasks: async (): Promise<CheckInTasksResponse> => {
      const response = await fetch(`${API_BASE}/check-in/tasks`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch check-in tasks');
      }
      return response.json();
    },

    taskAction: async (
      id: number,
      action: 'done' | 'tomorrow' | 'today' | 'drop'
    ): Promise<{ success: boolean; task: Task }> => {
      const response = await fetch(`${API_BASE}/check-in/task/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to perform task action');
      }
      return response.json();
    },

    complete: async (
      stats: CheckInStats
    ): Promise<{ success: boolean; checkIn: CheckIn }> => {
      const response = await fetch(`${API_BASE}/check-in/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to complete check-in');
      }
      return response.json();
    },
  },

  settings: {
    get: async (): Promise<Settings> => {
      const response = await fetch(`${API_BASE}/settings`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch settings');
      }
      return response.json();
    },

    update: async (data: Partial<Settings>): Promise<Settings> => {
      const response = await fetch(`${API_BASE}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update settings');
      }
      return response.json();
    },
  },

  planning: {
    getTasks: async (): Promise<PlanningTasksResponse> => {
      const response = await fetch(`${API_BASE}/planning/tasks`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch planning tasks');
      }
      return response.json();
    },

    saveTask: async (
      id: number,
      data: PlanningTaskData
    ): Promise<{ success: boolean; task: Task }> => {
      const response = await fetch(`${API_BASE}/planning/task/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save task planning');
      }
      return response.json();
    },

    generateSchedule: async (taskIds: number[]): Promise<GeneratedSchedule> => {
      const response = await fetch(`${API_BASE}/planning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate schedule');
      }
      return response.json();
    },

    acceptSchedule: async (
      schedule: ScheduleSuggestion[]
    ): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE}/planning/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to accept schedule');
      }
      return response.json();
    },
  },
};
