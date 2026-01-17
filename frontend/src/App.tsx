import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  fetchDailyNote,
  setCurrentDate,
  createTask,
  toggleTaskComplete,
  deleteTask,
  updateTask,
  updateTaskDueDate,
  updateTaskFixedTime,
  updateEvent,
  deleteEvent,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  createNote,
  updateNote,
  deleteNote,
} from './store/dailyNoteSlice';
import { checkAuth } from './store/authSlice';
import { fetchSettings } from './store/settingsSlice';
import { Header } from './components/layout/Header';
import { DaySwitcher } from './components/layout/DaySwitcher';
import { BrainDumpInput } from './components/brain-dump/BrainDumpInput';
import { AnalysisResults } from './components/analysis/AnalysisResults';
import { DaySchedule } from './components/schedule/DaySchedule';
import { ScrollArea } from './components/ui/scroll-area';
import { LoginPage } from './components/auth/LoginPage';
import { HowAreYouModal } from './components/how-are-you';
import { useAutoModal } from './hooks/useAutoModal';
import { useReminders } from './hooks/useReminders';
import { Loader2 } from 'lucide-react';
import type { AnalysisResponse, DailyNoteData, TaskCategory } from './types';

function App() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const {
    currentDate,
    dailyNote,
    analysisPreview,
    isLoading,
    error,
  } = useAppSelector((state) => state.dailyNote);
  const { isAuthenticated, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );

  useAutoModal();
  useReminders();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchDailyNote(currentDate));
    }
  }, [currentDate, dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchSettings());
    }
  }, [isAuthenticated, dispatch]);

  // Merge persisted data with preview data when both exist
  // Must be before conditional returns to follow Rules of Hooks
  const { displayData, scheduleEvents, scheduledTasks } = useMemo((): {
    displayData: AnalysisResponse | DailyNoteData | null;
    scheduleEvents: DailyNoteData['schedule'];
    scheduledTasks: DailyNoteData['tasks']['today'];
  } => {
    if (!analysisPreview) {
      const allTasks = dailyNote ? [
        ...dailyNote.tasks.today,
        ...dailyNote.tasks.scheduled,
        ...dailyNote.tasks.someday,
      ] : [];
      return {
        displayData: dailyNote,
        scheduleEvents: dailyNote?.schedule || [],
        scheduledTasks: allTasks.filter((t) => t.fixedTime),
      };
    }

    if (!dailyNote) {
      return {
        displayData: analysisPreview,
        scheduleEvents: analysisPreview.schedule || [],
        scheduledTasks: [],
      };
    }

    // Merge: persisted data + preview data (preview items don't have IDs)
    const merged = {
      ...dailyNote,
      tasks: {
        today: [
          ...dailyNote.tasks.today,
          ...analysisPreview.tasks.today.map((t) => ({
            ...t,
            isCompleted: false,
            dueDate: null,
          })),
        ],
        scheduled: [
          ...dailyNote.tasks.scheduled,
          ...analysisPreview.tasks.scheduled.map((t) => ({
            ...t,
            isCompleted: false,
            dueDate: t.dueDate || null,
          })),
        ],
        someday: [
          ...dailyNote.tasks.someday,
          ...analysisPreview.tasks.someday.map((t) => ({
            ...t,
            isCompleted: false,
            dueDate: null,
          })),
        ],
      },
      notes: [...dailyNote.notes, ...analysisPreview.notes],
      journal: [...dailyNote.journal, ...analysisPreview.journal],
      events: [
        ...dailyNote.events,
        ...analysisPreview.events.map((e) => ({
          ...e,
          endTime: e.endTime || null,
        })),
      ],
      schedule: [...dailyNote.schedule, ...analysisPreview.schedule],
    };

    // Only include persisted tasks (with IDs) that have fixedTime
    const persistedTasks = [
      ...dailyNote.tasks.today,
      ...dailyNote.tasks.scheduled,
      ...dailyNote.tasks.someday,
    ];

    return {
      displayData: merged,
      scheduleEvents: merged.schedule,
      scheduledTasks: persistedTasks.filter((t) => t.fixedTime),
    };
  }, [dailyNote, analysisPreview]);

  const isPreview = !!analysisPreview;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleDateChange = (date: string) => {
    dispatch(setCurrentDate(date));
  };

  const handleToggleTask = (id: number, isCompleted: boolean) => {
    dispatch(toggleTaskComplete({ id, isCompleted }));
  };

  const handleDeleteTask = (id: number) => {
    dispatch(deleteTask(id));
  };

  const handleUpdateTask = (id: number, title: string) => {
    dispatch(updateTask({ id, title }));
  };

  const handleUpdateTaskDueDate = (id: number, dueDate: string | null) => {
    dispatch(updateTaskDueDate({ id, dueDate }));
  };

  const handleUpdateTaskFixedTime = (id: number, fixedTime: string | null) => {
    dispatch(updateTaskFixedTime({ id, fixedTime }));
  };

  const handleUpdateEvent = (
    id: number,
    data: { title?: string; startTime?: string; endTime?: string }
  ) => {
    dispatch(updateEvent({ id, data }));
  };

  const handleDeleteEvent = (id: number) => {
    dispatch(deleteEvent(id));
  };

  const handleUpdateNote = (id: number, content: string) => {
    dispatch(updateNote({ id, content }));
  };

  const handleDeleteNote = (id: number) => {
    dispatch(deleteNote(id));
  };

  const handleUpdateJournal = (id: number, content: string) => {
    dispatch(updateJournalEntry({ id, content }));
  };

  const handleDeleteJournal = (id: number) => {
    dispatch(deleteJournalEntry(id));
  };

  const handleAddTask = (title: string, dueDate: string | null, category: TaskCategory) => {
    dispatch(createTask({ title, date: currentDate, dueDate, category }));
  };

  const handleAddNote = (content: string) => {
    dispatch(createNote({ content, date: currentDate }));
  };

  const handleAddJournal = (content: string) => {
    dispatch(createJournalEntry({ content, date: currentDate }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 max-w-7xl">
        <DaySwitcher date={currentDate} onDateChange={handleDateChange} />

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 pb-8">
          {/* Left: Brain Dump */}
          <div className="col-span-12 lg:col-span-3 h-[750px]">
            <BrainDumpInput />
          </div>

          {/* Center: Analysis Results */}
          <div className="col-span-12 lg:col-span-5 h-[750px]">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">{t('common.loading')}</p>
                </div>
              ) : displayData ? (
                <AnalysisResults
                  data={displayData}
                  currentDate={currentDate}
                  isPreview={isPreview}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                  onUpdateTaskDueDate={handleUpdateTaskDueDate}
                  onUpdateTaskFixedTime={handleUpdateTaskFixedTime}
                  onAddTask={handleAddTask}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onAddNote={handleAddNote}
                  onUpdateJournal={handleUpdateJournal}
                  onDeleteJournal={handleDeleteJournal}
                  onAddJournal={handleAddJournal}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">
                      {t('app.noData')}
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      {t('app.startTyping')}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Right: Schedule */}
          <div className="col-span-12 lg:col-span-4 h-[750px]">
            <DaySchedule
              events={scheduleEvents}
              scheduledTasks={scheduledTasks}
              isPreview={isPreview}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              onToggleTask={handleToggleTask}
            />
          </div>
        </div>
      </main>

      <HowAreYouModal />
    </div>
  );
}

export default App;
