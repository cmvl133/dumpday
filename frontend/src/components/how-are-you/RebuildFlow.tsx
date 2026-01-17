import { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Pencil, Clock, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  backToSelection,
  closeModal,
  fetchRebuildData,
  setRebuildStep,
  toggleTaskSelection,
  toggleEventSelection,
  setAdditionalInput,
  setWorkUntilTime,
  generateRebuild,
  acceptRebuild,
} from '@/store/howAreYouSlice';
import { fetchDailyNote } from '@/store/dailyNoteSlice';
import type { RootState, AppDispatch } from '@/store';

const WORK_UNTIL_OPTIONS = [
  { label: '17:00', value: '17:00' },
  { label: '18:00', value: '18:00' },
  { label: '20:00', value: '20:00' },
  { label: '22:00', value: '22:00' },
];

export function RebuildFlow() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const {
    step,
    tasks,
    events,
    selectedTaskIds,
    selectedEventIds,
    additionalInput,
    workUntilTime,
    parsedItems,
    generatedSchedule,
    isLoading,
    isGenerating,
  } = useSelector((state: RootState) => state.howAreYou.rebuild);
  const error = useSelector((state: RootState) => state.howAreYou.error);
  const { currentDate } = useSelector((state: RootState) => state.dailyNote);

  const [customTime, setCustomTime] = useState('');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTimes, setEditedTimes] = useState<Record<number, string>>({});

  useEffect(() => {
    dispatch(fetchRebuildData());
  }, [dispatch]);

  useEffect(() => {
    if (generatedSchedule) {
      const initial: Record<number, string> = {};
      for (const item of generatedSchedule.schedule) {
        initial[item.taskId] = item.suggestedTime || '';
      }
      setEditedTimes(initial);
    }
  }, [generatedSchedule]);

  const handleBack = useCallback(() => {
    if (step === 'whats_happening') {
      dispatch(backToSelection());
    } else if (step === 'anything_else') {
      dispatch(setRebuildStep('whats_happening'));
    } else if (step === 'work_until') {
      dispatch(setRebuildStep('anything_else'));
    } else if (step === 'preview') {
      dispatch(setRebuildStep('work_until'));
    }
  }, [dispatch, step]);

  const handleContinue = useCallback(() => {
    if (step === 'whats_happening') {
      dispatch(setRebuildStep('anything_else'));
    } else if (step === 'anything_else') {
      dispatch(setRebuildStep('work_until'));
    } else if (step === 'work_until') {
      dispatch(generateRebuild());
    }
  }, [dispatch, step]);

  const handleAccept = useCallback(async () => {
    if (isEditing) {
      const modifiedSchedule = generatedSchedule?.schedule.map((item) => ({
        ...item,
        suggestedTime: editedTimes[item.taskId] || null,
      }));
      await dispatch(acceptRebuild(modifiedSchedule));
    } else {
      await dispatch(acceptRebuild(undefined));
    }
    dispatch(fetchDailyNote(currentDate));
    dispatch(closeModal());
  }, [dispatch, currentDate, isEditing, editedTimes, generatedSchedule]);

  const handleTimeChange = (taskId: number, time: string) => {
    setEditedTimes((prev) => ({ ...prev, [taskId]: time }));
  };

  const handleSelectWorkTime = (time: string) => {
    dispatch(setWorkUntilTime(time));
    setShowCustomTime(false);
  };

  const handleCustomTimeSubmit = () => {
    if (customTime) {
      dispatch(setWorkUntilTime(customTime));
      setShowCustomTime(false);
    }
  };

  const getTaskTitle = (item: { taskId: number; taskTitle?: string }) => {
    if (item.taskTitle) return item.taskTitle;
    const task = tasks.find((t) => t.id === item.taskId);
    return task?.title || `Task #${item.taskId}`;
  };

  const formatTime = (time: string | null) => {
    if (!time) return t('planning.summary.flexible');
    return time.slice(0, 5);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-destructive">{error}</div>;
  }

  // Step 1: What's still happening
  if (step === 'whats_happening') {
    return (
      <div className="space-y-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('howAreYou.back')}
        </button>

        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{t('howAreYou.rebuild.whatsHappening')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('howAreYou.rebuild.whatsHappeningDesc')}
          </p>
        </div>

        {tasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('howAreYou.rebuild.tasks')}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.map((task) => (
                <label
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedTaskIds.includes(task.id!)}
                    onCheckedChange={() => dispatch(toggleTaskSelection(task.id!))}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{task.title}</div>
                    {task.fixedTime && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.fixedTime}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">{t('howAreYou.rebuild.events')}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {events.map((event) => (
                <label
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    checked={selectedEventIds.includes(event.id)}
                    onCheckedChange={() => dispatch(toggleEventSelection(event.id))}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-secondary" />
                      {event.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.startTime}{event.endTime && ` - ${event.endTime}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleContinue} className="w-full">
          {t('common.continue')}
        </Button>
      </div>
    );
  }

  // Step 2: Anything else going on
  if (step === 'anything_else') {
    return (
      <div className="space-y-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('howAreYou.back')}
        </button>

        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{t('howAreYou.rebuild.anythingElse')}</h2>
        </div>

        <Textarea
          value={additionalInput}
          onChange={(e) => dispatch(setAdditionalInput(e.target.value))}
          placeholder={t('howAreYou.rebuild.anythingElsePlaceholder')}
          className="min-h-[120px]"
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleContinue} className="flex-1">
            {t('common.skip')}
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            {t('common.continue')}
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Work until time
  if (step === 'work_until') {
    return (
      <div className="space-y-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('howAreYou.back')}
        </button>

        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{t('howAreYou.rebuild.workUntil')}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {WORK_UNTIL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelectWorkTime(option.value)}
              className={`py-4 px-6 rounded-lg border text-lg font-medium transition-colors ${
                workUntilTime === option.value && !showCustomTime
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent hover:border-primary'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowCustomTime(true)}
          className={`w-full py-3 rounded-lg border text-sm font-medium transition-colors ${
            showCustomTime
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card hover:bg-accent hover:border-primary'
          }`}
        >
          {t('howAreYou.rebuild.customTime')}
        </button>

        {showCustomTime && (
          <div className="flex gap-2">
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border bg-background"
              autoFocus
            />
            <Button onClick={handleCustomTimeSubmit} disabled={!customTime}>
              {t('common.confirm')}
            </Button>
          </div>
        )}

        <Button onClick={handleContinue} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
              {t('howAreYou.rebuild.generating')}
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              {t('howAreYou.rebuild.rebuild')}
            </>
          )}
        </Button>
      </div>
    );
  }

  // Step 4: Preview
  if (step === 'preview' && generatedSchedule) {
    const sortedSchedule = [...generatedSchedule.schedule].sort((a, b) => {
      const timeA = isEditing ? editedTimes[a.taskId] : a.suggestedTime;
      const timeB = isEditing ? editedTimes[b.taskId] : b.suggestedTime;
      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;
      return timeA.localeCompare(timeB);
    });

    return (
      <div className="space-y-6 py-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('howAreYou.back')}
        </button>

        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">{t('howAreYou.rebuild.newPlan')}</h2>
          {parsedItems && (parsedItems.journalEntries > 0 || parsedItems.notes > 0) && (
            <p className="text-sm text-muted-foreground">
              {t('howAreYou.rebuild.alsoAdded', {
                journal: parsedItems.journalEntries,
                notes: parsedItems.notes,
              })}
            </p>
          )}
        </div>

        {generatedSchedule.warnings.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
            <p className="text-sm font-medium text-destructive mb-2">
              {t('planning.summary.warnings')}
            </p>
            <ul className="text-xs text-destructive/80 space-y-1">
              {generatedSchedule.warnings.map((warning, index) => (
                <li key={index}>- {warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedSchedule.map((item) => (
            <div
              key={item.taskId}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border"
            >
              {isEditing ? (
                <input
                  type="time"
                  value={editedTimes[item.taskId] || ''}
                  onChange={(e) => handleTimeChange(item.taskId, e.target.value)}
                  className="w-20 px-2 py-1 text-sm border rounded bg-background"
                />
              ) : (
                <div className="text-sm font-medium text-primary w-14 shrink-0">
                  {formatTime(item.suggestedTime)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{getTaskTitle(item)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDuration(item.duration)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAccept} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {t('planning.summary.accept')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                <Pencil className="h-4 w-4 mr-2" />
                {t('planning.summary.adjust')}
              </Button>
              <Button onClick={handleAccept} className="flex-1">
                {t('planning.summary.accept')}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
