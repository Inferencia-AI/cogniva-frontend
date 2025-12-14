import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useEffect, forwardRef, useImperativeHandle, useState } from "react";
import {
  BoldIcon,
  ItalicIcon,
  Heading1Icon,
  Heading2Icon,
  ListIcon,
  ListOrderedIcon,
  CodeIcon,
  QuoteIcon,
  ImageIcon,
} from "lucide-react";
import MediaPopover from "./MediaPopover";
import "./wysiwyg.css";

// =============================================================================
// WysiwygEditor - Notion-like live markdown editor using Tiptap
// =============================================================================

interface WysiwygEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export interface WysiwygEditorRef {
  getMarkdown: () => string;
  setContent: (content: string) => void;
  insertImage: (src: string, alt?: string) => void;
}

// Toolbar button component
const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-accent/30 text-accent"
        : "hover:bg-accent/20 text-default/50 hover:text-accent"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

// Toolbar component
const EditorToolbar = ({ editor }: { editor: Editor | null }) => {
  const [mediaPopover, setMediaPopover] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  if (!editor) return null;

  const handleMediaButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMediaPopover({
      isOpen: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top,
      },
    });
  };

  const handleInsertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  const handleInsertImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="flex items-center gap-0.5 p-2 border-t border-accent/50 bg-secondary/30 flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (Ctrl+B)"
      >
        <BoldIcon className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (Ctrl+I)"
      >
        <ItalicIcon className="size-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-accent/30 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        <Heading1Icon className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        <Heading2Icon className="size-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-accent/30 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <ListIcon className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrderedIcon className="size-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-accent/30 mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <CodeIcon className="size-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <QuoteIcon className="size-4" />
      </ToolbarButton>

      <div className="w-px h-5 bg-accent/30 mx-1" />

      <ToolbarButton
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMediaButtonClick(e)}
        title="Insert Emoji or Image"
      >
        <ImageIcon className="size-4" />
      </ToolbarButton>

      <div className="flex-1" />

      {/* Media Popover */}
      <MediaPopover
        isOpen={mediaPopover.isOpen}
        onClose={() => setMediaPopover({ isOpen: false, position: { x: 0, y: 0 } })}
        onInsertEmoji={handleInsertEmoji}
        onInsertImage={handleInsertImage}
        anchorPosition={mediaPopover.position}
      />
    </div>
  );
};

export const WysiwygEditor = forwardRef<WysiwygEditorRef, WysiwygEditorProps>(
  ({ content, onChange, placeholder = "Start writing...", className = "" }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          codeBlock: {
            HTMLAttributes: {
              class: "bg-secondary/50 rounded-lg p-3 font-mono text-sm",
            },
          },
          blockquote: {
            HTMLAttributes: {
              class: "border-l-4 border-accent pl-4 italic text-default/70",
            },
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: "is-editor-empty",
        }),
        Image.configure({
          HTMLAttributes: {
            class: "rounded-lg max-w-full h-auto my-2",
          },
          allowBase64: true,
        }),
      ],
      content: content || "",
      onUpdate: ({ editor }) => {
        // Get HTML content and convert to markdown-ish format for storage
        const html = editor.getHTML();
        onChange(html);
      },
      editorProps: {
        attributes: {
          class: `prose prose-invert max-w-none focus:outline-none min-h-full ${className}`,
        },
      },
    });

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => editor?.getHTML() || "",
      setContent: (newContent: string) => {
        editor?.commands.setContent(newContent);
      },
      insertImage: (src: string, alt?: string) => {
        editor?.chain().focus().setImage({ src, alt }).run();
      },
    }));

    // Update content when prop changes (e.g., when switching notes)
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content || "");
      }
    }, [content, editor]);

    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-3 overflow-auto">
          <EditorContent editor={editor} className="h-full" />
        </div>
        <EditorToolbar editor={editor} />
      </div>
    );
  }
);

WysiwygEditor.displayName = "WysiwygEditor";
