import { Heart } from 'lucide-react';
import type { JournalEntry } from '@/types';

interface JournalSectionProps {
  entries: JournalEntry[] | { content: string }[];
}

export function JournalSection({ entries }: JournalSectionProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Brak wpisów</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div
          key={'id' in entry ? entry.id : index}
          className="flex items-start gap-2 py-2 bg-muted/30 rounded-lg px-3"
        >
          <Heart className="h-4 w-4 text-pink-500 mt-0.5 shrink-0" />
          <p className="text-sm italic">{entry.content}</p>
        </div>
      ))}
    </div>
  );
}
