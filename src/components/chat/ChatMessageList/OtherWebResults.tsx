import { useState } from "react";
import type { OtherAnswerData } from "../../../types/chat";
import SourceCard from "./SourceCard";
import { CrossIcon } from "lucide-react";

interface OtherWebResultsProps {
  data?: OtherAnswerData[];
  summary?: string;
}

export default function OtherWebResults({ data, summary }: OtherWebResultsProps) {
  if (!data?.length) return null;

  const [selected, setSelected] = useState<OtherAnswerData | null>(null);

  const handleOpen = (item: OtherAnswerData) => {
    const link = item.link || "";
    const shouldBypassDialog = /github\.com|twitter\.com|x\.com/i.test(link);

    if (shouldBypassDialog && link) {
      window.open(link, "_blank");
      return;
    }

    const images = item.data?.images?.filter(Boolean) || [];
    const texts = item.data?.texts?.filter(Boolean) || [];
    const links = item.data?.links?.filter(Boolean) || [];
    const hasDialogContent = images.length || texts.length || links.length;

    if (!hasDialogContent && link) {
      window.open(link, "_blank");
      return;
    }

    if (hasDialogContent) {
      setSelected(item);
    }
  };

  const closeDialog = () => setSelected(null);

  return (
    <div className="p-default-secondary flex flex-col gap-default">
      <p className="text-heading">Other sources</p>
      {summary ? <p className="text-body whitespace-pre-line">{summary}</p> : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-default">
        {data.map((item, index) => {
          const linkTitle = item.link || `Source ${index + 1}`;

          return (
            <div key={`other-${index}`} className="text-left w-full" onClick={() => handleOpen(item)}>
              <SourceCard source={{ title: linkTitle, url: item.link || "" }} onOpen={() => handleOpen(item)} />
            </div>
          );
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-default" role="dialog" aria-modal="true">
          <div className="bg-primary border border-accent rounded-md shadow-lg max-h-[90vh] w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between p-default border-b border-accent">
              <p className="text-heading truncate">{selected.link || "Source details"}</p>
              <button type="button" className="text-caption text-default hover:text-accent" onClick={closeDialog}>
                <CrossIcon className="transform rotate-45" />
              </button>
            </div>
            <div className="p-default flex flex-col gap-default overflow-y-auto max-h-[70vh] min-h-0">
              {selected.data?.texts?.filter(Boolean).length ? (
                <div className="flex flex-col gap-2">
                  {selected.data.texts.filter(Boolean).map((text, textIndex) => (
                    <p key={`modal-text-${textIndex}`} className="text-body whitespace-pre-line">
                      {text}
                    </p>
                  ))}
                </div>
              ) : null}

              {selected.data?.images?.filter(Boolean).length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-small">
                  {selected.data.images.filter(Boolean).map((src, imageIndex) => (
                    <img
                      key={`modal-img-${imageIndex}`}
                      src={src || ""}
                      alt={`Source image ${imageIndex + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
              ) : null}

              {selected.data?.links?.filter(Boolean).length ? (
                <div className="flex flex-wrap gap-small">
                  {selected.data.links.filter(Boolean).map((link, linkIndex) => (
                    <SourceCard
                      key={`modal-link-${linkIndex}`}
                      source={{ title: link || "", url: link || "" }}
                      onOpen={(source) => window.open(source.url, "_blank")}
                    />
                  ))}
                </div>
              ) : null}

              {!selected.data?.texts?.length && !selected.data?.images?.length && !selected.data?.links?.length && selected.link ? (
                <SourceCard source={{ title: selected.link, url: selected.link }} onOpen={(source) => window.open(source.url, "_blank")}/> 
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
