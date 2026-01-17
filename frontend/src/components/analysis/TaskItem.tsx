import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Trash2, Pencil, Check, X, Calendar, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RootState } from '@/store';
import type { ConfettiStyle } from '@/types';

const getConfettiConfig = (style: ConfettiStyle, origin: { x: number; y: number }) => {
  const configs: Record<ConfettiStyle, Parameters<typeof confetti>[0]> = {
    classic: {
      particleCount: 50,
      spread: 60,
      origin,
      startVelocity: 20,
      gravity: 0.8,
      scalar: 0.8,
    },
    stars: {
      particleCount: 30,
      spread: 70,
      origin,
      shapes: ['star'],
      colors: ['#ffd700', '#ffec8b', '#fff8dc', '#fffacd', '#ffefd5'],
      startVelocity: 25,
      gravity: 0.6,
      scalar: 1.2,
    },
    explosion: {
      particleCount: 100,
      spread: 120,
      origin,
      startVelocity: 45,
      gravity: 1,
      scalar: 1,
      ticks: 100,
    },
    neon: {
      particleCount: 50,
      spread: 60,
      origin,
      colors: ['#ff2d7a', '#00ff88', '#00d4ff', '#ffee00'],
      startVelocity: 20,
      gravity: 0.8,
      scalar: 0.8,
    },
    fire: {
      particleCount: 60,
      spread: 55,
      origin,
      colors: ['#ff4500', '#ff6347', '#ff7f50', '#ffa500', '#ffd700'],
      startVelocity: 30,
      gravity: 0.9,
      scalar: 0.9,
    },
  };
  return configs[style];
};

interface TaskItemProps {
  id?: number;
  title: string;
  isCompleted?: boolean;
  dueDate?: string | null;
  fixedTime?: string | null;
  currentDate?: string;
  isTodaySection?: boolean;
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, title: string) => void;
  onUpdateDueDate?: (id: number, dueDate: string | null) => void;
  onUpdateFixedTime?: (id: number, fixedTime: string | null) => void;
  isPreview?: boolean;
}

export function TaskItem({
  id,
  title,
  isCompleted = false,
  dueDate,
  fixedTime,
  currentDate,
  isTodaySection = false,
  onToggle,
  onDelete,
  onUpdate,
  onUpdateDueDate,
  onUpdateFixedTime,
  isPreview = false,
}: TaskItemProps) {
  const confettiStyle = useSelector((state: RootState) => state.settings.confettiStyle);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState(fixedTime || '');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const checkboxWrapperRef = useRef<HTMLDivElement>(null);

  // For "today" section, show context date; for others show dueDate
  const displayDate = isTodaySection ? (dueDate || currentDate) : dueDate;
  // Date picker defaults to dueDate if set, otherwise context date
  const dateInputValue = dueDate || currentDate || '';

  const handleToggle = () => {
    if (id !== undefined && onToggle) {
      const willBeCompleted = !isCompleted;
      onToggle(id, willBeCompleted);

      // Confetti when completing a task!
      if (willBeCompleted && checkboxWrapperRef.current) {
        const rect = checkboxWrapperRef.current.getBoundingClientRect();
        const x = (rect.left + rect.width / 2) / window.innerWidth;
        const y = (rect.top + rect.height / 2) / window.innerHeight;

        confetti(getConfettiConfig(confettiStyle, { x, y }));
      }
    }
  };

  const handleDelete = () => {
    if (id !== undefined && onDelete) {
      onDelete(id);
    }
  };

  const handleEdit = () => {
    setEditValue(title);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (id !== undefined && onUpdate && editValue.trim() !== title) {
      onUpdate(id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleDateClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (id !== undefined && onUpdateDueDate) {
      const newDate = e.target.value || null;
      onUpdateDueDate(id, newDate);
    }
  };

  const handleTimeEdit = () => {
    setTimeValue(fixedTime || '');
    setIsEditingTime(true);
  };

  const handleTimeSave = () => {
    if (id !== undefined && onUpdateFixedTime) {
      onUpdateFixedTime(id, timeValue || null);
    }
    setIsEditingTime(false);
  };

  const handleTimeCancel = () => {
    setTimeValue(fixedTime || '');
    setIsEditingTime(false);
  };

  const handleTimeClear = () => {
    if (id !== undefined && onUpdateFixedTime) {
      onUpdateFixedTime(id, null);
    }
    setTimeValue('');
    setIsEditingTime(false);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTimeSave();
    } else if (e.key === 'Escape') {
      handleTimeCancel();
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 group relative">
      {!isPreview && id !== undefined ? (
        <div ref={checkboxWrapperRef}>
          <Checkbox checked={isCompleted} onCheckedChange={handleToggle} />
        </div>
      ) : (
        <div className="w-4 h-4 rounded-sm border border-muted-foreground/30" />
      )}

      {isEditing ? (
        <>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 h-8"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </>
      ) : (
        <>
          <span
            className={cn(
              'flex-1 text-sm',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {title}
          </span>

          {(displayDate || fixedTime) && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {displayDate && new Date(displayDate + 'T00:00:00').toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'short',
              })}
              {displayDate && fixedTime && ' '}
              {fixedTime}
            </Badge>
          )}

          {!isPreview && id !== undefined && isEditingTime && onUpdateFixedTime && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-card/95 backdrop-blur-sm rounded-md px-2 py-1 border border-primary/30 shadow-lg shadow-primary/10">
              <input
                type="time"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                onKeyDown={handleTimeKeyDown}
                className="h-7 w-24 px-2 text-sm"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleTimeSave}
              >
                <Check className="h-4 w-4 text-[#00ff88]" />
              </Button>
              {fixedTime && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleTimeClear}
                  title="Usuń godzinę"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleTimeCancel}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          {!isPreview && id !== undefined && !isEditingTime && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded">
              {onUpdateFixedTime && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleTimeEdit}
                  title={fixedTime ? `Godzina: ${fixedTime}` : 'Ustaw godzinę'}
                >
                  <Clock className={cn(
                    "h-3.5 w-3.5",
                    fixedTime ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )} />
                </Button>
              )}
              {onUpdateDueDate && (
                <>
                  <input
                    type="date"
                    ref={dateInputRef}
                    value={dateInputValue}
                    onChange={handleDateChange}
                    className="sr-only"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleDateClick}
                  >
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </Button>
                </>
              )}
              {onUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleEdit}
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
