import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Tag as TagIcon, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createTag, deleteTag } from '@/store/tagSlice';
import { cn } from '@/lib/utils';
import type { RootState, AppDispatch } from '@/store';
import type { Tag } from '@/types';

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tagIds: number[]) => void;
}

const TAG_COLORS = [
  '#ff2d7a', // pink
  '#00d4ff', // cyan
  '#00ff88', // green
  '#ffee00', // yellow
  '#ff6b35', // orange
  '#9d4edd', // purple
  '#ff006e', // hot pink
  '#3a86ff', // blue
];

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const tags = useSelector((state: RootState) => state.tags.tags);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Safety check - ensure selectedTags is always an array
  const safeTags = Array.isArray(selectedTags) ? selectedTags : [];
  const selectedTagIds = safeTags.map((t) => t.id);

  const toggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const removeTagFromTask = (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onTagsChange(selectedTagIds.filter((id) => id !== tagId));
  };

  const handleDeleteTag = async (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deleteConfirmId === tagId) {
      // Confirmed - delete the tag
      try {
        await dispatch(deleteTag(tagId)).unwrap();
        // Also remove from current selection if present
        if (selectedTagIds.includes(tagId)) {
          onTagsChange(selectedTagIds.filter((id) => id !== tagId));
        }
      } catch {
        // Error handling
      }
      setDeleteConfirmId(null);
    } else {
      // First click - show confirmation
      setDeleteConfirmId(tagId);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const result = await dispatch(createTag({ name: newTagName.trim(), color: newTagColor })).unwrap();
      onTagsChange([...selectedTagIds, result.id]);
      setNewTagName('');
      setShowCreateForm(false);
    } catch {
      // Error handling could be added here
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setDeleteConfirmId(null);
    }}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <TagIcon className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {/* Selected tags section */}
          {safeTags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">{t('tags.title')}</span>
              <div className="flex flex-wrap gap-1.5">
                {safeTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={(e) => removeTagFromTask(tag.id, e)}
                    className="group flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: tag.color,
                      color: getContrastColor(tag.color),
                      boxShadow: `0 0 8px ${tag.color}60`,
                    }}
                  >
                    {tag.name}
                    <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available tags */}
          {tags.length > 0 && (
            <div className="space-y-1.5">
              {safeTags.length > 0 && (
                <span className="text-xs text-muted-foreground">{t('tags.addTag')}</span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {tags
                  .filter((tag) => !selectedTagIds.includes(tag.id))
                  .map((tag) => (
                    <div key={tag.id} className="group relative flex items-center">
                      <button
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105 hover:opacity-100",
                          deleteConfirmId === tag.id ? "opacity-30" : "opacity-50"
                        )}
                        style={{
                          backgroundColor: `${tag.color}30`,
                          color: tag.color,
                          border: `1px solid ${tag.color}50`,
                        }}
                      >
                        {tag.name}
                      </button>
                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTag(tag.id, e)}
                        className={cn(
                          "absolute -right-1 -top-1 w-4 h-4 rounded-full flex items-center justify-center transition-all",
                          deleteConfirmId === tag.id
                            ? "bg-destructive text-destructive-foreground scale-110"
                            : "bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                        )}
                        title={deleteConfirmId === tag.id ? t('common.confirm') : t('tags.deleteTag')}
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
              </div>
              {deleteConfirmId && (
                <p className="text-[10px] text-destructive">{t('tags.deleteConfirm')}</p>
              )}
            </div>
          )}

          {tags.length === 0 && !showCreateForm && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t('tags.noTags')}
            </p>
          )}

          {/* Create new tag */}
          {showCreateForm ? (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <Input
                placeholder={t('tags.tagName')}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') setShowCreateForm(false);
                }}
                autoFocus
                className="h-8 text-sm"
              />
              <div className="flex gap-1.5 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full transition-all',
                      newTagColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                        : 'hover:scale-110 opacity-70 hover:opacity-100'
                    )}
                    style={{
                      backgroundColor: color,
                      boxShadow: newTagColor === color ? `0 0 10px ${color}` : 'none',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="flex-1 h-7 text-xs"
                >
                  {t('tags.createTag')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTagName('');
                  }}
                  className="h-7 text-xs"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('tags.createTag')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Helper to get contrasting text color
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
