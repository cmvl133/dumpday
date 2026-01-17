import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface FixedTimeStepProps {
  onSelect: (time: string | null) => void;
  onBack: () => void;
}

export function FixedTimeStep({ onSelect, onBack }: FixedTimeStepProps) {
  const { t } = useTranslation();
  const [exitAnimation, setExitAnimation] = useState<'next' | 'back' | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');

  const handleFlexible = () => {
    setExitAnimation('next');
    setTimeout(() => {
      onSelect(null);
    }, 300);
  };

  const handleTimeSubmit = () => {
    setExitAnimation('next');
    setTimeout(() => {
      onSelect(selectedTime);
    }, 300);
  };

  const handleBack = () => {
    setExitAnimation('back');
    setTimeout(() => {
      onBack();
    }, 300);
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
        {t('planning.fixedTime.question')}
      </p>

      {!showTimePicker ? (
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowTimePicker(true)}
            className="py-3 px-6 rounded-lg bg-card border hover:bg-accent hover:border-primary transition-colors font-medium"
          >
            {t('planning.fixedTime.yes')}
          </button>
          <button
            onClick={handleFlexible}
            className="py-3 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            {t('planning.fixedTime.no')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="px-4 py-3 rounded-lg border bg-background text-lg font-medium text-center"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowTimePicker(false)}
              className="py-2 px-4 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-sm"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleTimeSubmit}
              className="py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleBack}
        className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('common.back')}
      </button>
    </div>
  );
}
