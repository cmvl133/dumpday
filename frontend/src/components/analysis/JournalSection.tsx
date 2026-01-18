import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Pencil, Trash2, Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/types';

interface JournalSectionProps {
  entries: JournalEntry[] | { content: string }[];
  isPreview?: boolean;
  onUpdate?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onAdd?: (content: string) => void;
}

export function JournalSection({
  entries,
  isPreview = false,
  onUpdate,
  onDelete,
  onAdd,
}: JournalSectionProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleEdit = (entry: JournalEntry) => {
    if (entry.id !== undefined) {
      setEditingId(entry.id);
      setEditValue(entry.content);
    }
  };

  const handleSave = () => {
    if (editingId !== null && onUpdate && editValue.trim()) {
      onUpdate(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleDelete = (id: number) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleStartAdding = () => {
    setIsAdding(true);
    setNewEntryContent('');
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
    setNewEntryContent('');
  };

  const handleSaveEntry = () => {
    if (!newEntryContent.trim() || !onAdd) return;
    onAdd(newEntryContent.trim());
    setNewEntryContent('');
    setIsAdding(false);

    // Flash effect for newly added entry
    setTimeout(() => {
      setJustAdded(entries.length);
      setTimeout(() => setJustAdded(null), 500);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEntry();
    } else if (e.key === 'Escape') {
      handleCancelAdding();
    }
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground py-2">{t('tasks.noEntries')}</p>
      )}

      {entries.map((entry, index) => {
        const entryId = 'id' in entry && entry.id !== undefined ? entry.id : null;
        const isEditing = entryId !== null && editingId === entryId;

        return (
          <div
            key={entryId ?? index}
            className={cn(
              'flex items-start gap-2 py-2 bg-muted/30 rounded-lg px-3 group transition-all duration-300',
              justAdded === index && 'bg-primary/10 animate-pulse'
            )}
          >
            <Heart className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />

            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-[80px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                  >
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    {t('common.save')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm italic flex-1">{entry.content}</p>

                {!isPreview && entryId !== null && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {onUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(entry as JournalEntry)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    {onDelete && entryId !== null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(entryId)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Inline add form */}
      {isAdding && (
        <div className="py-2 animate-in slide-in-from-top-2 fade-in duration-200">
          <Textarea
            ref={textareaRef}
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('tasks.journalPlaceholder')}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter - {t('common.save')} · Shift+Enter - {t('tasks.newLine', 'new line')} · Escape - {t('common.cancel')}
          </p>
        </div>
      )}

      {/* Add entry button */}
      {!isPreview && onAdd && !isAdding && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
          onClick={handleStartAdding}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('tasks.addEntry')}
        </Button>
      )}
    </div>
  );
}
