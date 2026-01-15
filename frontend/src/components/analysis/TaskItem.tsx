import { useState, useRef } from 'react';
import { Trash2, Pencil, Check, X, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  id?: number;
  title: string;
  isCompleted?: boolean;
  dueDate?: string | null;
  currentDate?: string;
  isTodaySection?: boolean;
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, title: string) => void;
  onUpdateDueDate?: (id: number, dueDate: string | null) => void;
  isPreview?: boolean;
}

export function TaskItem({
  id,
  title,
  isCompleted = false,
  dueDate,
  currentDate,
  isTodaySection = false,
  onToggle,
  onDelete,
  onUpdate,
  onUpdateDueDate,
  isPreview = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // For "today" section, show context date; for others show dueDate
  const displayDate = isTodaySection ? (dueDate || currentDate) : dueDate;
  // Date picker defaults to dueDate if set, otherwise context date
  const dateInputValue = dueDate || currentDate || '';

  const handleToggle = () => {
    if (id !== undefined && onToggle) {
      onToggle(id, !isCompleted);
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

  return (
    <div className="flex items-center gap-3 py-2 group relative">
      {!isPreview && id !== undefined ? (
        <Checkbox checked={isCompleted} onCheckedChange={handleToggle} />
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

          {displayDate && (
            <Badge variant="outline" className="text-xs">
              {new Date(displayDate + 'T00:00:00').toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'short',
              })}
            </Badge>
          )}

          {!isPreview && id !== undefined && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded">
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
