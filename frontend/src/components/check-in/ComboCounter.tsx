import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const COMBO_COMMENTS = [
  'Ogarniasz!',
  'Nieźle leci!',
  'Maszyna!',
  'Kto Cię dziś zatrzyma?',
  'Focus mode: ON',
  'Rozpierdalasz tę listę!',
  'ADHD? Jaki ADHD?',
  'Jeszcze trochę!',
  'Nie do zatrzymania!',
  'Produktywność 100%',
];

interface ComboCounterProps {
  combo: number;
  zenMode?: boolean;
}

export function ComboCounter({ combo, zenMode = false }: ComboCounterProps) {
  const comment = useMemo(() => {
    if (combo < 3) return null;
    return COMBO_COMMENTS[Math.floor(Math.random() * COMBO_COMMENTS.length)];
  }, [combo]);

  if (combo === 0 || zenMode) return null;

  const getFireEmojis = () => {
    if (combo >= 7) return '🔥🔥🔥🔥';
    if (combo >= 5) return '🔥🔥🔥';
    if (combo >= 3) return '🔥🔥';
    return '🔥';
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 animate-bounce-in',
        combo >= 5 && 'animate-shake'
      )}
    >
      <div
        className={cn(
          'text-2xl transition-all',
          combo >= 5 && 'text-3xl',
          combo >= 7 && 'text-4xl'
        )}
      >
        {getFireEmojis()}
      </div>
      <div className="text-lg font-bold text-primary">x{combo}</div>
      {comment && (
        <div className="text-sm text-muted-foreground italic">{comment}</div>
      )}
    </div>
  );
}
