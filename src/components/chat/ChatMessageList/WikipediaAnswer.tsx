import type { WikipediaAnswerData } from "../../../types/chat";
import SourceCard from "./SourceCard";

interface WikipediaAnswerProps {
  data?: WikipediaAnswerData;
}

export default function WikipediaAnswer({ data }: WikipediaAnswerProps) {
  if (!data) return null;

  const references = data.references?.filter(Boolean) || [];

  return (
    <div className="p-default">
      {/* <p className="text-heading">{data.question || "Wikipedia"}</p> */}
      <p className="text-body whitespace-pre-line">{data.summary}</p>
      {references.length ? <p className="text-caption mt-default">References</p> : null}
      <div className="flex flex-wrap gap-small">
        {references.map((link, index) => (
          <SourceCard key={`wiki-ref-${index}`} source={{ title: link, url: link }} onOpen={(source) => window.open(source.url, "_blank")} />
        ))}
      </div>
    </div>
  );
}
