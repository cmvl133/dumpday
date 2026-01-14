export type TaskCategory = 'today' | 'scheduled' | 'someday';

export interface Task {
  id?: number;
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
  category?: TaskCategory;
}

export interface Event {
  id?: number;
  title: string;
  startTime: string;
  endTime: string | null;
  date: string;
}

export interface ScheduleEvent extends Event {
  topPercent: number;
  heightPercent: number;
}

export interface JournalEntry {
  id?: number;
  content: string;
}

export interface Note {
  id?: number;
  content: string;
}

export interface TasksGroup {
  today: Task[];
  scheduled: Task[];
  someday: Task[];
}

export interface AnalysisResponse {
  tasks: {
    today: { title: string }[];
    scheduled: { title: string; dueDate?: string }[];
    someday: { title: string }[];
  };
  events: {
    title: string;
    date: string;
    startTime: string;
    endTime?: string;
    duration?: number;
  }[];
  notes: { content: string }[];
  journal: { content: string }[];
  schedule: ScheduleEvent[];
}

export interface DailyNoteData {
  id: number;
  date: string;
  rawContent: string | null;
  tasks: TasksGroup;
  events: Event[];
  notes: Note[];
  journal: JournalEntry[];
  schedule: ScheduleEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveDailyNoteRequest {
  rawContent: string;
  date: string;
  analysis: AnalysisResponse;
}
