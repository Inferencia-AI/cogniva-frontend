import { useCallback, useEffect, useState } from "react";
import api from "../../../utils/api";
import type { Source, PreviewBlock } from "../../../types/chat";

export function useSourcePreview(source: Source | null) {
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewBlocks, setPreviewBlocks] = useState<PreviewBlock[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!source?.url) return;

    setPreviewHtml("");
    setPreviewBlocks([]);
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      const { data } = await api.get("/scrap-url", { params: { url: source.url } });
      const rawHtml = typeof data?.html === "string" ? data.html : "";
      const fallback = typeof data?.description === "string" ? `<p class="p-4 text-body">${data.description}</p>` : "";

      if (rawHtml) {
        try {
          const { data: summary } = await api.post("/summarize-html", { htmlContent: rawHtml });
          const blocks = Array.isArray(summary) ? summary.filter(Boolean) : [];
          if (blocks.length) {
            setPreviewBlocks(blocks);
          } else {
            setPreviewHtml(rawHtml);
          }
        } catch (summaryError) {
          console.error("Error summarizing source preview:", summaryError);
          setPreviewHtml(rawHtml);
          setPreviewError("Unable to summarize. Showing raw preview.");
        }
      } else {
        setPreviewHtml(fallback || '<p class="p-4 text-body">No preview content available.</p>');
      }
    } catch (error) {
      console.error("Error fetching source preview:", error);
      setPreviewError("Unable to load preview. Use the Open page link.");
    } finally {
      setIsPreviewLoading(false);
    }
  }, [source?.url]);

  useEffect(() => {
    if (source?.url) {
      loadPreview();
    }
  }, [source?.url, loadPreview]);

  return { previewHtml, previewBlocks, isPreviewLoading, previewError, loadPreview };
}
