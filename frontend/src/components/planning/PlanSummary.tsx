import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GeneratedSchedule, PlanningTask, PlanningStats, ScheduleSuggestion } from '@/types';

interface PlanSummaryProps {
  schedule: GeneratedSchedule;
  tasks: PlanningTask[];
  stats: PlanningStats;
  onAccept: (modifiedSchedule?: ScheduleSuggestion[]) => void;
}

export function PlanSummary({
  schedule,
  tasks,
  stats,
  onAccept,
}: PlanSummaryProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTimes, setEditedTimes] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    for (const item of schedule.schedule) {
      initial[item.taskId] = item.suggestedTime || '';
    }
    return initial;
  });

  const getTaskTitle = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    return task?.title || `Task #${taskId}`;
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

  const handleTimeChange = (taskId: number, time: string) => {
    setEditedTimes((prev) => ({ ...prev, [taskId]: time }));
  };

  const handleAccept = () => {
    if (isEditing) {
      // Create modified schedule with updated times
      const modifiedSchedule = schedule.schedule.map((item) => ({
        ...item,
        suggestedTime: editedTimes[item.taskId] || null,
      }));
      onAccept(modifiedSchedule);
    } else {
      onAccept();
    }
  };

  const sortedSchedule = [...schedule.schedule].sort((a, b) => {
    const timeA = isEditing ? editedTimes[a.taskId] : a.suggestedTime;
    const timeB = isEditing ? editedTimes[b.taskId] : b.suggestedTime;
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">{t('planning.summary.title')}</h2>
        <p className="text-muted-foreground text-sm">
          {isEditing ? t('planning.summary.editSubtitle') : t('planning.summary.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-primary">{stats.planned}</div>
          <div className="text-muted-foreground text-xs">{t('planning.planned')}</div>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <div className="text-xl font-bold">{stats.skipped}</div>
          <div className="text-muted-foreground text-xs">{t('planning.skipped')}</div>
        </div>
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-secondary">
            {formatDuration(stats.totalMinutes)}
          </div>
          <div className="text-muted-foreground text-xs">{t('planning.totalTime')}</div>
        </div>
      </div>

      {schedule.warnings.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          <p className="text-sm font-medium text-destructive mb-2">
            {t('planning.summary.warnings')}
          </p>
          <ul className="text-xs text-destructive/80 space-y-1">
            {schedule.warnings.map((warning, index) => (
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
              <div className="font-medium truncate">{getTaskTitle(item.taskId)}</div>
              <div className="text-xs text-muted-foreground">
                {formatDuration(item.duration)}
                {item.combinedWithEventId && (
                  <span className="ml-2 text-secondary">
                    {t('planning.summary.combined')}
                  </span>
                )}
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
