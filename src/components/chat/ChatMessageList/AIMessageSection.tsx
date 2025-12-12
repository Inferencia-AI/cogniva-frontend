import ImageGallery from "./ImageGallery";
import AIResponseContent from "./AIResponseContent";
import CaptchaFrame from "./CaptchaFrame";
import SourcesGrid from "./SourcesGrid";
import PromotedAnswer from "./PromotedWebAnswer";
import WikipediaAnswer from "./WikipediaAnswer";
import DuckDuckGoAnswer from "./DuckDuckGoAnswer";
import OtherWebResults from "./OtherWebResults";
import type { AiSection } from "../../../types/chat";

interface Source {
  title?: string;
  url?: string;
  snippet?: string;
}

interface AIMessageSectionProps {
  section: AiSection;
  onOpenSource: (source: Source) => void;
}

export default function AIMessageSection({ section, onOpenSource }: AIMessageSectionProps) {
  const imageGallery = Array.isArray(section?.images) ? section.images.filter(Boolean) : [];

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

  return (
    <div className="mt-auto p-default flex flex-col gap-small">
      {section?.topic ? <p className="text-heading">{section.topic}</p> : null}
      <AIResponseContent section={section} />
      <CaptchaFrame url={section?.captchaUrl} />
      <SourcesGrid sources={section?.sources} onOpenSource={onOpenSource} />
      {section?.date ? <p className="text-caption"> {section?.date} </p> : null}
      <ImageGallery images={imageGallery} />
    </div>
  );
}
