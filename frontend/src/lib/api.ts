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
  RebuildRequest,
  RebuildResponse,
  RecurringTask,
  RecurrenceType,
  Tag,
  SplitPart,
  AvailableSlotsResponse,
  SplitProposalResponse,
  SplitTaskResponse,
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

    assignTags: async (id: number, tagIds: number[]): Promise<{ id: number; tags: Tag[] }> => {
      const response = await fetch(`${API_BASE}/task/${id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to assign tags');
      }
      return response.json();
    },

    removeTag: async (taskId: number, tagId: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/task/${taskId}/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to remove tag');
      }
    },

    split: async (id: number, parts: SplitPart[]): Promise<SplitTaskResponse> => {
      const response = await fetch(`${API_BASE}/task/${id}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parts }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to split task');
      }
      return response.json();
    },

    merge: async (id: number): Promise<Task> => {
      const response = await fetch(`${API_BASE}/task/${id}/merge`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to merge task');
      }
      return response.json();
    },

    getSubtasks: async (id: number): Promise<{ subtasks: Task[] }> => {
      const response = await fetch(`${API_BASE}/task/${id}/subtasks`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch subtasks');
      }
      return response.json();
    },
  },

  tag: {
    list: async (): Promise<Tag[]> => {
      const response = await fetch(`${API_BASE}/tag`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch tags');
      }
      return response.json();
    },

    create: async (data: { name: string; color: string }): Promise<Tag> => {
      const response = await fetch(`${API_BASE}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create tag');
      }
      return response.json();
    },

    update: async (id: number, data: Partial<Pick<Tag, 'name' | 'color'>>): Promise<Tag> => {
      const response = await fetch(`${API_BASE}/tag/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update tag');
      }
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/tag/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete tag');
      }
    },

    colors: async (): Promise<string[]> => {
      const response = await fetch(`${API_BASE}/tag/colors`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch tag colors');
      }
      return response.json();
    },
  },

  event: {
    create: async (data: {
      title: string;
      date: string;
      startTime: string;
      endTime?: string | null;
    }): Promise<Event> => {
      const response = await fetch(`${API_BASE}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create event');
      }
      return response.json();
    },

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
    list: async (sort: 'newest' | 'oldest' = 'newest'): Promise<Note[]> => {
      const response = await fetch(`${API_BASE}/notes?sort=${sort}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch notes');
      }
      return response.json();
    },

    search: async (query: string): Promise<Note[]> => {
      const response = await fetch(`${API_BASE}/note/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to search notes');
      }
      return response.json();
    },

    create: async (data: { content: string; date: string; title?: string; format?: string }): Promise<Note> => {
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
      data: Partial<Pick<Note, 'content' | 'title' | 'format'>>
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

  rebuild: {
    generate: async (data: RebuildRequest): Promise<RebuildResponse> => {
      const response = await fetch(`${API_BASE}/rebuild`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate rebuild schedule');
      }
      return response.json();
    },

    accept: async (
      schedule: ScheduleSuggestion[]
    ): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE}/rebuild/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to accept rebuild schedule');
      }
      return response.json();
    },
  },

  recurring: {
    list: async (): Promise<RecurringTask[]> => {
      const response = await fetch(`${API_BASE}/recurring`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch recurring tasks');
      }
      return response.json();
    },

    create: async (data: {
      title: string;
      recurrenceType: RecurrenceType;
      recurrenceDays?: number[] | null;
      startDate?: string;
      endDate?: string | null;
      category?: TaskCategory;
      estimatedMinutes?: number | null;
      fixedTime?: string | null;
      linkTaskId?: number;
    }): Promise<RecurringTask & { linkedTaskId?: number }> => {
      const response = await fetch(`${API_BASE}/recurring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create recurring task');
      }
      return response.json();
    },

    update: async (
      id: number,
      data: Partial<Omit<RecurringTask, 'id' | 'createdAt'>>
    ): Promise<RecurringTask> => {
      const response = await fetch(`${API_BASE}/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update recurring task');
      }
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(`${API_BASE}/recurring/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete recurring task');
      }
    },

    deleteAll: async (id: number): Promise<{ deletedTasks: number }> => {
      const response = await fetch(`${API_BASE}/recurring/${id}/all`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete recurring task');
      }
      return response.json();
    },

    sync: async (date?: string): Promise<{ generated: number; tasks: { id: number; title: string }[] }> => {
      const response = await fetch(`${API_BASE}/recurring/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to sync recurring tasks');
      }
      return response.json();
    },
  },

  schedule: {
    getAvailableSlots: async (date: string): Promise<AvailableSlotsResponse> => {
      const response = await fetch(`${API_BASE}/schedule/available-slots?date=${encodeURIComponent(date)}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch available slots');
      }
      return response.json();
    },

    proposeSplit: async (taskId: number, date: string): Promise<SplitProposalResponse> => {
      const response = await fetch(`${API_BASE}/schedule/propose-split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, date }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to propose split');
      }
      return response.json();
    },
  },
};
