import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DaySwitcherProps {
  date: string;
  onDateChange: (date: string) => void;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Dzisiaj';
  } else if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Jutro';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Wczoraj';
  }

  return date.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export function DaySwitcher({ date, onDateChange }: DaySwitcherProps) {
  const goToPrevDay = () => {
    const prev = new Date(date + 'T00:00:00');
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const next = new Date(date + 'T00:00:00');
    next.setDate(next.getDate() + 1);
    onDateChange(next.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const isToday =
    date === new Date().toISOString().split('T')[0];

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <Button variant="outline" size="icon" onClick={goToPrevDay}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="text-center min-w-[250px]">
        <div className="text-lg font-semibold capitalize">
          {formatDate(date)}
        </div>
        <div className="text-sm text-muted-foreground">{date}</div>
      </div>

      <Button variant="outline" size="icon" onClick={goToNextDay}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button variant="ghost" size="sm" onClick={goToToday}>
          Dzisiaj
        </Button>
      )}
    </div>
  );
}
