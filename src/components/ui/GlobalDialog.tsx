import { useState, useRef, useEffect, type FC, type ReactNode, type MouseEvent } from "react";
import { GripHorizontalIcon, XIcon } from "lucide-react";

// =============================================================================
// GlobalDialog - Draggable, resizable dialog component
// =============================================================================

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export interface GlobalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  resizable?: boolean;
  draggable?: boolean;
  className?: string;
}

export const GlobalDialog: FC<GlobalDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  initialWidth = 400,
  initialHeight = 200,
  minWidth = 280,
  minHeight = 150,
  resizable = true,
  draggable = true,
  className = "",
}) => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isCentered, setIsCentered] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Center dialog on open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      setPosition({
        x: (window.innerWidth - initialWidth) / 2,
        y: (window.innerHeight - initialHeight) / 2,
      });
      setSize({ width: initialWidth, height: initialHeight });
      setIsCentered(true);
    }
  }, [isOpen, initialWidth, initialHeight]);

  // ---------------------------------------------------------------------------
  // Drag handlers
  // ---------------------------------------------------------------------------
  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    if (!draggable) return;
    if ((e.target as HTMLElement).closest("button")) return;
    
    e.preventDefault();
    setIsDragging(true);
    setIsCentered(false);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragOffset.y)),
        });
      }
      if (isResizing && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({
          width: Math.max(minWidth, e.clientX - rect.left),
          height: Math.max(minHeight, e.clientY - rect.top),
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
  }, [isDragging, isResizing, dragOffset, size, minWidth, minHeight]);

  // ---------------------------------------------------------------------------
  // Resize handler
  // ---------------------------------------------------------------------------
  const handleResizeStart = (e: MouseEvent) => {
    if (!resizable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setIsCentered(false);
  };

  // ---------------------------------------------------------------------------
  // Close on Escape key
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shouldAnimate = !isDragging && !isResizing;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={containerRef}
        className={`fixed z-50 flex flex-col bg-primary rounded-lg shadow-2xl border border-accent overflow-hidden ${
          shouldAnimate ? "transition-all duration-200 ease-out" : ""
        } ${isCentered ? "animate-zoom-in-95" : ""} ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
      >
        {/* Header - Draggable */}
        <div
          className={`flex items-center justify-between p-3 bg-secondary/50 select-none border-b border-accent ${
            draggable ? "cursor-move" : ""
          }`}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2">
            {draggable && <GripHorizontalIcon className="size-4 text-default/50" />}
            <span className="text-default text-body font-medium truncate">
              {title || "Dialog"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 rounded-md transition-all duration-200 cursor-pointer"
            title="Close"
          >
            <XIcon className="size-4 text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-3 border-t border-accent/50 bg-secondary/30">
            {footer}
          </div>
        )}

        {/* Resize Handle */}
        {resizable && (
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
    </>
  );
};

// =============================================================================
// ConfirmDialog - Pre-built confirmation dialog
// =============================================================================

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "primary";
  isLoading?: boolean;
}

export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const confirmButtonClass =
    confirmVariant === "danger"
      ? "bg-red-500 hover:bg-red-600 text-white"
      : "bg-accent hover:bg-accent/80 text-white";

  return (
    <GlobalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      initialWidth={380}
      initialHeight={180}
      minWidth={300}
      minHeight={150}
      resizable={false}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-default bg-secondary hover:bg-secondary/80 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md transition-all duration-200 cursor-pointer disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? "..." : confirmText}
          </button>
        </div>
      }
    >
      <p className="text-default text-body">{message}</p>
    </GlobalDialog>
  );
};
