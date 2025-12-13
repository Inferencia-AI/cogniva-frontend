import PreviewBlock from "./PreviewBlock";
import type { PreviewBlock as PreviewBlockType } from "../../../types/chat";

interface SourcePreviewBodyProps {
  isLoading: boolean;
  blocks: PreviewBlockType[];
  error: string | null;
  html: string;
  sourceUrl?: string;
}

export default function SourcePreviewBody({ isLoading, blocks, error, html, sourceUrl }: SourcePreviewBodyProps) {
  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center text-default">Loading preview…</div>;
  }

  if (blocks.length) {
    return (
      <div className="h-full w-full overflow-y-auto p-4 flex flex-col gap-4">
        {blocks.map((block, idx) => (
          <PreviewBlock key={idx} block={block} baseUrl={sourceUrl} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="h-full w-full flex items-center justify-center px-6 text-default text-center">{error}</div>;
  }

  return (
    <iframe
      title={sourceUrl || "Source preview"}
      srcDoc={html}
      sandbox="allow-same-origin"
      className="w-full h-full bg-white"
    />
  );
}
