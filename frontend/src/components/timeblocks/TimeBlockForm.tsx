import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TimeBlockTagSelector } from './TimeBlockTagSelector';
import { cn } from '@/lib/utils';
import type { TimeBlock, RecurrenceType } from '@/types';

interface TimeBlockFormProps {
  initialData?: TimeBlock;
  onSave: (data: TimeBlockFormData) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export interface TimeBlockFormData {
  name: string;
  color: string;
  startTime: string;
  endTime: string;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[] | null;
  tagIds: number[];
}

// Matches backend TimeBlockController.php ALLOWED_COLORS
const BLOCK_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#78716c',
];

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function TimeBlockForm({ initialData, onSave, onCancel, isSaving = false }: TimeBlockFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(BLOCK_COLORS[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]); // Weekdays (Mon-Fri)
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Initialize form with existing data (edit mode)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color);
      setStartTime(initialData.startTime);
      setEndTime(initialData.endTime);
      setRecurrenceType(initialData.recurrenceType);
      if (initialData.recurrenceDays) {
        setCustomDays(initialData.recurrenceDays);
      }
      setSelectedTagIds(initialData.tags.map((t) => t.id));
    }
  }, [initialData]);

  const toggleDay = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((d) => d !== day));
    } else {
      setCustomDays([...customDays, day].sort());
    }
  };

  const handleSave = () => {
    const data: TimeBlockFormData = {
      name: name.trim(),
      color,
      startTime,
      endTime,
      recurrenceType,
      recurrenceDays: recurrenceType === 'custom' ? customDays : null,
      tagIds: selectedTagIds,
    };
    onSave(data);
  };

  const isValid = name.trim() && startTime && endTime;

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Deep Work, Meetings"
          autoFocus
        />
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Color</label>
        <div className="flex gap-1 flex-wrap">
          {BLOCK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-6 h-6 rounded-full transition-all',
                color === c
                  ? 'ring-2 ring-offset-2 ring-offset-background ring-white'
                  : 'hover:scale-110'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">End time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50"
          />
        </div>
      </div>

      {/* Recurrence type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Recurrence</label>
        <div className="grid grid-cols-2 gap-2">
          {RECURRENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRecurrenceType(option.value)}
              className={cn(
                'py-2 px-3 rounded-lg border text-sm font-medium transition-colors',
                recurrenceType === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent hover:border-primary'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom days (only when custom recurrence selected) */}
      {recurrenceType === 'custom' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Select days</label>
          <div className="flex gap-1">
            {DAY_KEYS.map((dayKey, index) => (
              <button
                key={dayKey}
                type="button"
                onClick={() => toggleDay(index)}
                className={cn(
                  'flex-1 py-2 rounded text-xs font-medium transition-colors',
                  customDays.includes(index)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border hover:bg-accent'
                )}
              >
                {dayKey}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Associated tags</label>
        <TimeBlockTagSelector
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />
        <p className="text-xs text-muted-foreground">
          Tasks with these tags fit this block
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={!isValid || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
