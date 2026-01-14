import { useEffect } from 'react';
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

  const displayData = analysisPreview || dailyNote;
  const scheduleEvents = analysisPreview?.schedule || dailyNote?.schedule || [];
  const isPreview = !!analysisPreview;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4">
        <DaySwitcher date={currentDate} onDateChange={handleDateChange} />

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 pb-8">
          {/* Left: Brain Dump */}
          <div className="col-span-12 lg:col-span-3">
            <BrainDumpInput />
          </div>

          {/* Center: Analysis Results */}
          <div className="col-span-12 lg:col-span-5">
            <ScrollArea className="h-[calc(100vh-200px)]">
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
          <div className="col-span-12 lg:col-span-4">
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
