import { useState } from 'react';
import { StickyNote, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Note } from '@/types';

interface NotesListProps {
  notes: Note[] | { content: string }[];
  isPreview?: boolean;
  onUpdate?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
}

export function NotesList({
  notes,
  isPreview = false,
  onUpdate,
  onDelete,
}: NotesListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Brak notatek</p>
    );
  }

  const handleEdit = (note: Note) => {
    if (note.id !== undefined) {
      setEditingId(note.id);
      setEditValue(note.content);
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
    <div className="space-y-2">
      {notes.map((note, index) => {
        const noteId = 'id' in note && note.id !== undefined ? note.id : null;
        const isEditing = noteId !== null && editingId === noteId;

        return (
          <div
            key={noteId ?? index}
            className="flex items-start gap-2 py-2 group"
          >
            <StickyNote className="h-4 w-4 text-primary mt-0.5 shrink-0" />

            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-[60px]"
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
                <p className="text-sm flex-1">{note.content}</p>

                {!isPreview && noteId !== null && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {onUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(note as Note)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    {onDelete && noteId !== null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(noteId)}
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
