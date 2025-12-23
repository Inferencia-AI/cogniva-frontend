import { ExternalLinkIcon, XIcon } from "lucide-react";
import { useState } from "react";

interface ExpandKnowledgeButtonProps {
  answerSource: "notes" | "corpus" | "both" | "external" | null;
  onExpand: () => void;
  disabled?: boolean;
}

/**
 * Get the source name text based on the answer source
 */
function getSourceName(
  source: "notes" | "corpus" | "both" | "external" | null
): string {
  switch (source) {
    case "notes":
      return "your Notes";
    case "corpus":
      return "your Knowledgebases";
    case "both":
      return "your Notes and Knowledgebases";
    default:
      return "your knowledge sources";
  }
}

export default function ExpandKnowledgeButton({
  answerSource,
  onExpand,
  disabled,
}: ExpandKnowledgeButtonProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!answerSource || answerSource === "external" || isDismissed) return null;

  const sourceName = getSourceName(answerSource);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <div className="mt-4 p-3 bg-secondary/30 border border-accent/30 rounded-lg">
      <p className="text-body text-default/80 mb-2">
        The above answer is from{" "}
        <span className="font-semibold text-default">{sourceName}</span>.
        <br />
        Would you like me to answer outside of it?
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onExpand}
          disabled={disabled}
          className="disabled:opacity-50 disabled:cursor-not-allowed button flex items-center gap-2"
        >
          <ExternalLinkIcon size={16} />
          <span>Yes</span>
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          disabled={disabled}
          className="disabled:opacity-50 disabled:cursor-not-allowed button flex items-center gap-2"
        >
          <XIcon size={16} />
          <span>No</span>
        </button>
      </div>
    </div>
  );
}
