import type { DuckDuckGoAnswerData } from "../../../types/chat";
import SourceCard from "./SourceCard";

interface DuckDuckGoAnswerProps {
  data?: DuckDuckGoAnswerData;
}

export default function DuckDuckGoAnswer({ data }: DuckDuckGoAnswerProps) {
  if (!data || (!data.answer && !data.link)) return null;

  const link = data.link?.trim();

  return (
    <div className="p-default">
      {data.answer ? <p className="text-body whitespace-pre-line">{data.answer}</p> : null}
      {link ? (
        <div className="mt-small">
          <SourceCard source={{ title: link, url: link }} onOpen={(source) => window.open(source.url, "_blank")} />
        </div>
      ) : null}
    </div>
  );
}
