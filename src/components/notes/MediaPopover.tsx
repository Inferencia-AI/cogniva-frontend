import { useState, useRef, useEffect } from "react";
import { ImageIcon, SmileIcon, XIcon, LinkIcon } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import "./wysiwyg.css"; // For emoji picker theme styles

// =============================================================================
// MediaPopover - Popover for inserting emojis and images
// =============================================================================

interface MediaPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertEmoji: (emoji: string) => void;
  onInsertImage: (url: string) => void;
  anchorPosition: { x: number; y: number };
}

type PopoverMode = "menu" | "emoji" | "image";

interface EmojiData {
  native: string;
  id: string;
  name: string;
  unified: string;
}

export default function MediaPopover({
  isOpen,
  onClose,
  onInsertEmoji,
  onInsertImage,
  anchorPosition,
}: MediaPopoverProps) {
  const [mode, setMode] = useState<PopoverMode>("menu");
  const [imageUrl, setImageUrl] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset mode when closed
  useEffect(() => {
    if (!isOpen) {
      setMode("menu");
      setImageUrl("");
    }
  }, [isOpen]);

  // Focus input when switching to image mode
  useEffect(() => {
    if (mode === "image" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode !== "menu") {
          setMode("menu");
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, mode, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Delay to prevent immediate close on button click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 100);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiSelect = (emoji: EmojiData) => {
    onInsertEmoji(emoji.native);
    onClose();
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onInsertImage(imageUrl.trim());
      onClose();
    }
  };

  // Calculate position (above the anchor, centered)
  const popoverStyle: React.CSSProperties = {
    position: "fixed",
    left: `${Math.min(Math.max(anchorPosition.x, 180), window.innerWidth - 180)}px`,
    bottom: `${window.innerHeight - anchorPosition.y + 10}px`,
    transform: "translateX(-50%)",
    zIndex: 100,
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popover */}
      <div ref={popoverRef} style={popoverStyle} className="z-50 animate-fade-in">
        {mode === "menu" && (
          <div className="bg-primary rounded-xl shadow-2xl border border-secondary/50 overflow-hidden">
            <div className="flex items-center gap-1 p-2">
              <button
                onClick={() => setMode("emoji")}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-primary/50 rounded-lg transition-all duration-200 cursor-pointer group"
                title="Insert Emoji"
              >
                <SmileIcon className="size-5 text-default group-hover:text-white group-hover:scale-110 transition-all" />
                <span className="text-sm text-default group-hover:text-white">Emoji</span>
              </button>

              <div className="w-px h-8 bg-secondary/50" />

              <button
                onClick={() => setMode("image")}
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-primary/50 rounded-lg transition-all duration-200 cursor-pointer group"
                title="Insert Image"
              >
                <ImageIcon className="size-5 text-default group-hover:text-white group-hover:scale-110 transition-all" />
                <span className="text-sm text-default group-hover:text-white">Image</span>
              </button>
            </div>

            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
            </div>
          </div>
        )}

        {mode === "emoji" && (
          <div className="bg-primary rounded-xl shadow-2xl border border-secondary/50 overflow-hidden">
            {/* Header with back button */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-secondary/30">
              <button
                onClick={() => setMode("menu")}
                className="text-xs text-default/70 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-xs text-default/60">Select Emoji</span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-secondary/30 rounded-md transition-colors cursor-pointer"
              >
                <XIcon className="size-4 text-default/50 hover:text-white" />
              </button>
            </div>

            {/* Emoji Picker - Custom themed */}
            <div className="emoji-picker-wrapper">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                navPosition="bottom"
                perLine={8}
                emojiSize={28}
                emojiButtonSize={36}
                set="native"
                maxFrequentRows={2}
              />
            </div>
          </div>
        )}

        {mode === "image" && (
          <div className="bg-primary rounded-xl shadow-2xl border border-secondary/50 overflow-hidden min-w-[320px]">
            {/* Header with back button */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-secondary/30">
              <button
                onClick={() => setMode("menu")}
                className="text-xs text-default/70 hover:text-white transition-colors cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-xs text-default/60">Insert Image URL</span>
              <button
                onClick={onClose}
                className="p-1 hover:bg-secondary/30 rounded-md transition-colors cursor-pointer"
              >
                <XIcon className="size-4 text-default/50 hover:text-white" />
              </button>
            </div>

            {/* Image URL Form */}
            <form onSubmit={handleImageSubmit} className="p-3">
              <div className="flex items-center gap-2 bg-secondary/60 rounded-lg border border-secondary/30 px-3 py-2 focus-within:border-secondary/60 transition-colors">
                <LinkIcon className="size-4 text-default/50" />
                <input
                  ref={inputRef}
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="flex-1 bg-transparent text-sm text-default placeholder:text-default/40 outline-none"
                />
              </div>

              <div className="flex justify-end mt-3 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-default/70 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!imageUrl.trim()}
                  className="px-4 py-1.5 text-xs bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert
                </button>
              </div>
            </form>

            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
