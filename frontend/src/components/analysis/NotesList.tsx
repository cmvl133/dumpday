import { StickyNote } from 'lucide-react';
import type { Note } from '@/types';

interface NotesListProps {
  notes: Note[] | { content: string }[];
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Brak notatek</p>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note, index) => (
        <div
          key={'id' in note ? note.id : index}
          className="flex items-start gap-2 py-2"
        >
          <StickyNote className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm">{note.content}</p>
        </div>
      ))}
    </div>
  );
}
