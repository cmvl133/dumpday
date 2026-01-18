import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { deleteRecurringTaskAll } from '@/store/recurringSlice';
import { removeTaskFromUI } from '@/store/dailyNoteSlice';
import type { AppDispatch } from '@/store';

interface DeleteRecurringConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskTitle: string;
  recurringTaskId: number;
  onDeleteJustThis: () => void;
}

export function DeleteRecurringConfirm({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  recurringTaskId,
  onDeleteJustThis,
}: DeleteRecurringConfirmProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();

  const handleDeleteJustThis = () => {
    onDeleteJustThis();
    onClose();
  };

  const handleDeleteAllFuture = async () => {
    try {
      await dispatch(deleteRecurringTaskAll(recurringTaskId)).unwrap();
      // Remove the current task from UI (backend already deleted it)
      dispatch(removeTaskFromUI({ taskId }));
      onClose();
    } catch (error) {
      console.error('Failed to delete recurring task:', error);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            {t('recurring.deleteConfirm.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground truncate">
            {taskTitle}
          </p>

          <div className="space-y-2">
            <button
              onClick={handleDeleteJustThis}
              className="w-full p-3 rounded-lg border hover:bg-accent text-left transition-colors"
            >
              <p className="font-medium">{t('recurring.deleteConfirm.justThis')}</p>
              <p className="text-xs text-muted-foreground">
                {t('recurring.deleteConfirm.justThisDesc')}
              </p>
            </button>

            <button
              onClick={handleDeleteAllFuture}
              className="w-full p-3 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-left transition-colors"
            >
              <p className="font-medium text-destructive">
                {t('recurring.deleteConfirm.allFuture')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('recurring.deleteConfirm.allFutureDesc')}
              </p>
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
