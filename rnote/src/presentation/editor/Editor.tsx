import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useEditor, EditorContent, BubbleMenu, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { AnimatePresence } from 'framer-motion';
import { Bold, Italic, Strikethrough, Code } from 'lucide-react';
import type { RichDoc } from '@domain/blocks';
import { SLASH_COMMANDS, filterCommands, type SlashCommand } from './commands';
import { SlashMenu } from './SlashMenu';
import { cn } from '../lib/cn';

interface EditorProps {
  initialContent: RichDoc;
  onChange: (doc: RichDoc) => void;
  editable?: boolean;
}

interface SlashState {
  open: boolean;
  query: string;
  index: number;
  items: SlashCommand[];
  range: { from: number; to: number } | null;
  x: number;
  y: number;
}

const CLOSED: SlashState = {
  open: false,
  query: '',
  index: 0,
  items: SLASH_COMMANDS,
  range: null,
  x: 0,
  y: 0,
};

/**
 * The RNOTE block editor. Built on Tiptap/ProseMirror for a rock-solid
 * contenteditable model, with a bespoke, dependency-free "/" command menu:
 * detection reads the current text block, positioning uses ProseMirror's caret
 * coordinates, and navigation is routed through `handleKeyDown` so Enter selects
 * a block instead of leaking a newline.
 */
export function Editor({ initialContent, onChange, editable = true }: EditorProps): JSX.Element {
  const editorRef = useRef<TiptapEditor | null>(null);
  const [slash, setSlash] = useState<SlashState>(CLOSED);
  const slashRef = useRef<SlashState>(slash);
  useEffect(() => {
    slashRef.current = slash;
  }, [slash]);

  const refreshSlash = useCallback((editor: TiptapEditor) => {
    const { selection } = editor.state;
    if (!selection.empty || !selection.$from.parent.isTextblock) {
      if (slashRef.current.open) setSlash((s) => ({ ...s, open: false }));
      return;
    }
    const $from = selection.$from;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, '\n', '￼');
    const match = /(?:^|\s)\/(\w*)$/.exec(textBefore);
    if (!match) {
      if (slashRef.current.open) setSlash((s) => ({ ...s, open: false }));
      return;
    }

    const query = match[1] ?? '';
    const items = filterCommands(query);
    const from = selection.from - (query.length + 1);
    const coords = editor.view.coordsAtPos(selection.from);
    setSlash((prev) => {
      const sameQuery = prev.open && prev.query === query;
      const index = sameQuery ? Math.min(prev.index, Math.max(0, items.length - 1)) : 0;
      return { open: true, query, items, index, range: { from, to: selection.from }, x: coords.left, y: coords.bottom };
    });
  }, []);

  const choose = useCallback(
    (index: number) => {
      const editor = editorRef.current;
      const state = slashRef.current;
      const command = state.items[index];
      if (!editor || !state.range || !command) return;
      editor.chain().focus().deleteRange(state.range).run();
      command.run(editor);
      setSlash((s) => ({ ...s, open: false }));
    },
    [],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      const state = slashRef.current;
      if (!state.open || state.items.length === 0) return false;
      const count = state.items.length;
      switch (event.key) {
        case 'ArrowDown':
          setSlash((s) => ({ ...s, index: (s.index + 1) % count }));
          return true;
        case 'ArrowUp':
          setSlash((s) => ({ ...s, index: (s.index - 1 + count) % count }));
          return true;
        case 'Enter':
        case 'Tab':
          choose(state.index);
          return true;
        case 'Escape':
          setSlash((s) => ({ ...s, open: false }));
          return true;
        default:
          return false;
      }
    },
    [choose],
  );

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading' ? 'Heading' : "Write, or press '/' for commands…",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: 'focus:outline-none', spellcheck: 'true' },
      handleKeyDown: (_view, event) => handleKeyDown(event),
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON() as unknown as RichDoc);
      refreshSlash(e);
    },
    onSelectionUpdate: ({ editor: e }) => refreshSlash(e),
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <div className="rn-editor relative">
      {editor && (
        <BubbleMenu
          editor={editor}
          // zIndex 40 keeps the toolbar above the editor but below the slash
          // menu (50) and modals/command palette (60) so overlays always win.
          tippyOptions={{ duration: 120, zIndex: 40 }}
          shouldShow={({ editor: e, from, to }) => from !== to && e.isFocused && !e.isActive('codeBlock')}
          className="rn-panel flex items-center gap-0.5 p-1"
        >
          <MarkButton label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={15} />
          </MarkButton>
          <MarkButton label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={15} />
          </MarkButton>
          <MarkButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={15} />
          </MarkButton>
          <MarkButton label="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code size={15} />
          </MarkButton>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
      <AnimatePresence>
        {slash.open && (
          <SlashMenu
            items={slash.items}
            activeIndex={slash.index}
            position={{ x: slash.x, y: slash.y }}
            onSelect={choose}
            onHover={(index) => setSlash((s) => ({ ...s, index }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MarkButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      // preventDefault keeps the text selection while the mark is toggled.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
