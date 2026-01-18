import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DateTimePopoverProps {
  dueDate?: string | null;
  fixedTime?: string | null;
  onUpdateDueDate?: (dueDate: string | null) => void;
  onUpdateFixedTime?: (fixedTime: string | null) => void;
  defaultDate?: string;
}

export function DateTimePopover({
  dueDate,
  fixedTime,
  onUpdateDueDate,
  onUpdateFixedTime,
  defaultDate,
}: DateTimePopoverProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localDate, setLocalDate] = useState(dueDate || defaultDate || '');
  const [localTime, setLocalTime] = useState(fixedTime || '');

  const hasValue = dueDate || fixedTime;

  const handleOpen = (open: boolean) => {
    if (open) {
      setLocalDate(dueDate || defaultDate || '');
      setLocalTime(fixedTime || '');
    }
    setIsOpen(open);
  };

  const handleSave = () => {
    if (onUpdateDueDate && localDate !== dueDate) {
      onUpdateDueDate(localDate || null);
    }
    if (onUpdateFixedTime && localTime !== fixedTime) {
      onUpdateFixedTime(localTime || null);
    }
    setIsOpen(false);
  };

  const handleClearDate = () => {
    setLocalDate('');
    if (onUpdateDueDate) {
      onUpdateDueDate(null);
    }
  };

  const handleClearTime = () => {
    setLocalTime('');
    if (onUpdateFixedTime) {
      onUpdateFixedTime(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={t('tasks.setReminder')}
        >
          <Calendar
            className={cn(
              'h-3.5 w-3.5',
              hasValue ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          {/* Date input */}
          {onUpdateDueDate && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">{t('dates.today')}</span>
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={localDate}
                  onChange={(e) => setLocalDate(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                {localDate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleClearDate}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Time input */}
          {onUpdateFixedTime && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">{t('events.startTime')}</span>
              <div className="flex gap-1">
                <Input
                  type="time"
                  value={localTime}
                  onChange={(e) => setLocalTime(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                {localTime && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleClearTime}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Save button */}
          <Button
            size="sm"
            className="w-full h-8"
            onClick={handleSave}
          >
            {t('common.save')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
