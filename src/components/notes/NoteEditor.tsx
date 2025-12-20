import { useState, useRef, useEffect, type FC, type MouseEvent } from "react";
import { 
  GripHorizontalIcon, 
  MaximizeIcon,
  XIcon, 
  SaveIcon,
} from "lucide-react";
import { useNotesContext } from "../../context/NotesContext";
import { WysiwygEditor, type WysiwygEditorRef } from "./WysiwygEditor";

// =============================================================================
// NoteEditor - Draggable, resizable note editor for desktop
// =============================================================================

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const DEFAULT_SIZE: Size = { width: 400, height: 500 };
const DEFAULT_POSITION: Position = { x: 100, y: 100 };

export const NoteEditor: FC = () => {
  const { activeNote, noteEditorOpen, closeNoteEditor, updateNote, pendingContent, clearPendingContent } =
    useNotesContext();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [prevState, setPrevState] = useState<{ position: Position; size: Size } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<WysiwygEditorRef>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastNoteIdRef = useRef<number | null>(null);
  const lastPendingTimestampRef = useRef<number | null>(null);

  // Sync local state with active note - only when switching to a different note
  useEffect(() => {
    if (activeNote && activeNote.id !== lastNoteIdRef.current) {
      setTitle(activeNote.title);
      setBody(activeNote.body || "");
      lastNoteIdRef.current = activeNote.id;
    }
  }, [activeNote]);

  // Reset ref when editor closes
  useEffect(() => {
    if (!noteEditorOpen) {
      lastNoteIdRef.current = null;
      lastPendingTimestampRef.current = null;
    }
  }, [noteEditorOpen]);

  // Handle pending content (text or image added from outside)
  useEffect(() => {
    if (pendingContent && pendingContent.timestamp !== lastPendingTimestampRef.current) {
      lastPendingTimestampRef.current = pendingContent.timestamp;
      
      if (pendingContent.type === "text") {
        // Append text to body
        const newBody = body ? `${body}<p>${pendingContent.content}</p>` : `<p>${pendingContent.content}</p>`;
        setBody(newBody);
      } else if (pendingContent.type === "image") {
        // Insert image using editor ref
        if (editorRef.current) {
          editorRef.current.insertImage(pendingContent.content);
        } else {
          // Fallback: append image HTML
          const newBody = body ? `${body}<img src="${pendingContent.content}" alt="Image" />` : `<img src="${pendingContent.content}" alt="Image" />`;
          setBody(newBody);
        }
      }
      
      clearPendingContent();
    }
  }, [pendingContent, body, clearPendingContent]);

  // Auto-save with debounce - don't update local state from response
  useEffect(() => {
    if (!activeNote || !noteEditorOpen) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (title !== activeNote.title || body !== activeNote.body) {
        setIsSaving(true);
        await updateNote(activeNote.id, title, body);
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, body, activeNote, noteEditorOpen, updateNote]);

  // ---------------------------------------------------------------------------
  // Drag handlers - only on header, not inputs
  // ---------------------------------------------------------------------------
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    // Don't start drag if clicking on buttons
    if ((e.target as HTMLElement).closest("button")) return;
    if (isMaximized) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: Math.max(0, e.clientX - dragOffset.x),
          y: Math.max(0, e.clientY - dragOffset.y),
        });
      }
      if (isResizing && containerRef.current && !isMaximized) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({
          width: Math.max(300, e.clientX - rect.left),
          height: Math.max(300, e.clientY - rect.top),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, isMaximized]);

  // ---------------------------------------------------------------------------
  // Resize handler
  // ---------------------------------------------------------------------------
  const handleResizeStart = (e: MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  // ---------------------------------------------------------------------------
  // Maximize/Restore handler
  // ---------------------------------------------------------------------------
  const handleMaximize = () => {
    if (isMaximized) {
      if (prevState) {
        setPosition(prevState.position);
        setSize(prevState.size);
      }
      setIsMaximized(false);
    } else {
      setPrevState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Manual save
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!activeNote) return;
    setIsSaving(true);
    await updateNote(activeNote.id, title, body);
    setIsSaving(false);
  };

  if (!noteEditorOpen || !activeNote) return null;

  // Only apply transitions when not dragging/resizing for smooth movement
  const shouldAnimate = !isDragging && !isResizing;

  return (
    <div
      ref={containerRef}
      className={`hidden sm:flex fixed z-40 flex-col bg-primary rounded-lg shadow-2xl border border-accent overflow-hidden ${
        shouldAnimate ? "transition-all duration-200 ease-out" : ""
      } ${isMaximized ? "rounded-none" : ""}`}
      style={
        isMaximized
          ? { left: 0, top: 0, width: "100vw", height: "100vh" }
          : {
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
            }
      }
    >
      {/* Header - Draggable */}
      <div
        className="flex items-center justify-between p-2 bg-secondary/50 cursor-move select-none border-b border-accent"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripHorizontalIcon className="size-4 text-default/50" />
          <span className="text-default text-caption truncate max-w-[200px]">
            {title || "Untitled"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isSaving && (
            <span className="text-accent text-caption mr-2 animate-pulse">Saving...</span>
          )}
          <button
            onClick={handleSave}
            className="p-1.5 hover:bg-accent/20 rounded-md transition-all duration-200 cursor-pointer"
            title="Save"
          >
            <SaveIcon className="size-4 text-accent" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 hover:bg-accent/20 rounded-md transition-all duration-200 cursor-pointer"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <MaximizeIcon className="size-4 text-accent" />
          </button>
          <button
            onClick={closeNoteEditor}
            className="p-1.5 hover:bg-red-500/20 rounded-md transition-all duration-200 cursor-pointer"
            title="Close"
          >
            <XIcon className="size-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div className="p-3 border-b border-accent/50">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full bg-transparent text-default text-body font-medium outline-none placeholder:text-default/30 focus:placeholder:text-default/50 transition-colors"
        />
      </div>

      {/* WYSIWYG Editor */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <WysiwygEditor
          ref={editorRef}
          content={body}
          onChange={setBody}
          placeholder="Start writing your note..."
        />
      </div>

      {/* Resize Handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:opacity-100 opacity-50 transition-opacity"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="w-4 h-4 text-accent"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </div>
  );
};
