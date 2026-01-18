import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Check, X, Repeat } from 'lucide-react';
import { RecurringSettings } from '@/components/tasks/RecurringSettings';
import { DeleteRecurringConfirm } from '@/components/tasks/DeleteRecurringConfirm';
import { DateTimePopover } from '@/components/tasks/DateTimePopover';
import { TaskMoreMenu } from '@/components/tasks/TaskMoreMenu';
import { TagBadge } from '@/components/tags/TagBadge';
import { TagSelector } from '@/components/tags/TagSelector';
import confetti from 'canvas-confetti';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { RootState } from '@/store';
import type { ConfettiStyle, Tag } from '@/types';

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
  isOverdue?: boolean;
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, title: string) => void;
  onUpdateDueDate?: (id: number, dueDate: string | null) => void;
  onUpdateFixedTime?: (id: number, fixedTime: string | null) => void;
  onTagsChange?: (id: number, tagIds: number[]) => void;
  isPreview?: boolean;
  recurringTaskId?: number | null;
  category?: string;
  tags?: Tag[];
}

export function TaskItem({
  id,
  title,
  isCompleted = false,
  dueDate,
  fixedTime,
  currentDate,
  isTodaySection = false,
  isOverdue = false,
  onToggle,
  onDelete,
  onUpdate,
  onUpdateDueDate,
  onUpdateFixedTime,
  onTagsChange,
  isPreview = false,
  recurringTaskId,
  category = 'today',
  tags = [],
}: TaskItemProps) {
  const confettiStyle = useSelector((state: RootState) => state.settings.confettiStyle);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [showRecurringSettings, setShowRecurringSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const checkboxWrapperRef = useRef<HTMLDivElement>(null);

  const isRecurring = recurringTaskId !== undefined && recurringTaskId !== null;

  // For "today" section, show context date; for others show dueDate
  const displayDate = isTodaySection ? (dueDate || currentDate) : dueDate;

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
      if (isRecurring) {
        setShowDeleteConfirm(true);
      } else {
        onDelete(id);
      }
    }
  };

  const handleDeleteJustThis = () => {
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

  const handleUpdateDueDate = (newDate: string | null) => {
    if (id !== undefined && onUpdateDueDate) {
      onUpdateDueDate(id, newDate);
    }
  };

  const handleUpdateFixedTime = (newTime: string | null) => {
    if (id !== undefined && onUpdateFixedTime) {
      onUpdateFixedTime(id, newTime);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 py-2 group relative",
      isOverdue && "bg-red-500/10 border-l-2 border-red-500 pl-2 -ml-2 rounded-r"
    )}>
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
              'flex-1 text-sm flex items-center gap-1 flex-wrap',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {isRecurring && (
              <Repeat className="h-3 w-3 text-primary shrink-0" />
            )}
            <span className="break-words">{title}</span>
            {tags.length > 0 && (
              <span className="flex items-center gap-1 ml-1">
                {tags.slice(0, 3).map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
                {tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{tags.length - 3}
                  </span>
                )}
              </span>
            )}
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

          {!isPreview && id !== undefined && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded">
              {/* Date & Time Popover */}
              {(onUpdateDueDate || onUpdateFixedTime) && (
                <DateTimePopover
                  dueDate={dueDate}
                  fixedTime={fixedTime}
                  onUpdateDueDate={onUpdateDueDate ? handleUpdateDueDate : undefined}
                  onUpdateFixedTime={onUpdateFixedTime ? handleUpdateFixedTime : undefined}
                  defaultDate={currentDate}
                />
              )}

              {/* Tags */}
              {onTagsChange && (
                <TagSelector
                  selectedTags={tags}
                  onTagsChange={(tagIds) => {
                    if (id !== undefined) {
                      onTagsChange(id, tagIds);
                    }
                  }}
                />
              )}

              {/* More Menu (Edit, Recurring, Delete) */}
              <TaskMoreMenu
                isRecurring={isRecurring}
                onEdit={onUpdate ? handleEdit : undefined}
                onRecurring={() => setShowRecurringSettings(true)}
                onDelete={onDelete ? handleDelete : undefined}
              />
            </div>
          )}
        </>
      )}

      {/* Recurring Settings Dialog */}
      <RecurringSettings
        isOpen={showRecurringSettings}
        onClose={() => setShowRecurringSettings(false)}
        taskId={id}
        taskTitle={title}
        taskCategory={category as 'today' | 'scheduled' | 'someday'}
        recurringTaskId={recurringTaskId}
      />

      {/* Delete Recurring Confirmation Dialog */}
      {id !== undefined && recurringTaskId && (
        <DeleteRecurringConfirm
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          taskId={id}
          taskTitle={title}
          recurringTaskId={recurringTaskId}
          onDeleteJustThis={handleDeleteJustThis}
        />
      )}
    </div>
  );
}
