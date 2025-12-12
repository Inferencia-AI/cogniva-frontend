import { FileTextIcon } from "lucide-react";

interface Source {
  title?: string;
  url?: string;
  snippet?: string;
}

interface SourceCardProps {
  source: Source;
  onOpen: (source: Source) => void;
}

export default function SourceCard({ source, onOpen }: SourceCardProps) {
  const displayTitle =
    source?.title && source.title.toLowerCase() !== "no title found"
      ? source.title
      : source?.url;

  return (
    <button
      type="button"
      onClick={() => onOpen(source)}
      className="flex items-start gap-small p-default rounded-md bg-secondary/20 border border-accent/40 hover:border-accent transition text-left w-full"
      disabled={!source?.url}
    >
        <div className="p-default bg-secondary rounded-md m-2">
      <FileTextIcon className="text-accent shrink-0 " />
      </div>
      <div className="flex flex-col overflow-hidden">
        <p className="text-body font-semibold truncate">{displayTitle}</p>
        <p className="text-caption text-default/70 overflow-hidden text-ellipsis">
          {source?.snippet || source?.url}
        </p>
      </div>
    </button>
  );
}
