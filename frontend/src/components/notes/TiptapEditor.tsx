import { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useTranslation } from 'react-i18next';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: string;
  onChange?: (content: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  editable?: boolean;
  showToolbar?: boolean;
  className?: string;
  minHeight?: string;
}

export function TiptapEditor({
  content,
  onChange,
  onBlur,
  placeholder,
  editable = true,
  showToolbar = true,
  className,
  minHeight = '100px',
}: TiptapEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || t('notes.editor.placeholder'),
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground',
          'prose-a:text-primary prose-code:text-primary',
          'prose-ul:text-foreground prose-ol:text-foreground',
          'prose-li:marker:text-muted-foreground'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {showToolbar && editable && (
        <div className="flex items-center gap-0.5 p-1 border-b bg-muted/30 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('bold') && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title={t('notes.editor.bold')}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('italic') && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title={t('notes.editor.italic')}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('heading', { level: 1 }) && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title={t('notes.editor.heading')}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('heading', { level: 2 }) && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title={t('notes.editor.heading')}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('bulletList') && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title={t('notes.editor.bulletList')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('orderedList') && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title={t('notes.editor.numberedList')}
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('link') && 'bg-accent'
            )}
            onClick={setLink}
            title={t('notes.editor.link')}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7',
              editor.isActive('code') && 'bg-accent'
            )}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Code"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          'p-3',
          !editable && 'cursor-default'
        )}
      />
    </div>
  );
}
