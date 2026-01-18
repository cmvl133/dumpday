import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Repeat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { createRecurringTask, deleteRecurringTask } from '@/store/recurringSlice';
import { updateTaskRecurringId, clearTaskRecurringId } from '@/store/dailyNoteSlice';
import type { AppDispatch } from '@/store';
import type { RecurrenceType, TaskCategory } from '@/types';

const RECURRENCE_OPTIONS: { value: RecurrenceType; labelKey: string }[] = [
  { value: 'daily', labelKey: 'recurring.daily' },
  { value: 'weekly', labelKey: 'recurring.weekly' },
  { value: 'weekdays', labelKey: 'recurring.weekdays' },
  { value: 'monthly', labelKey: 'recurring.monthly' },
  { value: 'custom', labelKey: 'recurring.custom' },
];

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

interface RecurringSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  taskId?: number;
  taskTitle: string;
  taskCategory?: TaskCategory;
  recurringTaskId?: number | null;
}

export function RecurringSettings({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  taskCategory = 'today',
  recurringTaskId,
}: RecurringSettingsProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default weekdays
  const [endDate, setEndDate] = useState<string>('');

  const isRecurring = recurringTaskId !== undefined && recurringTaskId !== null;

  const handleSave = async () => {
    try {
      const result = await dispatch(
        createRecurringTask({
          title: taskTitle,
          recurrenceType,
          recurrenceDays: recurrenceType === 'custom' ? customDays : null,
          category: taskCategory,
          endDate: endDate || null,
          linkTaskId: taskId,
        })
      ).unwrap();
      // Update the task's recurringTaskId in the dailyNote state
      if (taskId && result.id) {
        dispatch(updateTaskRecurringId({ taskId, recurringTaskId: result.id }));
      }
      onClose();
    } catch (error) {
      console.error('Failed to create recurring task:', error);
    }
  };

  const handleStopRecurring = async () => {
    if (recurringTaskId) {
      try {
        await dispatch(deleteRecurringTask(recurringTaskId)).unwrap();
        // Clear the recurringTaskId from the task
        if (taskId) {
          dispatch(clearTaskRecurringId({ taskId }));
        }
        onClose();
      } catch (error) {
        console.error('Failed to stop recurring task:', error);
      }
    }
  };

  const toggleDay = (day: number) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((d) => d !== day));
    } else {
      setCustomDays([...customDays, day].sort());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            {t('recurring.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground truncate">
            {taskTitle}
          </p>

          {isRecurring ? (
            <div className="space-y-4">
              <p className="text-sm">
                {t('recurring.stopRecurring')}
              </p>
              <Button
                variant="destructive"
                onClick={handleStopRecurring}
                className="w-full"
              >
                {t('recurring.stopRecurring')}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('recurring.makeRecurring')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {RECURRENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRecurrenceType(option.value)}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        recurrenceType === option.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card hover:bg-accent hover:border-primary'
                      }`}
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {recurrenceType === 'custom' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('recurring.selectDays')}</p>
                  <div className="flex gap-1">
                    {DAY_KEYS.map((dayKey, index) => (
                      <button
                        key={dayKey}
                        onClick={() => toggleDay(index)}
                        className={`flex-1 py-2 rounded text-xs font-medium transition-colors ${
                          customDays.includes(index)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border hover:bg-accent'
                        }`}
                      >
                        {t(`recurring.days.${dayKey}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={!!endDate}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setEndDate('');
                      } else {
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        setEndDate(nextMonth.toISOString().split('T')[0]);
                      }
                    }}
                  />
                  <p className="text-sm">{t('recurring.endDate')}</p>
                </div>
                {endDate && (
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {!isRecurring && (
            <Button onClick={handleSave}>
              {t('common.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
