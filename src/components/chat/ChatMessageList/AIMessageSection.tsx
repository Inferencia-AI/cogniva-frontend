import ImageGallery from "./ImageGallery";
import AIResponseContent from "./AIResponseContent";
import CaptchaFrame from "./CaptchaFrame";
import SourcesGrid from "./SourcesGrid";
import PromotedAnswer from "./PromotedWebAnswer";
import WikipediaAnswer from "./WikipediaAnswer";
import DuckDuckGoAnswer from "./DuckDuckGoAnswer";
import OtherWebResults from "./OtherWebResults";
import ArticlesAnswer from "./ArticlesAnswer";
import NotesAnswer from "./NotesAnswer";
import CorpusAnswer from "./CorpusAnswer";
import ExpandKnowledgeButton from "./ExpandKnowledgeButton";
import type { AiSection, Source } from "../../../types/chat";

interface AIMessageSectionProps {
  section: AiSection;
  onOpenSource: (source: Source) => void;
  onOpenNote?: (noteId: number) => void;
  onOpenCorpus?: (corpusId: number) => void;
  onExpandKnowledge?: () => void;
  isReplying?: boolean;
}

export default function AIMessageSection({ section, onOpenSource, onOpenNote, onOpenCorpus, onExpandKnowledge, isReplying }: AIMessageSectionProps) {
  const imageGallery = Array.isArray(section?.images) ? section.images.filter(Boolean) : [];

  if (section?.type === "notes") {
    return <NotesAnswer notes={section.notes} onOpenNote={onOpenNote} />;
  }

  if (section?.type === "corpus") {
    return <CorpusAnswer corpus={section.corpus} onOpenCorpus={onOpenCorpus} />;
  }

  if (section?.type === "answer") {
    return (
      <div className="mt-auto p-default flex flex-col gap-small">
        {section.topic ? <p className="text-heading">{section.topic}</p> : null}
        <div className="flex">
        <img src={section.image} alt="Answer Image" className="max-w-full h-auto mr-default" />
        <AIResponseContent section={section} />
        </div>
      </div>
    );
  }

  if (section?.type === "promoted") {
    return <PromotedAnswer data={section.promoted} />;
  }

  if (section?.type === "wikipedia") {
    return <WikipediaAnswer data={section.wikipedia} />;
  }

  if (section?.type === "duckduckgo") {
    return <DuckDuckGoAnswer data={section.duckduckgo} />;
  }

  if (section?.type === "others") {
    return <OtherWebResults data={section.others} summary={typeof section.response === "string" ? section.response : undefined} />;
  }

  if (section?.type === "articles") {
    return <ArticlesAnswer articles={section.articles} />;
  }

  return (
    <div className="mt-auto p-default flex flex-col gap-small">
      {section?.topic ? <p className="text-heading">{section.topic}</p> : null}
      <AIResponseContent section={section} />
      <CaptchaFrame url={section?.captchaUrl} />
      <SourcesGrid sources={section?.sources} onOpenSource={onOpenSource} />
      {section?.date ? <p className="text-caption"> {section?.date} </p> : null}
      <ImageGallery images={imageGallery} />
      {section?.showExpandButton && onExpandKnowledge && (
        <ExpandKnowledgeButton
          answerSource={section.answerSource || null}
          onExpand={onExpandKnowledge}
          disabled={isReplying}
        />
      )}
    </div>
  );
}
