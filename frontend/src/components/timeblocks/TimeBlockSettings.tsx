import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Clock, Pencil, Trash2, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimeBlockForm, type TimeBlockFormData } from './TimeBlockForm';
import {
  fetchTimeBlocks,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
} from '@/store/timeBlockSlice';
import type { RootState, AppDispatch } from '@/store';
import type { TimeBlock } from '@/types';

export function TimeBlockSettings() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const timeBlocks = useSelector((state: RootState) => state.timeBlocks.timeBlocks);
  const [isOpen, setIsOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchTimeBlocks());
  }, [dispatch]);

  const handleCreate = async (data: TimeBlockFormData) => {
    setIsSaving(true);
    try {
      await dispatch(createTimeBlock({
        name: data.name,
        color: data.color,
        startTime: data.startTime,
        endTime: data.endTime,
        recurrenceType: data.recurrenceType,
        recurrenceDays: data.recurrenceDays,
        tagIds: data.tagIds,
      })).unwrap();
      setShowCreateForm(false);
    } catch {
      // Error handling
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: TimeBlockFormData) => {
    if (!editingBlock) return;
    setIsSaving(true);
    try {
      await dispatch(updateTimeBlock({
        id: editingBlock.id,
        data: {
          name: data.name,
          color: data.color,
          startTime: data.startTime,
          endTime: data.endTime,
          recurrenceType: data.recurrenceType,
          recurrenceDays: data.recurrenceDays,
          tagIds: data.tagIds,
        },
      })).unwrap();
      setEditingBlock(null);
    } catch {
      // Error handling
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteTimeBlock(id)).unwrap();
      setDeleteConfirmId(null);
    } catch {
      // Error handling
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-4 w-4" />
          {t('timeBlocks.manageBlocks')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('timeBlocks.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
          {timeBlocks.length === 0 && !showCreateForm && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('timeBlocks.noBlocks')}
            </p>
          )}

          {/* Existing blocks */}
          {timeBlocks.map((block) => (
            <div key={block.id} className="border rounded-lg p-3">
              {editingBlock?.id === block.id ? (
                <TimeBlockForm
                  initialData={block}
                  onSave={handleUpdate}
                  onCancel={() => setEditingBlock(null)}
                  isSaving={isSaving}
                />
              ) : deleteConfirmId === block.id ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('timeBlocks.deleteConfirm')}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(block.id)} className="h-7">
                      {t('timeBlocks.deleteBlock')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="h-7">
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full mt-1.5" style={{ backgroundColor: block.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{block.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {block.startTime} - {block.endTime}
                    </div>
                    {block.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {block.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ backgroundColor: `${tag.color}30`, color: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingBlock(block)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteConfirmId(block.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Create form */}
          {showCreateForm ? (
            <div className="border rounded-lg p-3">
              <TimeBlockForm
                onSave={handleCreate}
                onCancel={() => setShowCreateForm(false)}
                isSaving={isSaving}
              />
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('timeBlocks.addBlock')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
