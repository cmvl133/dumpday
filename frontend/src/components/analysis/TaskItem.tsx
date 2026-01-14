import { useState } from 'react';
import { Trash2, Pencil, Check, X } from 'lucide-react';
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
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, title: string) => void;
  isPreview?: boolean;
}

export function TaskItem({
  id,
  title,
  isCompleted = false,
  dueDate,
  onToggle,
  onDelete,
  onUpdate,
  isPreview = false,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);

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

  return (
    <div className="flex items-center gap-3 py-2 group">
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

          {dueDate && (
            <Badge variant="outline" className="text-xs">
              {new Date(dueDate + 'T00:00:00').toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'short',
              })}
            </Badge>
          )}

          {!isPreview && id !== undefined && (
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
              {onUpdate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
