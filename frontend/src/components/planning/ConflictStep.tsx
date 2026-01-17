import { useTranslation } from 'react-i18next';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PlanningTask } from '@/types';

interface ConflictStepProps {
  task: PlanningTask;
  onKeep: () => void;
  onReschedule: () => void;
}

export function ConflictStep({ task, onKeep, onReschedule }: ConflictStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 text-amber-500">
        <AlertTriangle className="w-6 h-6" />
        <span className="text-lg font-medium">{t('planning.conflict.title')}</span>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="font-medium text-lg">{task.title}</div>

        {task.fixedTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{t('planning.conflict.scheduledFor', { time: task.fixedTime })}</span>
          </div>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {t('planning.conflict.conflictsWith')}
      </div>

      {task.conflictingEvent && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium text-destructive">
            <Calendar className="w-4 h-4" />
            <span>{task.conflictingEvent.title}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {task.conflictingEvent.startTime}
            {task.conflictingEvent.endTime && ` - ${task.conflictingEvent.endTime}`}
          </div>
        </div>
      )}

      <div className="text-center text-sm text-muted-foreground">
        {t('planning.conflict.question')}
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={onKeep} variant="outline" className="w-full py-6">
          <div className="flex flex-col items-center">
            <span className="font-medium">{t('planning.conflict.keep')}</span>
            <span className="text-xs text-muted-foreground">{t('planning.conflict.keepDesc')}</span>
          </div>
        </Button>

        <Button onClick={onReschedule} variant="default" className="w-full py-6">
          <div className="flex flex-col items-center">
            <span className="font-medium">{t('planning.conflict.reschedule')}</span>
            <span className="text-xs text-muted-foreground">{t('planning.conflict.rescheduleDesc')}</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
