import { useState, useEffect, useRef, type FC, type TouchEvent } from "react";
import { 
  ChevronDownIcon, 
  SaveIcon, 
  XIcon
} from "lucide-react";
import { useNotesContext } from "../../context/NotesContext";
import { WysiwygEditor, type WysiwygEditorRef } from "./WysiwygEditor";

// =============================================================================
// MobileNoteEditor - Bottom split-screen note editor for mobile
// =============================================================================

const MIN_HEIGHT = 150;
const MAX_HEIGHT_RATIO = 0.85;

export const MobileNoteEditor: FC = () => {
  const { activeNote, noteEditorOpen, closeNoteEditor, updateNote, pendingContent, clearPendingContent } =
    useNotesContext();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [height, setHeight] = useState(window.innerHeight * 0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);

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
  // Manual save
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    if (!activeNote) return;
    setIsSaving(true);
    await updateNote(activeNote.id, title, body);
    setIsSaving(false);
  };

  // ---------------------------------------------------------------------------
  // Touch drag handlers for resizing
  // ---------------------------------------------------------------------------
  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(height);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const deltaY = startY - e.touches[0].clientY;
    const newHeight = Math.min(
      window.innerHeight * MAX_HEIGHT_RATIO,
      Math.max(MIN_HEIGHT, startHeight + deltaY)
    );
    setHeight(newHeight);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!noteEditorOpen || !activeNote) return null;

  return (
    <div 
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary border-t border-accent rounded-t-xl shadow-2xl flex flex-col animate-slide-in-from-bottom"
      style={{ height: `${height}px` }}
    >
      {/* Handle bar for dragging */}
      <div 
        className="flex justify-center py-3 cursor-ns-resize touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-accent/50 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 border-b border-accent/50">
        <div className="flex items-center gap-2">
          <ChevronDownIcon className="size-4 text-default/50" />
          <span className="text-default text-caption truncate max-w-[150px]">
            {title || "Untitled"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isSaving && (
            <span className="text-accent text-caption mr-2 animate-pulse">Saving...</span>
          )}
          <button
            onClick={handleSave}
            className="p-2 hover:bg-accent/20 rounded-md transition-all duration-200 cursor-pointer"
            title="Save"
          >
            <SaveIcon className="size-5 text-accent" />
          </button>
          <button
            onClick={closeNoteEditor}
            className="p-2 hover:bg-red-500/20 rounded-md transition-all duration-200 cursor-pointer"
            title="Close"
          >
            <XIcon className="size-5 text-red-500" />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div className="px-4 py-2 border-b border-accent/50">
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
    </div>
  );
};
