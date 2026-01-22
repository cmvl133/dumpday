import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TiptapEditor } from './TiptapEditor';
import { Search, Plus, Trash2, SortAsc, SortDesc, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';

interface NotesExpandedModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  currentDate?: string;
  onUpdate?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
  onAdd?: (content: string) => void;
}

type SortOrder = 'newest' | 'oldest';

export function NotesExpandedModal({
  isOpen,
  onClose,
  notes: initialNotes,
  onUpdate,
  onDelete,
  onAdd,
}: NotesExpandedModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [editContent, setEditContent] = useState('');
  const [pendingNewNote, setPendingNewNote] = useState(false);

  // Load all notes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, sortOrder]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedNote(null);
      setSearchQuery('');
      setEditContent('');
    }
  }, [isOpen]);

  const loadNotes = async () => {
    try {
      const result = await api.note.list(sortOrder);
      setNotes(result);

      // Auto-select newest note if we just added one
      if (pendingNewNote && result.length > 0 && sortOrder === 'newest') {
        setSelectedNote(result[0]);
        setEditContent(result[0].content);
        setPendingNewNote(false);
      } else if (selectedNote) {
        // If we had a selected note, try to keep it selected
        const stillExists = result.find((n) => n.id === selectedNote.id);
        if (stillExists) {
          setSelectedNote(stillExists);
          setEditContent(stillExists.content);
        }
      }
    } catch {
      // Use initial notes as fallback
      setNotes(initialNotes);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadNotes();
      return;
    }

    try {
      const result = await api.note.search(searchQuery);
      setNotes(result);
    } catch {
      // Keep current notes on error
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectNote = (note: Note) => {
    // Save current note before switching
    if (selectedNote && editContent !== selectedNote.content && selectedNote.id && onUpdate) {
      onUpdate(selectedNote.id, editContent);
    }

    setSelectedNote(note);
    setEditContent(note.content);
  };

  const handleContentChange = (content: string) => {
    setEditContent(content);
  };

  const handleBlur = () => {
    if (selectedNote && selectedNote.id && editContent !== selectedNote.content && onUpdate) {
      onUpdate(selectedNote.id, editContent);
      // Update local state
      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNote.id ? { ...n, content: editContent } : n))
      );
      setSelectedNote((prev) => (prev ? { ...prev, content: editContent } : null));
    }
  };

  const handleDeleteNote = (note: Note) => {
    if (note.id && onDelete) {
      onDelete(note.id);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      if (selectedNote?.id === note.id) {
        setSelectedNote(null);
        setEditContent('');
      }
    }
  };

  const handleAddNote = () => {
    if (onAdd) {
      setPendingNewNote(true);
      onAdd('');
      setTimeout(loadNotes, 150);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPreview = (content: string) => {
    // Strip HTML tags and get first 100 chars
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] p-0 gap-0" hideCloseButton>
        <div className="flex h-full">
          {/* Left Sidebar - Note List */}
          <div className="w-72 border-r flex flex-col h-full">
            {/* Search and controls */}
            <div className="p-3 border-b space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('notes.search')}
                    className="pl-8 h-8"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  title={t('notes.sort')}
                >
                  {sortOrder === 'newest' ? (
                    <SortDesc className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddNote}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('notes.addNote')}
              </Button>
            </div>

            {/* Note list */}
            <div className="flex-1 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery ? t('notes.noResults') : t('notes.noNotes')}
                </p>
              ) : (
                <div className="divide-y">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => handleSelectNote(note)}
                      className={cn(
                        'w-full text-left p-3 hover:bg-accent transition-colors group',
                        selectedNote?.id === note.id && 'bg-accent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {note.title && (
                            <h4 className="font-medium text-sm truncate">{note.title}</h4>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {getPreview(note.content)}
                          </p>
                          {note.createdAt && (
                            <p className="text-[10px] text-muted-foreground/70 mt-1">
                              {formatDate(note.createdAt)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold">{t('notes.title')}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Editor */}
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedNote ? (
                <TiptapEditor
                  content={editContent}
                  onChange={handleContentChange}
                  onBlur={handleBlur}
                  placeholder={t('notes.editor.placeholder')}
                  minHeight="calc(100% - 20px)"
                  className="h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>{t('notes.selectNote')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
