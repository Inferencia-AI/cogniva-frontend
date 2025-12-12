import SourceCard from "./SourceCard";

interface Source {
  title?: string;
  url?: string;
  snippet?: string;
}

interface SourcesGridProps {
  sources?: Source[];
  onOpenSource: (source: Source) => void;
}

export default function SourcesGrid({ sources = [], onOpenSource }: SourcesGridProps) {
  if (!Array.isArray(sources) || !sources.length) return null;

  return (
    <div className="grid sm:grid-cols-2 grid-cols-1 gap-default">
      {sources.map((source: Source, sourceIndex: number) => (
        <SourceCard key={`source-${sourceIndex}`} source={source} onOpen={onOpenSource} />
      ))}
    </div>
  );
}
