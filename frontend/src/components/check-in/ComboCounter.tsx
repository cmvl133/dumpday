import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { getRandomComboMessage } from '@/lib/toneMessages';
import type { RootState } from '@/store';

interface ComboCounterProps {
  combo: number;
  zenMode?: boolean;
}

export function ComboCounter({ combo, zenMode = false }: ComboCounterProps) {
  const { reminderTone } = useSelector((state: RootState) => state.settings);

  const comment = useMemo(() => {
    if (combo < 3) return null;
    return getRandomComboMessage(reminderTone);
  }, [combo, reminderTone]);

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
