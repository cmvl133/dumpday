import type {
  AnalysisResponse,
  DailyNoteData,
  SaveDailyNoteRequest,
  Task,
  Event,
  JournalEntry,
  Note,
} from '@/types';

const API_BASE = '/api';

export const api = {
  brainDump: {
    analyze: async (
      rawContent: string,
      date: string
    ): Promise<AnalysisResponse> => {
      const response = await fetch(`${API_BASE}/brain-dump/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent, date }),
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
      const response = await fetch(`${API_BASE}/daily-note/${date}`);
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
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to save');
      }
      return response.json();
    },
  },

  task: {
    update: async (
      id: number,
      data: Partial<Pick<Task, 'isCompleted' | 'title'>>
    ): Promise<Task> => {
      const response = await fetch(`${API_BASE}/task/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete event');
      }
    },
  },

  journal: {
    update: async (
      id: number,
      data: Partial<Pick<JournalEntry, 'content'>>
    ): Promise<JournalEntry> => {
      const response = await fetch(`${API_BASE}/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete journal entry');
      }
    },
  },

  note: {
    update: async (
      id: number,
      data: Partial<Pick<Note, 'content'>>
    ): Promise<Note> => {
      const response = await fetch(`${API_BASE}/note/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete note');
      }
    },
  },
};
