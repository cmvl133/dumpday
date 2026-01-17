import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskItem } from './TaskItem';
import { cn } from '@/lib/utils';
import type { Task, TaskCategory } from '@/types';

interface TaskListProps {
  tasks: Task[] | { title: string; dueDate?: string }[];
  currentDate?: string;
  isTodaySection?: boolean;
  sectionType?: TaskCategory;
  onToggle?: (id: number, isCompleted: boolean) => void;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, title: string) => void;
  onUpdateDueDate?: (id: number, dueDate: string | null) => void;
  onUpdateFixedTime?: (id: number, fixedTime: string | null) => void;
  onAdd?: (title: string, dueDate: string | null, category: TaskCategory) => void;
  isPreview?: boolean;
}

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function TaskList({
  tasks,
  currentDate,
  isTodaySection = false,
  sectionType = 'today',
  onToggle,
  onDelete,
  onUpdate,
  onUpdateDueDate,
  onUpdateFixedTime,
  onAdd,
  isPreview = false,
}: TaskListProps) {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(getTomorrow());
  const inputRef = useRef<HTMLInputElement>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleStartAdding = () => {
    setIsAdding(true);
    setNewTaskTitle('');
    setNewTaskDueDate(getTomorrow());
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
    setNewTaskTitle('');
  };

  const handleSaveTask = () => {
    if (!newTaskTitle.trim() || !onAdd) return;

    let dueDate: string | null = null;
    if (sectionType === 'today') {
      dueDate = currentDate || new Date().toISOString().split('T')[0];
    } else if (sectionType === 'scheduled') {
      dueDate = newTaskDueDate;
    }
    // For 'someday', dueDate stays null

    onAdd(newTaskTitle.trim(), dueDate, sectionType);
    setNewTaskTitle('');
    setIsAdding(false);

    // Flash effect for newly added task
    setTimeout(() => {
      setJustAdded(tasks.length);
      setTimeout(() => setJustAdded(null), 500);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTask();
    } else if (e.key === 'Escape') {
      handleCancelAdding();
    }
  };

  return (
    <div className="space-y-0">
      {tasks.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground py-2">{t('tasks.noTasks')}</p>
      )}

      <div className="divide-y divide-border/50">
        {tasks.map((task, index) => (
          <div
            key={'id' in task ? task.id : index}
            className={cn(
              'transition-all duration-300',
              justAdded === index && 'bg-primary/10 animate-pulse'
            )}
          >
            <TaskItem
              id={'id' in task ? task.id : undefined}
              title={task.title}
              isCompleted={'isCompleted' in task ? task.isCompleted : false}
              dueDate={'dueDate' in task ? task.dueDate : undefined}
              fixedTime={'fixedTime' in task ? task.fixedTime : undefined}
              currentDate={currentDate}
              isTodaySection={isTodaySection}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onUpdateDueDate={onUpdateDueDate}
              onUpdateFixedTime={onUpdateFixedTime}
              isPreview={isPreview}
            />
          </div>
        ))}
      </div>

      {/* Inline add form */}
      {isAdding && (
        <div className="py-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('tasks.taskPlaceholder')}
              className="flex-1"
            />
            {sectionType === 'scheduled' && (
              <Input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-36"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enter - {t('common.save')} · Escape - {t('common.cancel')}
          </p>
        </div>
      )}

      {/* Add task button */}
      {!isPreview && onAdd && !isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
          onClick={handleStartAdding}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('tasks.addTask')}
        </Button>
      )}
    </div>
  );
}
