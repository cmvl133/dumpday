import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeSlot } from './TimeSlot';
import { EventBlock } from './EventBlock';
import type { ScheduleEvent } from '@/types';

interface DayScheduleProps {
  events: ScheduleEvent[];
}

const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 22;
const HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
  (_, i) => i + SCHEDULE_START_HOUR
);

export function DaySchedule({ events }: DayScheduleProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Harmonogram
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[600px]">
          <div
            className="relative"
            style={{ height: `${HOURS.length * 60}px` }}
          >
            {/* Time markers */}
            {HOURS.map((hour) => (
              <TimeSlot key={hour} hour={hour} />
            ))}

            {/* Event blocks */}
            {events.map((event, index) => (
              <EventBlock key={event.id ?? index} event={event} />
            ))}

            {/* Empty state */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Brak zaplanowanych wydarzeń
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
