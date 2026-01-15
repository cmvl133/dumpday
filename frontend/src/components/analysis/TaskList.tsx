import { TaskItem } from './TaskItem';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[] | { title: string; dueDate?: string }[];
  currentDate?: string;
  isTodaySection?: boolean;
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, title: string) => void;
  onUpdateDueDate?: (id: number, dueDate: string | null) => void;
  isPreview?: boolean;
}

export function TaskList({
  tasks,
  currentDate,
  isTodaySection = false,
  onToggle,
  onDelete,
  onUpdate,
  onUpdateDueDate,
  isPreview = false,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Brak zadań</p>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {tasks.map((task, index) => (
        <TaskItem
          key={'id' in task ? task.id : index}
          id={'id' in task ? task.id : undefined}
          title={task.title}
          isCompleted={'isCompleted' in task ? task.isCompleted : false}
          dueDate={'dueDate' in task ? task.dueDate : undefined}
          currentDate={currentDate}
          isTodaySection={isTodaySection}
          onToggle={onToggle}
          onDelete={onDelete}
          onUpdate={onUpdate}
          onUpdateDueDate={onUpdateDueDate}
          isPreview={isPreview}
        />
      ))}
    </div>
  );
}
