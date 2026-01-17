import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeSlot } from './TimeSlot';
import { EventBlock } from './EventBlock';
import type { ScheduleEvent } from '@/types';

interface DayScheduleProps {
  events: ScheduleEvent[];
  isPreview?: boolean;
  onUpdateEvent?: (
    id: number,
    data: { title?: string; startTime?: string; endTime?: string }
  ) => void;
  onDeleteEvent?: (id: number) => void;
}

export interface EventWithLayout extends ScheduleEvent {
  column: number;
  totalColumns: number;
}

const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 22;
const HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
  (_, i) => i + SCHEDULE_START_HOUR
);

// Convert time string "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Check if two events overlap
function eventsOverlap(a: ScheduleEvent, b: ScheduleEvent): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = a.endTime ? timeToMinutes(a.endTime) : aStart + 60;
  const bStart = timeToMinutes(b.startTime);
  const bEnd = b.endTime ? timeToMinutes(b.endTime) : bStart + 60;

  return aStart < bEnd && bStart < aEnd;
}

// Calculate column layout for overlapping events
function calculateEventLayout(events: ScheduleEvent[]): EventWithLayout[] {
  if (events.length === 0) return [];

  // Sort events by start time
  const sorted = [...events].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const result: EventWithLayout[] = [];
  const groups: ScheduleEvent[][] = [];

  // Group overlapping events together
  for (const event of sorted) {
    let addedToGroup = false;

    for (const group of groups) {
      // Check if this event overlaps with any event in the group
      if (group.some((e) => eventsOverlap(e, event))) {
        group.push(event);
        addedToGroup = true;
        break;
      }
    }

    if (!addedToGroup) {
      groups.push([event]);
    }
  }

  // Merge groups that have overlapping events
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        // Check if any event in group i overlaps with any event in group j
        const overlaps = groups[i].some((a) =>
          groups[j].some((b) => eventsOverlap(a, b))
        );
        if (overlaps) {
          groups[i] = [...groups[i], ...groups[j]];
          groups.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // Assign columns within each group
  for (const group of groups) {
    const columns: ScheduleEvent[][] = [];

    // Sort group by start time
    group.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    for (const event of group) {
      // Find the first column where this event doesn't overlap
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const canPlace = !columns[col].some((e) => eventsOverlap(e, event));
        if (canPlace) {
          columns[col].push(event);
          result.push({
            ...event,
            column: col,
            totalColumns: 0, // Will be set after
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([event]);
        result.push({
          ...event,
          column: columns.length - 1,
          totalColumns: 0,
        });
      }
    }

    // Set totalColumns for all events in this group
    const totalCols = columns.length;
    for (const r of result) {
      if (group.some((e) => e.startTime === r.startTime && e.title === r.title)) {
        r.totalColumns = totalCols;
      }
    }
  }

  return result;
}

export function DaySchedule({
  events,
  isPreview = false,
  onUpdateEvent,
  onDeleteEvent,
}: DayScheduleProps) {
  const { t } = useTranslation();

  // Calculate layout for overlapping events
  const eventsWithLayout = useMemo(
    () => calculateEventLayout(events),
    [events]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t('schedule.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            className="relative"
            style={{ height: `${HOURS.length * 60}px` }}
          >
            {/* Time markers */}
            {HOURS.map((hour) => (
              <TimeSlot key={hour} hour={hour} />
            ))}

            {/* Event blocks */}
            {eventsWithLayout.map((event, index) => (
              <EventBlock
                key={event.id ?? index}
                event={event}
                column={event.column}
                totalColumns={event.totalColumns}
                isPreview={isPreview}
                onUpdate={onUpdateEvent}
                onDelete={onDeleteEvent}
              />
            ))}

            {/* Empty state */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {t('schedule.noEvents')}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
