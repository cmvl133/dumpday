import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import type { RootState } from '@/store';

interface TimeBlockTagSelectorProps {
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}

const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};

export function TimeBlockTagSelector({ selectedTagIds, onChange }: TimeBlockTagSelectorProps) {
  const tags = useSelector((state: RootState) => state.tags.tags);

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No tags available</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggleTag(tag.id)}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium transition-all',
            selectedTagIds.includes(tag.id)
              ? 'opacity-100 ring-1 ring-white/50'
              : 'opacity-50 hover:opacity-100'
          )}
          style={{
            backgroundColor: tag.color,
            color: getContrastColor(tag.color),
          }}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
