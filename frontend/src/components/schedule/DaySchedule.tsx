import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TimeSlot } from './TimeSlot';
import { EventBlock } from './EventBlock';
import { TaskDot } from './TaskDot';
import { AddEventForm } from './AddEventForm';
import type { ScheduleEvent, Task } from '@/types';

interface DayScheduleProps {
  events: ScheduleEvent[];
  scheduledTasks?: Task[];
  isPreview?: boolean;
  onUpdateEvent?: (
    id: number,
    data: { title?: string; startTime?: string; endTime?: string }
  ) => void;
  onDeleteEvent?: (id: number) => void;
  onToggleTask?: (id: number, isCompleted: boolean) => void;
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

// Convert time string "HH:MM" to percent of schedule (6:00-22:00 = 16 hours)
function timeToPercent(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const scheduleStartMinutes = SCHEDULE_START_HOUR * 60;
  const scheduleEndMinutes = SCHEDULE_END_HOUR * 60;
  const scheduleDuration = scheduleEndMinutes - scheduleStartMinutes;

  return ((totalMinutes - scheduleStartMinutes) / scheduleDuration) * 100;
}

export function DaySchedule({
  events,
  scheduledTasks = [],
  isPreview = false,
  onUpdateEvent,
  onDeleteEvent,
  onToggleTask,
}: DayScheduleProps) {
  const { t } = useTranslation();
  const [expandedHours, setExpandedHours] = useState<number[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate layout for overlapping events
  const eventsWithLayout = useMemo(
    () => calculateEventLayout(events),
    [events]
  );

  // Group events by hour for overflow handling
  const eventsByHour = useMemo(() => {
    const grouped: Record<number, typeof eventsWithLayout> = {};
    for (const event of eventsWithLayout) {
      const hour = parseInt(event.startTime.split(':')[0], 10);
      if (!grouped[hour]) {
        grouped[hour] = [];
      }
      grouped[hour].push(event);
    }
    return grouped;
  }, [eventsWithLayout]);

  // Calculate which events to show (max 2 per hour unless expanded)
  const visibleEvents = useMemo(() => {
    const visible: typeof eventsWithLayout = [];
    const overflow: Record<number, number> = {};

    for (const hour of Object.keys(eventsByHour).map(Number)) {
      const hourEvents = eventsByHour[hour];
      const isExpanded = expandedHours.includes(hour);

      if (isExpanded || hourEvents.length <= 2) {
        visible.push(...hourEvents);
      } else {
        visible.push(...hourEvents.slice(0, 2));
        overflow[hour] = hourEvents.length - 2;
      }
    }

    return { visible, overflow };
  }, [eventsByHour, expandedHours]);

  // Calculate positions for scheduled tasks
  // Add offset to center dots in the middle of the time slot (half hour = ~3.125%)
  const slotOffsetPercent = (100 / (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR)) / 2;
  const taskPositions = useMemo(() => {
    return scheduledTasks
      .filter((task) => task.fixedTime)
      .map((task) => ({
        task,
        topPercent: timeToPercent(task.fixedTime!) + slotOffsetPercent,
      }));
  }, [scheduledTasks, slotOffsetPercent]);

  // Group tasks by approximate position (within 5% of each other)
  const groupedTasks = useMemo(() => {
    const groups: { tasks: typeof taskPositions; topPercent: number }[] = [];

    for (const taskPos of taskPositions) {
      const existingGroup = groups.find(
        (g) => Math.abs(g.topPercent - taskPos.topPercent) < 5
      );
      if (existingGroup) {
        existingGroup.tasks.push(taskPos);
      } else {
        groups.push({ tasks: [taskPos], topPercent: taskPos.topPercent });
      }
    }

    return groups;
  }, [taskPositions]);

  const toggleHourExpand = (hour: number) => {
    setExpandedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour]
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {t('schedule.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1">
          <div
            className="relative"
            style={{ height: `${HOURS.length * 60}px` }}
          >
            {/* Time markers */}
            {HOURS.map((hour) => (
              <TimeSlot key={hour} hour={hour} />
            ))}

            {/* Event blocks */}
            {visibleEvents.visible.map((event, index) => (
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

            {/* Overflow indicators */}
            {Object.entries(visibleEvents.overflow).map(([hour, count]) => (
              <button
                key={`overflow-${hour}`}
                onClick={() => toggleHourExpand(Number(hour))}
                className="absolute left-16 right-2 text-xs text-primary hover:text-primary/80 font-medium cursor-pointer z-10"
                style={{
                  top: `${((Number(hour) - SCHEDULE_START_HOUR + 0.8) / (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR)) * 100}%`,
                }}
              >
                {t('schedule.moreEvents', { count })}
              </button>
            ))}

            {/* Task dots */}
            {groupedTasks.map((group, groupIndex) => (
              <div
                key={`task-group-${groupIndex}`}
                className="absolute right-2 flex flex-row items-center gap-1 z-10 -translate-y-1/2"
                style={{ top: `${group.topPercent}%` }}
              >
                {group.tasks.slice(0, 3).map(({ task }, taskIndex) => (
                  <TaskDot
                    key={task.id ?? taskIndex}
                    task={task}
                    onToggle={onToggleTask}
                  />
                ))}
                {group.tasks.length > 3 && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    +{group.tasks.length - 3}
                  </span>
                )}
              </div>
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

        {/* Add event section */}
        {!isPreview && (
          showAddForm ? (
            <div className="shrink-0">
              <AddEventForm onClose={() => setShowAddForm(false)} />
            </div>
          ) : (
            <div className="p-2 border-t shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="w-full h-8 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('events.addEvent')}
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
