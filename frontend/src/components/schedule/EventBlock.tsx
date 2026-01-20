import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ScheduleEvent } from '@/types';

interface EventBlockProps {
  event: ScheduleEvent;
  column?: number;
  totalColumns?: number;
  isPreview?: boolean;
  onUpdate?: (
    id: number,
    data: { title?: string; startTime?: string; endTime?: string }
  ) => void;
  onDelete?: (id: number) => void;
}

export function EventBlock({
  event,
  column = 0,
  totalColumns = 1,
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

  // Calculate horizontal positioning for overlapping events
  // TimeBlockStrip ends at 76px (56px left + 20px width), add 8px gap
  const leftOffset = 84;
  const rightMargin = 70; // Reserve space for task bars on the right (2 overlapping tasks = ~58px)
  const availableWidth = `calc(100% - ${leftOffset}px - ${rightMargin}px)`;
  const columnWidth = `calc(${availableWidth} / ${totalColumns})`;
  const columnLeft = `calc(${leftOffset}px + (${availableWidth} * ${column} / ${totalColumns}))`;

  if (isEditing) {
    return (
      <div
        className="absolute bg-background border border-border shadow-lg rounded px-3 py-2 z-20"
        style={{
          top: `${event.topPercent}%`,
          left: columnLeft,
          width: columnWidth,
          minHeight: '110px',
        }}
      >
        <div className="space-y-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Tytuł"
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <Input
              type="time"
              value={editStartTime}
              onChange={(e) => setEditStartTime(e.target.value)}
              className="h-8 text-sm w-32"
            />
            <span className="text-sm text-muted-foreground">-</span>
            <Input
              type="time"
              value={editEndTime}
              onChange={(e) => setEditEndTime(e.target.value)}
              className="h-8 text-sm w-32"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="default" size="sm" className="h-7" onClick={handleSave}>
              <Check className="h-3 w-3 mr-1" />
              Zapisz
            </Button>
            <Button variant="ghost" size="sm" className="h-7" onClick={handleCancel}>
              <X className="h-3 w-3 mr-1" />
              Anuluj
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Determine if this is a short event (less than ~45 min / 4.7% height)
  const isShortEvent = event.heightPercent < 5;

  return (
    <div
      className="absolute bg-primary/10 border-l-4 border-primary rounded-r px-2 py-1 overflow-hidden hover:bg-primary/20 transition-colors group"
      style={{
        top: `${event.topPercent}%`,
        left: columnLeft,
        width: `calc(${columnWidth} - 4px)`, // Small gap between columns
        height: `${Math.max(event.heightPercent, 3.125)}%`,
        minHeight: '28px',
      }}
      title={`${event.title} (${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
    >
      {/* Event title - uses full width */}
      <div className={isShortEvent ? "text-xs font-medium line-clamp-2" : "text-sm font-medium line-clamp-3"}>
        {event.title}
      </div>

      {/* Action buttons - overlay on hover */}
      {!isPreview && event.id !== undefined && (
        <div className="absolute top-0.5 right-0.5 flex opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded shadow-sm">
          {onUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleEdit}
            >
              <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
