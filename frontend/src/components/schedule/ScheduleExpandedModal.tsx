import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeSlot } from './TimeSlot';
import { EventBlock } from './EventBlock';
import { X, GripVertical, Clock, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleEvent, Task } from '@/types';

// Constants
const SCHEDULE_START_HOUR = 6;
const SCHEDULE_END_HOUR = 22;
const PIXELS_PER_HOUR = 60;
const TOTAL_MINUTES = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60;
const TOTAL_HEIGHT = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * PIXELS_PER_HOUR;
const HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR },
  (_, i) => i + SCHEDULE_START_HOUR
);

interface ScheduleExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduleEvent[];
  scheduledTasks: Task[];
  unscheduledTasks: Task[];
  onUpdateEvent?: (id: number, data: { title?: string; startTime?: string; endTime?: string }) => void;
  onDeleteEvent?: (id: number) => void;
  onUpdateTaskTime?: (id: number, fixedTime: string | null) => void;
}

// Convert time string "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Convert Y position to time string
function positionToTime(y: number, containerHeight: number): string {
  const percent = Math.max(0, Math.min(1, y / containerHeight));
  const totalMinutes = percent * TOTAL_MINUTES;
  const hours = Math.floor(totalMinutes / 60) + SCHEDULE_START_HOUR;
  const minutes = Math.round(totalMinutes % 60 / 5) * 5; // Round to nearest 5 minutes

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

// Draggable task in sidebar
interface DraggableSidebarTaskProps {
  task: Task;
}

function DraggableSidebarTask({ task }: DraggableSidebarTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sidebar-${task.id}`,
    data: { task, source: 'sidebar' },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent transition-colors',
        isDragging && 'shadow-lg'
      )}
    >
      <button
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', task.isCompleted && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.estimatedMinutes && (
            <span>
              {task.estimatedMinutes < 60
                ? `${task.estimatedMinutes}min`
                : `${Math.floor(task.estimatedMinutes / 60)}h${task.estimatedMinutes % 60 > 0 ? ` ${task.estimatedMinutes % 60}min` : ''}`}
            </span>
          )}
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  backgroundColor: `${tag.color}30`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable task on schedule - narrow bar style
const BAR_WIDTH = 20;
const BAR_GAP = 4;

interface DraggableScheduleTaskProps {
  task: Task;
  topPercent: number;
  heightPercent: number;
  offsetIndex: number;
}

function DraggableScheduleTask({
  task,
  topPercent,
  heightPercent,
  offsetIndex,
}: DraggableScheduleTaskProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `schedule-${task.id}`,
    data: { task, source: 'schedule', originalTop: topPercent },
  });

  const primaryTagColor = task.tags?.[0]?.color || '#9d4edd';
  const rightOffset = 8 + offsetIndex * (BAR_WIDTH + BAR_GAP);

  const style: React.CSSProperties = {
    top: transform ? `calc(${topPercent}% + ${transform.y}px)` : `${topPercent}%`,
    right: `${rightOffset}px`,
    width: `${BAR_WIDTH}px`,
    height: `${Math.max(heightPercent, 2)}%`,
    minHeight: '12px',
    backgroundColor: primaryTagColor,
    boxShadow: `0 0 8px ${primaryTagColor}60`,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : 30,
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute rounded-sm cursor-grab active:cursor-grabbing transition-all hover:brightness-125',
        isDragging && 'shadow-lg',
        task.isCompleted && 'opacity-50'
      )}
      style={style}
      {...listeners}
      {...attributes}
      title={task.title}
    >
      <GripVertical className="h-3 w-3 text-white/70 mx-auto mt-0.5" />
    </div>
  );
}

// Droppable schedule area
interface DroppableScheduleProps {
  children: React.ReactNode;
  onDrop?: (y: number) => void;
}

function DroppableSchedule({ children }: DroppableScheduleProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'schedule-drop-area',
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative transition-colors',
        isOver && 'bg-primary/5'
      )}
      style={{ height: `${TOTAL_HEIGHT}px` }}
    >
      {children}
    </div>
  );
}

export function ScheduleExpandedModal({
  isOpen,
  onClose,
  events,
  scheduledTasks,
  unscheduledTasks,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateTaskTime,
}: ScheduleExpandedModalProps) {
  const { t } = useTranslation();
  const [currentTimePercent, setCurrentTimePercent] = useState<number | null>(getCurrentTimePercent);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Update current time every minute
  useEffect(() => {
    if (!isOpen) return;

    const updateTime = () => {
      setCurrentTimePercent(getCurrentTimePercent());
    };

    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Calculate task layouts with overlap handling for narrow bars
  const tasksWithLayout = useMemo(() => {
    const filtered = scheduledTasks.filter((t) => t.fixedTime);
    if (filtered.length === 0) return [];

    // Calculate time ranges
    const taskRanges = filtered.map((task) => {
      const startMinutes = timeToMinutes(task.fixedTime!);
      const duration = task.estimatedMinutes || 30;
      return { task, startMinutes, endMinutes: startMinutes + duration };
    });

    // Sort by start time
    taskRanges.sort((a, b) => a.startMinutes - b.startMinutes);

    // Assign offset indices for overlapping tasks
    const result: { task: Task; topPercent: number; heightPercent: number; offsetIndex: number }[] = [];
    const columns: typeof taskRanges[0][][] = [];

    for (const taskRange of taskRanges) {
      let placed = false;
      for (let col = 0; col < columns.length; col++) {
        const canPlace = !columns[col].some(
          (t) => taskRange.startMinutes < t.endMinutes && t.startMinutes < taskRange.endMinutes
        );
        if (canPlace) {
          columns[col].push(taskRange);
          result.push({
            task: taskRange.task,
            topPercent: ((taskRange.startMinutes - SCHEDULE_START_HOUR * 60) / TOTAL_MINUTES) * 100,
            heightPercent: ((taskRange.endMinutes - taskRange.startMinutes) / TOTAL_MINUTES) * 100,
            offsetIndex: col,
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([taskRange]);
        result.push({
          task: taskRange.task,
          topPercent: ((taskRange.startMinutes - SCHEDULE_START_HOUR * 60) / TOTAL_MINUTES) * 100,
          heightPercent: ((taskRange.endMinutes - taskRange.startMinutes) / TOTAL_MINUTES) * 100,
          offsetIndex: columns.length - 1,
        });
      }
    }

    return result;
  }, [scheduledTasks]);

  // Calculate event layout (simplified)
  const eventsWithLayout = useMemo(() => {
    return events.map((event) => ({
      ...event,
      column: 0,
      totalColumns: 1,
    }));
  }, [events]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task;
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveTask(null);

    if (!over || !onUpdateTaskTime) return;

    const task = active.data.current?.task as Task;
    const source = active.data.current?.source as string;

    if (over.id === 'schedule-drop-area' && scheduleRef.current) {
      const rect = scheduleRef.current.getBoundingClientRect();

      if (source === 'sidebar') {
        // Dragged from sidebar - calculate time from drop position
        // Use the pointer position from active.rect
        const activeRect = active.rect.current.translated;
        if (activeRect) {
          const y = activeRect.top - rect.top + (activeRect.height / 2);
          const newTime = positionToTime(y, TOTAL_HEIGHT);
          if (task.id) {
            onUpdateTaskTime(task.id, newTime);
          }
        }
      } else if (source === 'schedule') {
        // Dragged within schedule - calculate new time from delta
        const originalTop = active.data.current?.originalTop as number;
        const currentY = (originalTop / 100) * TOTAL_HEIGHT + delta.y;
        const newTime = positionToTime(currentY, TOTAL_HEIGHT);
        if (task.id) {
          onUpdateTaskTime(task.id, newTime);
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex h-full">
            {/* Left Sidebar - Unscheduled Tasks */}
            <div className="w-72 border-r flex flex-col h-full">
              <div className="p-3 border-b flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">{t('schedule.unscheduledTasks')}</h3>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {unscheduledTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {t('schedule.allTasksScheduled')}
                    </p>
                  ) : (
                    unscheduledTasks.map((task) => (
                      <DraggableSidebarTask
                        key={task.id}
                        task={task}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main Schedule Area */}
            <div className="flex-1 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold">{t('schedule.title')}</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Schedule */}
              <ScrollArea className="flex-1">
                <div ref={scheduleRef}>
                  <DroppableSchedule>
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
                    {eventsWithLayout.map((event, index) => (
                      <EventBlock
                        key={event.id ?? index}
                        event={event}
                        column={event.column}
                        totalColumns={event.totalColumns}
                        onUpdate={onUpdateEvent}
                        onDelete={onDeleteEvent}
                      />
                    ))}

                    {/* Task blocks - narrow bars on the right */}
                    {tasksWithLayout.map((item, index) => (
                      <DraggableScheduleTask
                        key={item.task.id ?? index}
                        task={item.task}
                        topPercent={item.topPercent}
                        heightPercent={item.heightPercent}
                        offsetIndex={item.offsetIndex}
                      />
                    ))}
                  </DroppableSchedule>
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask && (
              <div className="p-2 rounded-md border bg-card shadow-lg">
                <p className="text-sm font-medium">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}
