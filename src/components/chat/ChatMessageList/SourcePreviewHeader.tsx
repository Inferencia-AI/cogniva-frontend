import { ArrowUpRight, X } from "lucide-react";
import type { Source } from "../../../types/chat";

interface SourcePreviewHeaderProps {
  source: Source;
  onClose: () => void;
  onOpenNewTab: (url?: string) => void;
}

export default function SourcePreviewHeader({ source, onClose, onOpenNewTab }: SourcePreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-secondary/90 border-b border-accent/30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md bg-secondary/60 hover:bg-secondary/80 border border-accent/30 text-default"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Close preview</span>
        </button>
        <div className="flex flex-col min-w-0">
          <p className="text-body font-semibold truncate">{source?.title || source?.url}</p>
          <p className="text-caption text-default/70 truncate">{source?.url}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpenNewTab(source?.url)}
        className="flex items-center gap-1 text-accent hover:underline"
      >
        <ArrowUpRight className="w-4 h-4" />
        <span className="text-body">Open page</span>
      </button>
    </div>
  );
}
