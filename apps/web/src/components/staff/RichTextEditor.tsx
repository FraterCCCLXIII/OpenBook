import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  /** Tailwind min-height class for the editable area, e.g. "min-h-[80px]" */
  minHeightClass?: string;
};

export function RichTextEditor({ value, onChange, minHeightClass = 'min-h-[80px]' }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: `${minHeightClass} px-3 py-2 text-sm text-zinc-100 outline-none focus:outline-none`,
      },
    },
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded p-1 transition-colors ${
      active
        ? 'bg-zinc-600 text-zinc-100'
        : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
    }`;

  const sep = <div className="mx-1 h-4 w-px bg-zinc-700" />;

  return (
    <div className="tiptap-dark overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 ring-emerald-500/50 focus-within:ring-2">
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-zinc-700 bg-zinc-900 px-2 py-1"
      >
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}
          title="Bold"
          aria-pressed={editor.isActive('bold')}
        >
          <Bold className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}
          title="Italic"
          aria-pressed={editor.isActive('italic')}
        >
          <Italic className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn(editor.isActive('strike'))}
          title="Strikethrough"
          aria-pressed={editor.isActive('strike')}
        >
          <Strikethrough className="h-3.5 w-3.5" aria-hidden />
        </button>

        {sep}

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btn(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
          aria-pressed={editor.isActive('heading', { level: 3 })}
        >
          <Heading3 className="h-3.5 w-3.5" aria-hidden />
        </button>

        {sep}

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))}
          title="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
        >
          <List className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))}
          title="Ordered list"
          aria-pressed={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-3.5 w-3.5" aria-hidden />
        </button>

        {sep}

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive('blockquote'))}
          title="Blockquote"
          aria-pressed={editor.isActive('blockquote')}
        >
          <Quote className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btn(false)}
          title="Horizontal rule"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
