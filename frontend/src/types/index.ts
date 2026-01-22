export type TaskCategory = 'today' | 'scheduled' | 'someday';

export type RecurrenceType = 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'custom';

export type TagFilterMode = 'and' | 'or';

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface RecurringTask {
  id: number;
  title: string;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null;
  startDate: string;
  endDate: string | null;
  category: TaskCategory;
  estimatedMinutes: number | null;
  fixedTime: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface TimeBlock {
  id: number;
  name: string;
  color: string;           // Hex color, e.g., "#9d4edd"
  startTime: string;       // "HH:MM" format
  endTime: string;         // "HH:MM" format
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null;
  isActive: boolean;
  createdAt: string;
  tags: Tag[];
  // Exception fields (present when block has been modified/skipped for a specific date)
  isException?: boolean;
  originalStartTime?: string;  // Original time when overridden
  originalEndTime?: string;
}

export interface Task {
  id?: number;
  title: string;
  isCompleted: boolean;
  isDropped?: boolean;
  dueDate: string | null;
  category?: TaskCategory;
  completedAt?: string | null;
  reminderTime?: string | null;
  estimatedMinutes?: number | null;
  fixedTime?: string | null;
  canCombineWithEvents?: number[] | null;
  needsFullFocus?: boolean;
  recurringTaskId?: number | null;
  parentTaskId?: number | null;
  isPart?: boolean;
  partNumber?: number | null;
  progress?: string | null;
  hasSubtasks?: boolean;
  tags?: Tag[];
  matchingBlock?: {
    id: number;
    name: string;
    color: string;
  } | null;
}

export type CheckInInterval = 'off' | '1h' | '2h' | '3h' | '4h';

export type ReminderTone = 'gentle' | 'normal' | 'aggressive' | 'vulgar' | 'bigpoppapump';

export type Language = 'en' | 'pl';

export type ConfettiStyle = 'classic' | 'stars' | 'explosion' | 'neon' | 'fire';

export interface Settings {
  checkInInterval: CheckInInterval;
  zenMode: boolean;
  reminderTone: ReminderTone;
  language: Language;
  confettiStyle: ConfettiStyle;
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
  allowOverlap?: boolean;
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
  title?: string | null;
  format?: 'markdown' | 'plaintext';
  createdAt?: string;
  updatedAt?: string;
}

export interface TasksGroup {
  today: Task[];
  scheduled: Task[];
  someday: Task[];
  overdue?: Task[];
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
  timeBlocks: TimeBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface SaveDailyNoteRequest {
  rawContent: string;
  date: string;
  analysis: AnalysisResponse;
}

// Planning Mode types
export interface PlanningEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string | null;
}

export interface PlanningTask extends Task {
  id: number;
  hasConflict?: boolean;
  conflictingEvent?: PlanningEvent | null;
}

export interface PlanningTasksResponse {
  tasks: PlanningTask[];
  conflictingTasks: PlanningTask[];
  events: PlanningEvent[];
}

export interface PlanningTaskData {
  estimatedMinutes?: number | null;
  fixedTime?: string | null;
  canCombineWithEvents?: number[] | null;
  needsFullFocus?: boolean;
}

export interface ScheduleSuggestion {
  taskId: number;
  suggestedTime: string | null;
  duration: number;
  combinedWithEventId: number | null;
  reasoning: string;
  taskTitle?: string;
}

export interface GeneratedSchedule {
  schedule: ScheduleSuggestion[];
  warnings: string[];
}

export interface PlanningStats {
  totalTasks: number;
  planned: number;
  skipped: number;
  totalMinutes: number;
}

// Rebuild types
export interface RebuildParsedItems {
  newTasks: { title: string }[];
  journalEntries: number;
  notes: number;
}

export interface RebuildResponse {
  schedule: ScheduleSuggestion[];
  warnings: string[];
  parsedItems: RebuildParsedItems;
}

export interface RebuildRequest {
  keepTaskIds: number[];
  keepEventIds: number[];
  additionalInput: string | null;
  workUntilTime: string;
}

// Task Split types
export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

export interface SplitPart {
  startTime: string;
  duration: number;
  date: string;
}

export interface SplitProposal {
  canSplit: boolean;
  reason?: string;
  parts: SplitPart[];
  overflowToNextDay?: boolean;
  suggestedSlot?: TimeSlot;
}

export interface AvailableSlotsResponse {
  date: string;
  slots: TimeSlot[];
  totalAvailable: number;
}

export interface SplitProposalResponse {
  taskId: number;
  taskTitle: string;
  estimatedMinutes: number | null;
  date: string;
  proposal: SplitProposal;
}

export interface SplitTaskResponse {
  parentTask: Task;
  subtasks: Task[];
}
