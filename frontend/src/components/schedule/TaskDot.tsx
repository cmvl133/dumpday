import { useState } from 'react';
import { Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task } from '@/types';

interface TaskDotProps {
  task: Task;
  onToggle?: (id: number, isCompleted: boolean) => void;
}

export function TaskDot({ task, onToggle }: TaskDotProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = () => {
    if (task.id !== undefined && onToggle) {
      onToggle(task.id, !task.isCompleted);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        onClick={handleToggle}
        className={`w-3 h-3 rounded-full cursor-pointer transition-all hover:scale-125 flex items-center justify-center ${
          task.isCompleted
            ? 'bg-primary/50'
            : 'bg-secondary border-2 border-secondary-foreground/20'
        }`}
        title={task.title}
      >
        {task.isCompleted && (
          <Check className="w-2 h-2 text-primary-foreground" />
        )}
      </div>

      {showTooltip && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-popover border rounded-lg shadow-lg px-3 py-2 z-50 whitespace-nowrap max-w-[250px]">
          <div className="flex items-center gap-2">
            {onToggle && task.id !== undefined && (
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={handleToggle}
                className="h-4 w-4"
              />
            )}
            <p className={`text-sm font-medium truncate ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
          </div>
          {task.estimatedMinutes && (
            <p className="text-xs text-muted-foreground mt-1 ml-6">
              {task.estimatedMinutes < 60
                ? `${task.estimatedMinutes}min`
                : `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 > 0 ? ` ${task.estimatedMinutes % 60}min` : ''}`}
            </p>
          )}
          {task.fixedTime && (
            <p className="text-xs text-primary mt-0.5 ml-6">
              {task.fixedTime}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
