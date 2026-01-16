export type TaskCategory = 'today' | 'scheduled' | 'someday';

export interface Task {
  id?: number;
  title: string;
  isCompleted: boolean;
  isDropped?: boolean;
  dueDate: string | null;
  category?: TaskCategory;
  completedAt?: string | null;
  reminderTime?: string | null;
}

export type CheckInInterval = 'off' | '2h' | '3h' | '4h';

export type ReminderTone = 'gentle' | 'normal' | 'aggressive' | 'vulgar' | 'bigpoppapump';

export interface Settings {
  checkInInterval: CheckInInterval;
  zenMode: boolean;
  soundEnabled: boolean;
  reminderTone: ReminderTone;
}

export interface CheckInTask {
  id: number;
  title: string;
  dueDate: string | null;
  category: TaskCategory;
  reminderTime?: string | null;
}

export interface CheckInTasksResponse {
  overdue: CheckInTask[];
  today: CheckInTask[];
  lastCheckInAt: string | null;
}

export interface CheckInStats {
  done: number;
  tomorrow: number;
  today: number;
  dropped: number;
  overdueCleared: number;
  bestCombo: number;
}

export interface CheckIn {
  id: number;
  date: string;
  completedAt: string;
  statsDone: number;
  statsTomorrow: number;
  statsToday: number;
  statsDropped: number;
  statsOverdueCleared: number;
  bestCombo: number;
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
