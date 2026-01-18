import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createEvent } from '@/store/dailyNoteSlice';
import type { AppDispatch, RootState } from '@/store';

interface AddEventFormProps {
  onClose: () => void;
}

export function AddEventForm({ onClose }: AddEventFormProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const currentDate = useSelector((state: RootState) => state.dailyNote.currentDate);

  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime) return;

    setIsSubmitting(true);
    try {
      await dispatch(
        createEvent({
          title: title.trim(),
          date: currentDate,
          startTime,
          endTime: endTime || null,
        })
      ).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t bg-background/50">
      <div className="space-y-2">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('events.titlePlaceholder')}
          className="h-8 text-sm"
          autoFocus
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>
          <div className="flex-1">
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-8 text-sm"
              placeholder={t('events.endTime')}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!title.trim() || !startTime || isSubmitting}
            className="h-7 px-3"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('events.add')}
          </Button>
        </div>
      </div>
    </form>
  );
}
