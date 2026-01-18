import { useTranslation } from 'react-i18next';
import { Clock, Calendar, Scissors, ChevronRight, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlanningTask, TimeSlot, SplitProposal } from '@/types';

interface TaskSplitStepProps {
  task: PlanningTask;
  availableSlots: TimeSlot[];
  totalAvailable: number;
  proposal: SplitProposal | null;
  onSplit: () => void;
  onMoveToTomorrow: () => void;
  onSkip: () => void;
}

export function TaskSplitStep({
  task,
  availableSlots,
  totalAvailable,
  proposal,
  onSplit,
  onMoveToTomorrow,
  onSkip,
}: TaskSplitStepProps) {
  const { t } = useTranslation();

  const taskMinutes = task.estimatedMinutes || 0;
  const taskHours = Math.floor(taskMinutes / 60);
  const taskMins = taskMinutes % 60;
  const availableHours = Math.floor(totalAvailable / 60);
  const availableMins = totalAvailable % 60;

  const formatDuration = (hours: number, mins: number) => {
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}min`;
  };

  const canSplit = proposal?.canSplit ?? false;
  const overflowToNextDay = proposal?.overflowToNextDay ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 text-amber-500">
        <Clock className="w-6 h-6" />
        <span className="text-lg font-medium">{t('planning.split.title')}</span>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="font-medium text-lg">{task.title}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{t('planning.split.duration', { duration: formatDuration(taskHours, taskMins) })}</span>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {t('planning.split.availableTime', { time: formatDuration(availableHours, availableMins) })}
      </div>

      {availableSlots.length > 0 && (
        <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 space-y-2">
          <div className="text-sm font-medium text-secondary mb-2">
            {t('planning.split.freeSlots')}
          </div>
          <div className="space-y-1">
            {availableSlots.slice(0, 4).map((slot, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {slot.startTime} - {slot.endTime}
                </span>
                <span className="font-medium">{slot.duration}min</span>
              </div>
            ))}
            {availableSlots.length > 4 && (
              <div className="text-xs text-muted-foreground">
                {t('planning.split.moreSlots', { count: availableSlots.length - 4 })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        {t('planning.split.question')}
      </div>

      <div className="flex flex-col gap-3">
        {canSplit && (
          <Button onClick={onSplit} variant="default" className="w-full py-6">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{t('planning.split.splitIntoParts')}</div>
                  <div className="text-xs text-primary-foreground/70">
                    {overflowToNextDay
                      ? t('planning.split.splitAcrossDays')
                      : t('planning.split.splitToday', { parts: proposal?.parts.length || 0 })}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 opacity-50" />
            </div>
          </Button>
        )}

        <Button onClick={onMoveToTomorrow} variant="outline" className="w-full py-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">{t('planning.split.moveToTomorrow')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('planning.split.moveToTomorrowDesc')}
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </div>
        </Button>

        <Button onClick={onSkip} variant="ghost" className="w-full py-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Hand className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">{t('planning.split.handleManually')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('planning.split.handleManuallyDesc')}
                </div>
              </div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );
}
