import AIMessageSection from "./AIMessageSection";
import type { AiSection } from "../../../types/chat";

interface Source {
  title?: string;
  url?: string;
  snippet?: string;
}

interface AIMessageProps {
  content: AiSection | AiSection[];
  onOpenSource: (source: Source) => void;
}

export default function AIMessage({ content, onOpenSource }: AIMessageProps) {
  const aiSections = Array.isArray(content) ? content : [content];

  return (
    <div className="flex flex-col gap-default mb-default">
      {aiSections?.filter(Boolean)?.map((section: any, sectionIndex: number) => (
        <AIMessageSection
          key={`section-${sectionIndex}`}
          section={section}
          onOpenSource={onOpenSource}
        />
      ))}
    </div>
  );
}
