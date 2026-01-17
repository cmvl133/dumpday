import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

interface DaySwitcherProps {
  date: string;
  onDateChange: (date: string) => void;
}

// Format date as YYYY-MM-DD in local timezone
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DaySwitcher({ date, onDateChange }: DaySwitcherProps) {
  const { t } = useTranslation();
  const language = useSelector((state: RootState) => state.settings.language);

  const formatDate = (dateStr: string): string => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(dateObj);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return t('dates.today');
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return t('dates.tomorrow');
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return t('dates.yesterday');
    }

    const locale = language === 'pl' ? 'pl-PL' : 'en-US';
    return dateObj.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const goToPrevDay = () => {
    const prev = new Date(date + 'T12:00:00');
    prev.setDate(prev.getDate() - 1);
    onDateChange(toLocalDateString(prev));
  };

  const goToNextDay = () => {
    const next = new Date(date + 'T12:00:00');
    next.setDate(next.getDate() + 1);
    onDateChange(toLocalDateString(next));
  };

  const goToToday = () => {
    onDateChange(toLocalDateString(new Date()));
  };

  const isToday = date === toLocalDateString(new Date());

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
          {t('dates.today')}
        </Button>
      )}
    </div>
  );
}
