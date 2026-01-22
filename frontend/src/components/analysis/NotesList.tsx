import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StickyNote, Pencil, Trash2, Check, X, Plus, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NotesExpandedModal } from '@/components/notes/NotesExpandedModal';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

interface NotesListProps {
  notes: Note[] | { content: string }[];
  currentDate?: string;
  isPreview?: boolean;
  onUpdate?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onAdd?: (content: string) => void;
}

export function NotesList({
  notes,
  currentDate = new Date().toISOString().split('T')[0],
  isPreview = false,
  onUpdate,
  onDelete,
  onAdd,
}: NotesListProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandWithNewNote, setExpandWithNewNote] = useState(false);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

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
    setNewNoteContent('');
  };

  const handleCancelAdding = () => {
    setIsAdding(false);
    setNewNoteContent('');
  };

  const handleSaveNote = () => {
    if (!newNoteContent.trim() || !onAdd) return;
    onAdd(newNoteContent.trim());
    setNewNoteContent('');
    setIsAdding(false);

    // Flash effect for newly added note
    setTimeout(() => {
      setJustAdded(notes.length);
      setTimeout(() => setJustAdded(null), 500);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveNote();
    } else if (e.key === 'Escape') {
      handleCancelAdding();
    }
  };

  const handleAddInExpanded = () => {
    setExpandWithNewNote(true);
    setIsExpanded(true);
  };

  const handleEditInExpanded = () => {
    setIsExpanded(true);
  };

  return (
    <div className="space-y-2">
      {notes.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground py-2">{t('tasks.noNotes')}</p>
      )}

      {notes.map((note, index) => {
        const noteId = 'id' in note && note.id !== undefined ? note.id : null;
        const isEditing = noteId !== null && editingId === noteId;

        return (
          <div
            key={noteId ?? index}
            className={cn(
              'flex items-start gap-2 py-2 group transition-all duration-300',
              justAdded === index && 'bg-primary/10 animate-pulse'
            )}
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
                <div
                  className="text-sm flex-1 prose prose-sm dark:prose-invert max-w-none line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />

                {!isPreview && noteId !== null && (
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    {onUpdate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditInExpanded()}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                      </Button>
                    )}
                    {onDelete && noteId !== null && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(noteId)}
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
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('tasks.notePlaceholder')}
            className="min-h-[60px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter - {t('common.save')} · Shift+Enter - {t('tasks.newLine', 'new line')} · Escape - {t('common.cancel')}
          </p>
        </div>
      )}

      {/* Add note buttons and expand */}
      {!isPreview && (
        <div className="flex gap-2 mt-2">
          {onAdd && !isAdding && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={handleStartAdding}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('notes.addQuickNote')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground hover:text-foreground"
                onClick={handleAddInExpanded}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('tasks.addNote')}
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(true)}
            title={t('notes.expand')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Expanded Modal */}
      <NotesExpandedModal
        isOpen={isExpanded}
        onClose={() => {
          setIsExpanded(false);
          setExpandWithNewNote(false);
        }}
        notes={notes.filter((n): n is Note => 'id' in n)}
        currentDate={currentDate}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAdd={onAdd}
        triggerNewNote={expandWithNewNote}
      />
    </div>
  );
}
