import { useState } from 'react';
import { Heart, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { JournalEntry } from '@/types';

interface JournalSectionProps {
  entries: JournalEntry[] | { content: string }[];
  isPreview?: boolean;
  onUpdate?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
}

export function JournalSection({
  entries,
  isPreview = false,
  onUpdate,
  onDelete,
}: JournalSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Brak wpisów</p>
    );
  }

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

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const entryId = 'id' in entry && entry.id !== undefined ? entry.id : null;
        const isEditing = entryId !== null && editingId === entryId;

        return (
          <div
            key={entryId ?? index}
            className="flex items-start gap-2 py-2 bg-muted/30 rounded-lg px-3 group"
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
                    Zapisz
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Anuluj
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
                        className="h-8 w-8"
                        onClick={() => handleEdit(entry as JournalEntry)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    {onDelete && entryId !== null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(entryId)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
