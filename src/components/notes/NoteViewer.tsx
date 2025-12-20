import { useState, useRef, useEffect, type FC, type MouseEvent } from "react";
import { GripHorizontalIcon, MaximizeIcon, XIcon, ExternalLinkIcon } from "lucide-react";
import type { Note } from "../../types/notes";
import "./wysiwyg.css";

// =============================================================================
// NoteViewer - Read-only, draggable, resizable note viewer
// Similar to NoteEditor but for viewing notes without editing capability
// =============================================================================

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const DEFAULT_SIZE: Size = { width: 450, height: 550 };
const DEFAULT_POSITION: Position = { x: 150, y: 100 };

interface NoteViewerProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInEditor?: (noteId: number) => void;
  canEdit?: boolean;
}

export const NoteViewer: FC<NoteViewerProps> = ({
  note,
  isOpen,
  onClose,
  onOpenInEditor,
  canEdit = false,
}) => {
  const [position, setPosition] = useState<Position>(DEFAULT_POSITION);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [prevState, setPrevState] = useState<{ position: Position; size: Size } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset position when opening a new note
  useEffect(() => {
    if (isOpen && note) {
      // Slightly randomize position to avoid stacking
      setPosition({
        x: DEFAULT_POSITION.x + Math.random() * 50,
        y: DEFAULT_POSITION.y + Math.random() * 50,
      });
      setSize(DEFAULT_SIZE);
      setIsMaximized(false);
    }
  }, [isOpen, note?.id]);

  // ---------------------------------------------------------------------------
  // Drag handlers
  // ---------------------------------------------------------------------------
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
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

  if (!isOpen || !note) return null;

  const shouldAnimate = !isDragging && !isResizing;

  return (
    <div
      ref={containerRef}
      className={`hidden sm:flex fixed z-40 flex-col bg-primary rounded-lg shadow-2xl border border-accent/50 overflow-hidden animate-fade-in ${
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
        className="flex items-center justify-between p-2 bg-secondary/50 cursor-move select-none border-b border-accent/50"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <GripHorizontalIcon className="size-4 text-default/50 shrink-0" />
          <span className="text-default text-caption truncate">
            {note.title || "Untitled Note"}
          </span>
          <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-xs rounded shrink-0">
            View Only
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEdit && onOpenInEditor && (
            <button
              onClick={() => onOpenInEditor(note.id)}
              className="p-1.5 hover:bg-accent/20 rounded-md transition-all duration-200 cursor-pointer"
              title="Open in Editor"
            >
              <ExternalLinkIcon className="size-4 text-accent" />
            </button>
          )}
          <button
            onClick={handleMaximize}
            className="p-1.5 hover:bg-accent/20 rounded-md transition-all duration-200 cursor-pointer"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            <MaximizeIcon className="size-4 text-accent" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 rounded-md transition-all duration-200 cursor-pointer"
            title="Close"
          >
            <XIcon className="size-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Title Display */}
      <div className="p-3 border-b border-accent/30 bg-secondary/20">
        <h2 className="text-default text-lg font-semibold">
          {note.title || "Untitled Note"}
        </h2>
      </div>

      {/* Content Display */}
      <div className="flex-1 overflow-auto p-4">
        <div
          className="tiptap prose prose-invert max-w-none text-default"
          dangerouslySetInnerHTML={{ __html: note.body || "<p class='text-default/40'>No content</p>" }}
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
