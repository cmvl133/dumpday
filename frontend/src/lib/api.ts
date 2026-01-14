import type {
  AnalysisResponse,
  DailyNoteData,
  SaveDailyNoteRequest,
  Task,
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
};
