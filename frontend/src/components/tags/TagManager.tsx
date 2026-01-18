import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Tag as TagIcon, Pencil, Trash2, Plus, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagBadge } from './TagBadge';
import { createTag, updateTag, deleteTag } from '@/store/tagSlice';
import { cn } from '@/lib/utils';
import type { RootState, AppDispatch } from '@/store';
import type { Tag } from '@/types';

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

interface EditingTag {
  id: number;
  name: string;
  color: string;
}

export function TagManager() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const tags = useSelector((state: RootState) => state.tags.tags);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<EditingTag | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await dispatch(createTag({ name: newTagName.trim(), color: newTagColor })).unwrap();
      setNewTagName('');
      setShowCreateForm(false);
    } catch {
      // Error handling could be added here
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTag({ id: tag.id, name: tag.name, color: tag.color });
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editingTag.name.trim()) return;

    try {
      await dispatch(
        updateTag({
          id: editingTag.id,
          data: { name: editingTag.name.trim(), color: editingTag.color },
        })
      ).unwrap();
      setEditingTag(null);
    } catch {
      // Error handling could be added here
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
  };

  const handleDeleteTag = async (id: number) => {
    try {
      await dispatch(deleteTag(id)).unwrap();
      setDeleteConfirmId(null);
    } catch {
      // Error handling could be added here
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TagIcon className="h-4 w-4" />
          {t('tags.manageTags')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            {t('tags.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {tags.length === 0 && !showCreateForm && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('tags.noTags')}
            </p>
          )}

          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2">
              {editingTag?.id === tag.id ? (
                // Edit mode
                <div className="flex-1 space-y-2">
                  <Input
                    value={editingTag.name}
                    onChange={(e) =>
                      setEditingTag({ ...editingTag, name: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                    className="h-8"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setEditingTag({ ...editingTag, color })
                        }
                        className={cn(
                          'w-6 h-6 rounded-full transition-all',
                          editingTag.color === color
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-white'
                            : 'hover:scale-110'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      className="h-7"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {t('common.save')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-7"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : deleteConfirmId === tag.id ? (
                // Delete confirmation
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t('tags.deleteConfirm')}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTag(tag.id)}
                      className="h-7"
                    >
                      {t('tags.deleteTag')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirmId(null)}
                      className="h-7"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <>
                  <TagBadge tag={tag} size="md" />
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleStartEdit(tag)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteConfirmId(tag.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {showCreateForm ? (
            <div className="space-y-2 pt-2 border-t">
              <Input
                placeholder={t('tags.tagName')}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag();
                  if (e.key === 'Escape') setShowCreateForm(false);
                }}
                autoFocus
                className="h-8"
              />
              <div className="flex gap-1 flex-wrap">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTagColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-full transition-all',
                      newTagColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-white'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  className="h-7"
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
                  className="h-7"
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('tags.addTag')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
