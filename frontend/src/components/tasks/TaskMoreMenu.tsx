import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Repeat, Trash2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskMoreMenuProps {
  isRecurring?: boolean;
  onEdit?: () => void;
  onRecurring?: () => void;
  onDelete?: () => void;
}

export function TaskMoreMenu({
  isRecurring,
  onEdit,
  onRecurring,
  onDelete,
}: TaskMoreMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
        >
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="end">
        <div className="flex flex-col">
          {onEdit && (
            <button
              type="button"
              onClick={() => handleAction(onEdit)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors text-left"
            >
              <Pencil className="h-4 w-4" />
              {t('tasks.editTask')}
            </button>
          )}
          {onRecurring && (
            <button
              type="button"
              onClick={() => handleAction(onRecurring)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors text-left"
            >
              <Repeat className={cn('h-4 w-4', isRecurring && 'text-primary')} />
              {isRecurring ? t('recurring.stopRecurring') : t('recurring.makeRecurring')}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => handleAction(onDelete)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors text-left text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t('tasks.deleteTask')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
