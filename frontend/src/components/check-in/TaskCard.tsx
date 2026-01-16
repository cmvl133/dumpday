import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import type { CheckInTask } from '@/types';
import type { RootState } from '@/store';

type ExitAnimation = 'done' | 'postpone' | null;

interface TaskCardProps {
  task: CheckInTask;
  isOverdue: boolean;
  onAction: (action: 'done' | 'tomorrow' | 'today') => void;
}

export function TaskCard({ task, isOverdue, onAction }: TaskCardProps) {
  const { t } = useTranslation();
  const { language } = useSelector((state: RootState) => state.settings);
  const [exitAnimation, setExitAnimation] = useState<ExitAnimation>(null);
  const [showFlash, setShowFlash] = useState(false);

  const handleAction = (action: 'done' | 'tomorrow' | 'today') => {
    if (action === 'done') {
      setShowFlash(true);
      setExitAnimation('done');
    } else {
      setExitAnimation('postpone');
    }

    setTimeout(() => {
      onAction(action);
    }, 300);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(
      language === 'pl' ? 'pl-PL' : 'en-US',
      { day: 'numeric', month: 'short' }
    );
  };

  return (
    <div
      className={cn(
        'relative w-full max-w-md mx-auto transition-all duration-300 ease-out',
        exitAnimation === 'done' &&
          'translate-x-[100%] -translate-y-[50%] rotate-[15deg] opacity-0',
        exitAnimation === 'postpone' && '-translate-x-[100%] opacity-0',
        showFlash && 'animate-flash-green'
      )}
    >
      <div className="bg-card border rounded-xl p-6 shadow-lg">
        {isOverdue && task.dueDate && (
          <div className="text-xs text-destructive font-medium mb-2">
            {t('checkIn.overdue')} - {formatDate(task.dueDate)}
          </div>
        )}

        <h2 className="text-xl font-medium text-center mb-6">{task.title}</h2>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => handleAction('today')}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground text-sm font-medium transition-colors"
          >
            {t('checkIn.keepToday')}
          </button>

          <button
            onClick={() => handleAction('tomorrow')}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
          >
            {t('checkIn.tomorrow')}
          </button>

          <button
            onClick={() => handleAction('done')}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
          >
            {t('checkIn.done')}
          </button>
        </div>
      </div>
    </div>
  );
}
