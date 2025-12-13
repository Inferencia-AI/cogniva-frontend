import SourcePreviewHeader from "./SourcePreviewHeader";
import SourcePreviewBody from "./SourcePreviewBody";
import { useSourcePreview } from "./useSourcePreview";
import type { Source } from "../../../types/chat";

interface SourcePreviewProps {
  source: Source | null;
  onClose: () => void;
}

export default function SourcePreview({ source, onClose }: SourcePreviewProps) {
  const { previewHtml, previewBlocks, isPreviewLoading, previewError } = useSourcePreview(source);

  const handleOpenNewTab = (url?: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm">
      <SourcePreviewHeader source={source} onClose={onClose} onOpenNewTab={handleOpenNewTab} />
      <div className="flex-1 m-4 bg-primary border border-accent/20 rounded-lg overflow-hidden min-h-0">
        <SourcePreviewBody
          isLoading={isPreviewLoading}
          blocks={previewBlocks}
          error={previewError}
          html={previewHtml}
          sourceUrl={source?.url}
        />
      </div>
    </div>
  );
}
