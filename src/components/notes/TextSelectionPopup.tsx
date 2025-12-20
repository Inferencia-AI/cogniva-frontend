import { useState, useEffect, useCallback, type FC } from "react";
import { CopyIcon, StickyNoteIcon, XIcon } from "lucide-react";
import { useNotesContext } from "../../context/NotesContext";

// =============================================================================
// TextSelectionPopup - Popup for selected text with copy and add to notes
// =============================================================================

interface PopupPosition {
  x: number;
  y: number;
}

export const TextSelectionPopup: FC = () => {
  const { addTextToActiveNote } = useNotesContext();
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // Handle text selection
  // ---------------------------------------------------------------------------
  const handleSelection = useCallback((e: Event) => {
    // Don't interfere with input/textarea focus
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        // Position popup above the selection
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
        });
        setSelectedText(text);
      }
    } else {
      setPosition(null);
      setSelectedText("");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Close popup
  // ---------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    setPosition(null);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }, []);

  // ---------------------------------------------------------------------------
  // Copy to clipboard
  // ---------------------------------------------------------------------------
  const handleCopy = useCallback(async () => {
    if (!selectedText) return;
    
    try {
      await navigator.clipboard.writeText(selectedText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, [selectedText]);

  // ---------------------------------------------------------------------------
  // Add to notes
  // ---------------------------------------------------------------------------
  const handleAddToNotes = useCallback(async () => {
    if (!selectedText) return;
    
    await addTextToActiveNote(selectedText);
    handleClose();
  }, [selectedText, addTextToActiveNote, handleClose]);

  // ---------------------------------------------------------------------------
  // Listen for selection changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);

    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, [handleSelection]);

  // ---------------------------------------------------------------------------
  // Close on click outside
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking on inputs/textareas
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (!target.closest(".text-selection-popup")) {
        // Small delay to allow selection to complete
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection?.toString().trim()) {
            handleClose();
          }
        }, 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClose]);

  if (!position || !selectedText) return null;

  return (
    <div
      className="text-selection-popup fixed z-50 transform -translate-x-1/2 -translate-y-full animate-fade-in"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="flex items-center gap-1 bg-secondary rounded-md shadow-lg border border-accent p-1">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="p-2 hover:bg-primary/50 rounded-md transition-all duration-200 cursor-pointer"
          title="Close"
        >
          <XIcon className="size-4 text-red-400" />
        </button>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="p-2 hover:bg-primary/50 rounded-md transition-all duration-200 cursor-pointer relative"
          title="Copy"
        >
          <CopyIcon className="size-4 text-accent" />
          {showCopied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-2 py-1 rounded whitespace-nowrap animate-fade-in">
              Copied!
            </span>
          )}
        </button>

        {/* Add to notes button */}
        <button
          onClick={handleAddToNotes}
          className="p-2 hover:bg-primary/50 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-1"
          title="Add to Notes"
        >
          <StickyNoteIcon className="size-4 text-accent" />
          <span className="text-caption text-default hidden sm:inline">Add to Notes</span>
        </button>
      </div>

      {/* Arrow pointing down */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-secondary" />
      </div>
    </div>
  );
};
