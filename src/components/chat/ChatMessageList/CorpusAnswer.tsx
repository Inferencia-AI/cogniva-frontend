import { LibraryIcon, ExternalLinkIcon } from "lucide-react";
import type { CorpusAnswerData } from "../../../types/chat";

interface CorpusAnswerProps {
  corpus?: CorpusAnswerData[];
  onOpenCorpus?: (corpusId: number) => void;
}

/**
 * Strip HTML tags from a string
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function CorpusAnswer({ corpus, onOpenCorpus }: CorpusAnswerProps) {
  if (!corpus?.length) return null;

  return (
    <div className="p-default flex flex-col gap-default">
      <div className="flex items-center gap-small">
        <LibraryIcon className="text-accent" size={20} />
        <p className="text-heading font-semibold">From Your Knowledgebases</p>
      </div>
      
      <div className="flex flex-col gap-small">
        {corpus.map((item) => (
          <button
            key={item.corpusId}
            type="button"
            onClick={() => onOpenCorpus?.(item.corpusId)}
            className="flex flex-col gap-small p-default rounded-md bg-secondary/30 border border-accent/40 hover:border-accent hover:bg-secondary/50 transition text-left w-full group"
          >
            <div className="flex items-start gap-small">
              <LibraryIcon className="text-accent shrink-0 mt-1" size={16} />
              <div className="flex flex-col overflow-hidden flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-body font-semibold">{item.title || "Untitled"}</p>
                  <ExternalLinkIcon 
                    className="text-default/30 group-hover:text-accent shrink-0 transition-colors" 
                    size={14} 
                  />
                </div>
                <p className="text-caption text-accent/70 mb-1">
                  {item.knowledgebaseName}
                </p>
                <p className="text-caption text-default/70 line-clamp-3">
                  {stripHtmlTags(item.body || "").slice(0, 200) || "No content"}
                  {stripHtmlTags(item.body || "").length > 200 ? "..." : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-small text-caption text-default/50">
              <div className="flex items-center gap-2">
                {item.keywords?.slice(0, 3).map((keyword, idx) => (
                  <span 
                    key={idx}
                    className="px-1.5 py-0.5 bg-accent/10 text-accent/80 rounded text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <span>Relevance: {Math.round(item.similarity * 100)}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
