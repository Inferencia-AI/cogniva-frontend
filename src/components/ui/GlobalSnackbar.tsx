import { useState, useEffect, createContext, useContext, useCallback, type FC, type ReactNode } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type SnackbarType = "success" | "error" | "info" | "warning";

interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
}

interface SnackbarContextType {
  showSnackbar: (message: string, type?: SnackbarType, duration?: number) => void;
}

// =============================================================================
// Context
// =============================================================================

const SnackbarContext = createContext<SnackbarContextType | null>(null);

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

// =============================================================================
// Provider Component
// =============================================================================

interface SnackbarProviderProps {
  children: ReactNode;
}

export const SnackbarProvider: FC<SnackbarProviderProps> = ({ children }) => {
  const [snackbars, setSnackbars] = useState<SnackbarMessage[]>([]);

  const showSnackbar = useCallback(
    (message: string, type: SnackbarType = "success", duration: number = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setSnackbars((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  const removeSnackbar = useCallback((id: string) => {
    setSnackbars((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <SnackbarContainer snackbars={snackbars} onRemove={removeSnackbar} />
    </SnackbarContext.Provider>
  );
};

// =============================================================================
// Snackbar Container
// =============================================================================

interface SnackbarContainerProps {
  snackbars: SnackbarMessage[];
  onRemove: (id: string) => void;
}

const SnackbarContainer: FC<SnackbarContainerProps> = ({ snackbars, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none">
      {snackbars.map((snackbar) => (
        <SnackbarItem key={snackbar.id} snackbar={snackbar} onRemove={onRemove} />
      ))}
    </div>
  );
};

// =============================================================================
// Snackbar Item
// =============================================================================

interface SnackbarItemProps {
  snackbar: SnackbarMessage;
  onRemove: (id: string) => void;
}

const SnackbarItem: FC<SnackbarItemProps> = ({ snackbar, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, (snackbar.duration || 3000) - 300);

    const removeTimer = setTimeout(() => {
      onRemove(snackbar.id);
    }, snackbar.duration || 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [snackbar, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(snackbar.id), 300);
  };

  const iconMap: Record<SnackbarType, ReactNode> = {
    success: <CheckCircle className="size-5 text-green-400" />,
    error: <XCircle className="size-5 text-red-400" />,
    info: <Info className="size-5 text-blue-400" />,
    warning: <AlertTriangle className="size-5 text-amber-400" />,
  };

  const bgMap: Record<SnackbarType, string> = {
    success: "bg-green-500/10 border-green-500/30",
    error: "bg-red-500/10 border-red-500/30",
    info: "bg-blue-500/10 border-blue-500/30",
    warning: "bg-amber-500/10 border-amber-500/30",
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-lg
        min-w-[280px] max-w-md
        transition-all duration-300 ease-out
        ${bgMap[snackbar.type]}
        ${isExiting ? "opacity-0 translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"}
        animate-slide-up
      `}
      style={{
        background: "var(--color-secondary)",
      }}
    >
      {iconMap[snackbar.type]}
      <span className="flex-1 text-sm font-medium text-default">{snackbar.message}</span>
      <button
        onClick={handleClose}
        className="p-1 rounded-md hover:bg-default/10 transition-colors text-default/60 hover:text-default"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

// =============================================================================
// CSS Animation (add to App.css or use inline)
// =============================================================================
// @keyframes slide-up {
//   from {
//     opacity: 0;
//     transform: translateY(16px) scale(0.95);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0) scale(1);
//   }
// }
// .animate-slide-up {
//   animation: slide-up 0.3s ease-out forwards;
// }

export default SnackbarProvider;
