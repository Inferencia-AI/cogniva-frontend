import { MessageCircleCodeIcon } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="typing-indicator flex items-center gap-small">
      <MessageCircleCodeIcon className="text-accent" />
      <div className="flex items-center gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span className="text-caption text-default">Cogniva Responding</span>
    </div>
  );
}
