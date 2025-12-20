import AIMessageSection from "./AIMessageSection";
import type { AiSection, Source } from "../../../types/chat";

interface AIMessageProps {
  content: AiSection | AiSection[];
  onOpenSource: (source: Source) => void;
  onOpenNote?: (noteId: number) => void;
  onOpenCorpus?: (corpusId: number) => void;
}

export default function AIMessage({ content, onOpenSource, onOpenNote, onOpenCorpus }: AIMessageProps) {
  const aiSections = Array.isArray(content) ? content : [content];

  return (
    <div className="flex flex-col gap-default mb-default">
      {aiSections?.filter(Boolean)?.map((section, sectionIndex) => (
        <AIMessageSection
          key={`section-${sectionIndex}`}
          section={section}
          onOpenSource={onOpenSource}
          onOpenNote={onOpenNote}
          onOpenCorpus={onOpenCorpus}
        />
      ))}
    </div>
  );
}
