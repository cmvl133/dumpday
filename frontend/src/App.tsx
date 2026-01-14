import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  fetchDailyNote,
  setCurrentDate,
  toggleTaskComplete,
  deleteTask,
  updateTask,
  updateEvent,
  deleteEvent,
  updateJournalEntry,
  deleteJournalEntry,
  updateNote,
  deleteNote,
} from './store/dailyNoteSlice';
import { Header } from './components/layout/Header';
import { DaySwitcher } from './components/layout/DaySwitcher';
import { BrainDumpInput } from './components/brain-dump/BrainDumpInput';
import { AnalysisResults } from './components/analysis/AnalysisResults';
import { DaySchedule } from './components/schedule/DaySchedule';
import { ScrollArea } from './components/ui/scroll-area';
import type { AnalysisResponse, DailyNoteData } from './types';

function App() {
  const dispatch = useAppDispatch();
  const {
    currentDate,
    dailyNote,
    analysisPreview,
    isLoading,
    error,
  } = useAppSelector((state) => state.dailyNote);

  useEffect(() => {
    dispatch(fetchDailyNote(currentDate));
  }, [currentDate, dispatch]);

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

  // Merge persisted data with preview data when both exist
  const { displayData, scheduleEvents } = useMemo((): {
    displayData: AnalysisResponse | DailyNoteData | null;
    scheduleEvents: DailyNoteData['schedule'];
  } => {
    if (!analysisPreview) {
      return {
        displayData: dailyNote,
        scheduleEvents: dailyNote?.schedule || [],
      };
    }

    if (!dailyNote) {
      return {
        displayData: analysisPreview,
        scheduleEvents: analysisPreview.schedule || [],
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

    return {
      displayData: merged,
      scheduleEvents: merged.schedule,
    };
  }, [dailyNote, analysisPreview]);

  const isPreview = !!analysisPreview;

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
                  <p className="text-muted-foreground">Ładowanie...</p>
                </div>
              ) : displayData ? (
                <AnalysisResults
                  data={displayData}
                  isPreview={isPreview}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onUpdateTask={handleUpdateTask}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                  onUpdateJournal={handleUpdateJournal}
                  onDeleteJournal={handleDeleteJournal}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">
                      Brak danych dla tego dnia
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Zacznij pisać w sekcji Brain Dump...
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
              isPreview={isPreview}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
