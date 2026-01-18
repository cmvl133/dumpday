import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Calendar, Edit2, Check, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SplitPart, PlanningTask } from '@/types';

interface SplitPreviewProps {
  task: PlanningTask;
  parts: SplitPart[];
  onAccept: (parts: SplitPart[]) => void;
  onBack: () => void;
}

export function SplitPreview({ task, parts: initialParts, onAccept, onBack }: SplitPreviewProps) {
  const { t } = useTranslation();
  const [parts, setParts] = useState<SplitPart[]>(initialParts);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState({ startTime: '', duration: '' });

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue({
      startTime: parts[index].startTime,
      duration: parts[index].duration.toString(),
    });
  };

  const handleSaveEdit = (index: number) => {
    const newParts = [...parts];
    newParts[index] = {
      ...newParts[index],
      startTime: editValue.startTime,
      duration: parseInt(editValue.duration) || newParts[index].duration,
    };
    setParts(newParts);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const totalDuration = parts.reduce((sum, part) => sum + part.duration, 0);
  const taskDuration = task.estimatedMinutes || 0;

  const formatDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const partDate = new Date(dateStr);
    partDate.setHours(0, 0, 0, 0);

    if (partDate.getTime() === today.getTime()) {
      return t('dates.today');
    } else if (partDate.getTime() === tomorrow.getTime()) {
      return t('dates.tomorrow');
    }
    return dateStr;
  };

  const uniqueDates = [...new Set(parts.map((p) => p.date))];
  const hasMultipleDays = uniqueDates.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-lg font-medium">{t('planning.split.preview')}</span>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="font-medium">{task.title}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {t('planning.split.totalParts', {
              parts: parts.length,
              duration: totalDuration,
              taskDuration,
            })}
          </span>
        </div>
      </div>

      {hasMultipleDays && (
        <div className="text-sm text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {t('planning.split.acrossDaysWarning')}
        </div>
      )}

      <div className="space-y-3">
        {parts.map((part, index) => (
          <div
            key={index}
            className="bg-secondary/10 border border-secondary/30 rounded-lg p-4"
          >
            {editingIndex === index ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[80px]">
                    {t('planning.split.startTime')}:
                  </span>
                  <Input
                    type="time"
                    value={editValue.startTime}
                    onChange={(e) =>
                      setEditValue({ ...editValue, startTime: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium min-w-[80px]">
                    {t('planning.split.durationMin')}:
                  </span>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={editValue.duration}
                    onChange={(e) =>
                      setEditValue({ ...editValue, duration: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSaveEdit(index)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-primary">
                      {t('planning.split.partLabel', { number: index + 1 })}
                    </span>
                    {hasMultipleDays && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {formatDate(part.date)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span>{part.startTime}</span>
                    <span className="mx-2">•</span>
                    <span>{part.duration}min</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(index)}
                  className="p-2"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => onAccept(parts)}
          variant="default"
          className="w-full py-6"
          disabled={totalDuration < taskDuration}
        >
          {t('planning.split.accept')}
        </Button>
        {totalDuration < taskDuration && (
          <p className="text-xs text-center text-destructive">
            {t('planning.split.notEnoughTime', {
              missing: taskDuration - totalDuration,
            })}
          </p>
        )}
      </div>
    </div>
  );
}
