import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScheduleEvent } from '@/types';

interface EventBlockProps {
  event: ScheduleEvent;
  isPreview?: boolean;
  onUpdate?: (
    id: number,
    data: { title?: string; startTime?: string; endTime?: string }
  ) => void;
  onDelete?: (id: number) => void;
}

export function EventBlock({
  event,
  isPreview = false,
  onUpdate,
  onDelete,
}: EventBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editStartTime, setEditStartTime] = useState(event.startTime);
  const [editEndTime, setEditEndTime] = useState(event.endTime || '');

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setEditTitle(event.title);
    setEditStartTime(event.startTime);
    setEditEndTime(event.endTime || '');
    setIsEditing(true);
  };

  const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (event.id !== undefined && onUpdate) {
      onUpdate(event.id, {
        title: editTitle,
        startTime: editStartTime,
        endTime: editEndTime || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (event.id !== undefined && onDelete) {
      onDelete(event.id);
    }
  };

  if (isEditing) {
    return (
      <div
        className="absolute left-16 right-2 bg-primary/20 border-l-4 border-primary rounded-r px-2 py-1 overflow-visible z-10"
        style={{
          top: `${event.topPercent}%`,
          minHeight: '100px',
        }}
      >
        <div className="space-y-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Tytuł"
            className="h-7 text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Input
              type="time"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="h-7 text-sm w-24"
            />
            <span className="text-sm text-muted-foreground self-center">-</span>
            <Input
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              className="h-7 text-sm w-24"
            />
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1 text-green-600" />
              OK
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" />
              Anuluj
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute left-16 right-2 bg-primary/10 border-l-4 border-primary rounded-r px-2 py-1 overflow-hidden hover:bg-primary/20 transition-colors group"
      style={{
        top: `${event.topPercent}%`,
        height: `${Math.max(event.heightPercent, 3.125)}%`,
        minHeight: '30px',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{event.title}</div>
          <div className="text-xs text-muted-foreground">
            {event.startTime}
            {event.endTime && ` - ${event.endTime}`}
          </div>
        </div>

        {!isPreview && event.id !== undefined && (
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onUpdate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleEdit}
              >
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
