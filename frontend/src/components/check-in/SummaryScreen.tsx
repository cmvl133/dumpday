import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { CheckInStats } from '@/types';

interface SummaryScreenProps {
  stats: CheckInStats;
  totalTasks: number;
  onRebuild?: (newContent: string) => void;
  onClose: () => void;
}

export function SummaryScreen({
  stats,
  totalTasks,
  onRebuild,
  onClose,
}: SummaryScreenProps) {
  const [newContent, setNewContent] = useState('');

  const donePercent = totalTasks > 0 ? (stats.done / totalTasks) * 100 : 0;
  const shouldCelebrate =
    stats.done === totalTasks || stats.bestCombo >= 5 || donePercent >= 80;

  useEffect(() => {
    if (shouldCelebrate) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#14b8a6', '#22c55e', '#eab308'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#14b8a6', '#22c55e', '#eab308'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [shouldCelebrate]);

  const getMessage = () => {
    if (stats.done === totalTasks && totalTasks > 0) {
      return 'Wszystko ogarnięte! 🎉';
    }
    if (donePercent >= 80) {
      return 'Świetna robota! 💪';
    }
    if (stats.bestCombo >= 5) {
      return `Niesamowite combo x${stats.bestCombo}! 🔥`;
    }
    if (stats.done > 0) {
      return 'Dobra robota!';
    }
    return 'Check-in zakończony';
  };

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-6">
      <h2 className="text-2xl font-bold">{getMessage()}</h2>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.done}
          </div>
          <div className="text-muted-foreground">Zrobione</div>
        </div>

        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.today}
          </div>
          <div className="text-muted-foreground">Na dzis</div>
        </div>

        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.tomorrow}
          </div>
          <div className="text-muted-foreground">Na jutro</div>
        </div>
      </div>

      {stats.bestCombo > 0 && (
        <div className="text-lg">
          Najlepsze combo: <span className="font-bold">x{stats.bestCombo}</span>{' '}
          🔥
        </div>
      )}

      {onRebuild && (
        <div className="space-y-3 pt-4 border-t">
          <label className="text-sm font-medium text-left block">
            Co nowego na dzis?
          </label>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Wpisz nowe zadania, wydarzenia..."
            className="min-h-[100px]"
          />
          {newContent.trim() && (
            <Button onClick={() => onRebuild(newContent)} className="w-full">
              Przebuduj reszte dnia
            </Button>
          )}
        </div>
      )}

      <Button variant="outline" onClick={onClose} className="w-full">
        Zamknij
      </Button>
    </div>
  );
}
