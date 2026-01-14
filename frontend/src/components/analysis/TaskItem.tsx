import { Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskItemProps {
  id?: number;
  title: string;
  isCompleted?: boolean;
  dueDate?: string | null;
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  isPreview?: boolean;
}

export function TaskItem({
  id,
  title,
  isCompleted = false,
  dueDate,
  onToggle,
  onDelete,
  isPreview = false,
}: TaskItemProps) {
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

  return (
    <div className="flex items-center gap-3 py-2 group">
      {!isPreview && id !== undefined ? (
        <Checkbox checked={isCompleted} onCheckedChange={handleToggle} />
      ) : (
        <div className="w-4 h-4 rounded-sm border border-muted-foreground/30" />
      )}

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

      {!isPreview && id !== undefined && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
}
