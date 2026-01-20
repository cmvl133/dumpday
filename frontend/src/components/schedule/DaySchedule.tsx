import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Plus, Maximize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TimeSlot } from './TimeSlot';
import { EventBlock } from './EventBlock';
import { TaskBlock } from './TaskBlock';
import { AddEventForm } from './AddEventForm';
import { TimeBlockBackground } from './TimeBlockBackground';
import type { ScheduleEvent, Task, TimeBlock } from '@/types';

interface DayScheduleProps {
  events: ScheduleEvent[];
  scheduledTasks?: Task[];
  timeBlocks?: TimeBlock[];
  isPreview?: boolean;
  onUpdateEvent?: (
    id: number,
    data: { title?: string; startTime?: string; endTime?: string }
  ) => void;
  onDeleteEvent?: (id: number) => void;
  onToggleTask?: (id: number, isCompleted: boolean) => void;
  onExpand?: () => void;
}

export interface EventWithLayout extends ScheduleEvent {
  column: number;
  totalColumns: number;
}

export interface TaskWithLayout extends Task {
  topPercent: number;
  heightPercent: number;
  offsetIndex: number;
}

const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 22;
const TOTAL_MINUTES = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60;
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

// Check if two tasks overlap in time
function tasksOverlap(a: { startMinutes: number; endMinutes: number }, b: { startMinutes: number; endMinutes: number }): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

// Calculate task layout - narrow bars on the right side
function calculateTaskLayout(tasks: Task[]): TaskWithLayout[] {
  const scheduledTasks = tasks.filter((t) => t.fixedTime);
  if (scheduledTasks.length === 0) return [];

  // Calculate time ranges for each task
  const taskRanges = scheduledTasks.map((task) => {
    const startMinutes = timeToMinutes(task.fixedTime!);
    const duration = task.estimatedMinutes || 30;
    return {
      task,
      startMinutes,
      endMinutes: startMinutes + duration,
    };
  });

  // Sort by start time
  taskRanges.sort((a, b) => a.startMinutes - b.startMinutes);

  // Assign offset indices for overlapping tasks
  const result: TaskWithLayout[] = [];
  const columns: typeof taskRanges[0][][] = [];

  for (const taskRange of taskRanges) {
    // Find first column where task doesn't overlap
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const canPlace = !columns[col].some((t) => tasksOverlap(t, taskRange));
      if (canPlace) {
        columns[col].push(taskRange);
        const topPercent = ((taskRange.startMinutes - SCHEDULE_START_HOUR * 60) / TOTAL_MINUTES) * 100;
        const heightPercent = ((taskRange.endMinutes - taskRange.startMinutes) / TOTAL_MINUTES) * 100;
        result.push({
          ...taskRange.task,
          topPercent,
          heightPercent,
          offsetIndex: col,
        });
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([taskRange]);
      const topPercent = ((taskRange.startMinutes - SCHEDULE_START_HOUR * 60) / TOTAL_MINUTES) * 100;
      const heightPercent = ((taskRange.endMinutes - taskRange.startMinutes) / TOTAL_MINUTES) * 100;
      result.push({
        ...taskRange.task,
        topPercent,
        heightPercent,
        offsetIndex: columns.length - 1,
      });
    }
  }

  return result;
}

// Get current time as percent of schedule
function getCurrentTimePercent(): number | null {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours < SCHEDULE_START_HOUR || hours >= SCHEDULE_END_HOUR) {
    return null;
  }

  const totalMinutes = (hours - SCHEDULE_START_HOUR) * 60 + minutes;
  return (totalMinutes / TOTAL_MINUTES) * 100;
}

export function DaySchedule({
  events,
  scheduledTasks = [],
  timeBlocks = [],
  isPreview = false,
  onUpdateEvent,
  onDeleteEvent,
  onToggleTask,
  onExpand,
}: DayScheduleProps) {
  const { t } = useTranslation();
  const [expandedHours, setExpandedHours] = useState<number[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentTimePercent, setCurrentTimePercent] = useState<number | null>(getCurrentTimePercent);

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTimePercent(getCurrentTimePercent());
    };

    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate layout for overlapping events
  const eventsWithLayout = useMemo(
    () => calculateEventLayout(events),
    [events]
  );

  // Calculate layout for tasks (narrow bars on the right)
  const tasksWithLayout = useMemo(
    () => calculateTaskLayout(scheduledTasks),
    [scheduledTasks]
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

  const toggleHourExpand = (hour: number) => {
    setExpandedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour]
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {t('schedule.title')}
          </CardTitle>
          {onExpand && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onExpand}
              title={t('schedule.expand')}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
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

            {/* Half-hour lines */}
            {HOURS.map((hour) => (
              <div
                key={`half-${hour}`}
                className="absolute left-14 right-0 border-t border-dashed border-muted-foreground/20"
                style={{
                  top: `${((hour - SCHEDULE_START_HOUR + 0.5) / (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR)) * 100}%`,
                }}
              />
            ))}

            {/* Time block backgrounds */}
            {timeBlocks.length > 0 && (
              <TimeBlockBackground
                timeBlocks={timeBlocks}
              />
            )}

            {/* Current time indicator */}
            {currentTimePercent !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${currentTimePercent}%` }}
              >
                <div className="relative">
                  <div className="absolute left-12 right-0 border-t-2 border-red-500" />
                  <div className="absolute left-10 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                </div>
              </div>
            )}

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

            {/* Task blocks - narrow bars on the right */}
            {tasksWithLayout.map((task, index) => (
              <TaskBlock
                key={task.id ?? index}
                task={task}
                topPercent={task.topPercent}
                heightPercent={task.heightPercent}
                offsetIndex={task.offsetIndex}
                onToggle={onToggleTask}
              />
            ))}

            {/* Empty state */}
            {events.length === 0 && tasksWithLayout.length === 0 && (
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
