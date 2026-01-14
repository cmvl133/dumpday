import type { ScheduleEvent } from '@/types';

interface EventBlockProps {
  event: ScheduleEvent;
}

export function EventBlock({ event }: EventBlockProps) {
  return (
    <div
      className="absolute left-16 right-2 bg-primary/10 border-l-4 border-primary rounded-r px-2 py-1 overflow-hidden hover:bg-primary/20 transition-colors cursor-default"
      style={{
        top: `${event.topPercent}%`,
        height: `${Math.max(event.heightPercent, 3.125)}%`,
        minHeight: '30px',
      }}
    >
      <div className="text-sm font-medium truncate">{event.title}</div>
      <div className="text-xs text-muted-foreground">
        {event.startTime}
        {event.endTime && ` - ${event.endTime}`}
      </div>
    </div>
  );
}
