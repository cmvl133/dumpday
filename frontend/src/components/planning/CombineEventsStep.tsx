import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import type { PlanningEvent } from '@/types';

interface CombineEventsStepProps {
  events: PlanningEvent[];
  onSelect: (eventIds: number[]) => void;
  onNeedsFullFocus: () => void;
  onBack: () => void;
}

export function CombineEventsStep({
  events,
  onSelect,
  onNeedsFullFocus,
  onBack,
}: CombineEventsStepProps) {
  const { t } = useTranslation();
  const [exitAnimation, setExitAnimation] = useState<'next' | 'back' | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([]);

  const toggleEvent = (eventId: number) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleContinue = () => {
    setExitAnimation('next');
    setTimeout(() => {
      onSelect(selectedEventIds);
    }, 300);
  };

  const handleFullFocus = () => {
    setExitAnimation('next');
    setTimeout(() => {
      onNeedsFullFocus();
    }, 300);
  };

  const handleBack = () => {
    setExitAnimation('back');
    setTimeout(() => {
      onBack();
    }, 300);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        exitAnimation === 'next' && 'translate-x-[100%] opacity-0',
        exitAnimation === 'back' && '-translate-x-[100%] opacity-0'
      )}
    >
      <p className="text-center text-muted-foreground mb-4">
        {t('planning.combine.question')}
      </p>

      {events.length > 0 ? (
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {events.map((event) => (
            <label
              key={event.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                selectedEventIds.includes(event.id)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-accent'
              )}
            >
              <Checkbox
                checked={selectedEventIds.includes(event.id)}
                onCheckedChange={() => toggleEvent(event.id)}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(event.startTime)}
                  {event.endTime && ` - ${formatTime(event.endTime)}`}
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground mb-4">
          {t('planning.combine.noEvents')}
        </p>
      )}

      <div className="space-y-2">
        {events.length > 0 && selectedEventIds.length > 0 && (
          <button
            onClick={handleContinue}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {t('common.continue')}
          </button>
        )}

        <button
          onClick={handleFullFocus}
          className={cn(
            'w-full py-3 rounded-lg font-medium transition-colors',
            events.length === 0 || selectedEventIds.length === 0
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-card border hover:bg-accent'
          )}
        >
          {t('planning.combine.needsFocus')}
        </button>
      </div>

      <button
        onClick={handleBack}
        className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('common.back')}
      </button>
    </div>
  );
}
