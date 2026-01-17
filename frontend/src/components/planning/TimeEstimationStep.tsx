import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface TimeEstimationStepProps {
  onSelect: (minutes: number) => void;
  onSkip: () => void;
}

const TIME_OPTIONS = [
  { label: '15min', minutes: 15 },
  { label: '30min', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '3h', minutes: 180 },
];

export function TimeEstimationStep({ onSelect, onSkip }: TimeEstimationStepProps) {
  const { t } = useTranslation();
  const [exitAnimation, setExitAnimation] = useState<'next' | 'skip' | null>(null);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (minutes: number) => {
    setExitAnimation('next');
    setTimeout(() => {
      onSelect(minutes);
    }, 300);
  };

  const handleSkip = () => {
    setExitAnimation('skip');
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  const handleCustomSubmit = () => {
    const minutes = parseInt(customMinutes, 10);
    if (minutes > 0) {
      handleSelect(minutes);
    }
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        exitAnimation === 'next' && 'translate-x-[100%] opacity-0',
        exitAnimation === 'skip' && '-translate-x-[100%] opacity-0'
      )}
    >
      <p className="text-center text-muted-foreground mb-4">
        {t('planning.estimation.question')}
      </p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {TIME_OPTIONS.map((option) => (
          <button
            key={option.minutes}
            onClick={() => handleSelect(option.minutes)}
            className="py-3 px-4 rounded-lg bg-card border hover:bg-accent hover:border-primary transition-colors text-sm font-medium"
          >
            {t(`planning.estimation.${option.label}`)}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(true)}
          className={cn(
            'py-3 px-4 rounded-lg bg-card border hover:bg-accent hover:border-primary transition-colors text-sm font-medium',
            showCustom && 'border-primary bg-accent'
          )}
        >
          {t('planning.estimation.custom')}
        </button>
      </div>

      {showCustom && (
        <div className="flex gap-2 mb-4">
          <input
            type="number"
            min="1"
            max="480"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder={t('planning.estimation.customPlaceholder')}
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
            autoFocus
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {t('common.confirm')}
          </button>
        </div>
      )}

      <button
        onClick={handleSkip}
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t('planning.estimation.skip')}
      </button>
    </div>
  );
}
