import { TaskItem } from './TaskItem';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[] | { title: string; dueDate?: string }[];
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  isPreview?: boolean;
}

export function TaskList({
  tasks,
  onToggle,
  onDelete,
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
          onToggle={onToggle}
          onDelete={onDelete}
          isPreview={isPreview}
        />
      ))}
    </div>
  );
}
