import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskBlockProps {
  task: Task;
  topPercent: number;
  heightPercent: number;
  offsetIndex?: number;
  onToggle?: (id: number, isCompleted: boolean) => void;
}

const BAR_WIDTH = 24;
const BAR_GAP = 2;
const TASKS_ZONE_RIGHT = 8; // right margin for task zone

export function TaskBlock({
  task,
  topPercent,
  heightPercent,
  offsetIndex = 0,
  onToggle,
}: TaskBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.id !== undefined && onToggle) {
      onToggle(task.id, !task.isCompleted);
    }
  };

  // Get primary tag color or use default purple
  const primaryTagColor = task.tags?.[0]?.color || '#9d4edd';
  const isCompleted = task.isCompleted;

  // Calculate right offset based on index (for multiple tasks at similar times)
  const rightOffset = TASKS_ZONE_RIGHT + offsetIndex * (BAR_WIDTH + BAR_GAP);

  // Check if bar is tall enough for rotated text (2+ hours = 12.5% of 16h schedule)
  const showRotatedText = heightPercent >= 12.5;

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        top: `${topPercent}%`,
        right: `${rightOffset}px`,
        width: `${BAR_WIDTH}px`,
        height: `${Math.max(heightPercent, 2)}%`,
        minHeight: '16px',
        zIndex: showTooltip ? 100 : 30,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={handleToggle}
      title={task.title}
    >
      {/* Task bar visual */}
      <div
        className={cn(
          'absolute inset-0 rounded-sm transition-all hover:brightness-125',
          isCompleted && 'opacity-50'
        )}
        style={{
          backgroundColor: primaryTagColor,
          boxShadow: `0 0 8px ${primaryTagColor}60`,
        }}
      >
        {/* Rotated task name */}
        {showRotatedText && (
          <div
            className="absolute inset-0 flex items-center justify-center overflow-hidden p-1"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            <span
              className={cn(
                'text-[10px] font-medium text-white/90 truncate py-1',
                isCompleted && 'line-through'
              )}
              style={{
                maxHeight: 'calc(100% - 8px)',
                transform: 'rotate(180deg)',
              }}
            >
              {task.title}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip - high z-index to be above time indicator */}
      {showTooltip && (
        <div
          className="absolute right-full mr-2 top-0 bg-popover border rounded-lg shadow-lg px-3 py-2 z-[100] w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-2">
            {onToggle && task.id !== undefined && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => {}}
                onClick={handleToggle}
                className="h-4 w-4 mt-0.5 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium break-words',
                isCompleted && 'line-through text-muted-foreground'
              )}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {task.fixedTime && (
                  <span className="text-primary">{task.fixedTime}</span>
                )}
                {task.estimatedMinutes && (
                  <span>
                    {task.estimatedMinutes < 60
                      ? `${task.estimatedMinutes}min`
                      : `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 > 0 ? ` ${task.estimatedMinutes % 60}min` : ''}`}
                  </span>
                )}
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: `${tag.color}30`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
