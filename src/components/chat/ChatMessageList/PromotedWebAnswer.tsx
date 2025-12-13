
import type { PromotedAnswerData } from "../../../types/chat";
import SourceCard from "./SourceCard";

interface PromotedAnswerProps {
  data?: PromotedAnswerData;
}

export default function PromotedAnswer({ data }: PromotedAnswerProps) {
  if (!data) return null;

  const images = (data.images || []).filter(Boolean);
  const [firstImage, ...restImages] = images;
  const [headingPrimary, headingBadge] = (data.heading || "").split(" - ");

  return (
    <div className="p-default ">
      <div className="flex">
        {firstImage ? <img className="size-20 rounded-md mr-default" src={firstImage} alt={data.heading} /> : null}
        <div className="flex flex-col">
          <h1 className="text-heading">
            {headingPrimary || data.heading}
            {headingBadge ? <span className="bg-amber-300 text-accent px-2 rounded-md ml-2">{headingBadge}</span> : null}
          </h1>
          <p className="text-body">{data.summary}</p>
        </div>
      </div>
      {restImages.length ? <p className="text-caption mt-default">Images</p> : null}
      <div className="flex overflow-x-auto">
        {restImages.map((imgSrc: string, imgIndex: number) => (
          <img
            key={`img-${imgIndex}`}
            src={imgSrc}
            className="size-20 rounded-md mr-default"
            alt={`Image ${imgIndex + 2}`}
          />
        ))}
      </div>
      {data.links?.length ? <p className="text-caption mt-default">Links</p> : null}
      <div className="flex overflow-x-auto">
        {data.links?.filter(Boolean).map((link: string, linkIndex: number) => (
          <div key={`link-${linkIndex}`} className="mr-4">
            <SourceCard source={{ title: link, url: link }} onOpen={(source) => window.open(source.url, "_blank")} />
          </div>
        ))}
      </div>
    </div>
  );
}
