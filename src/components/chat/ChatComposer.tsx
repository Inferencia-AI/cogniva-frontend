import type { ChangeEvent, FC, KeyboardEvent } from "react";
import { Globe2Icon, MessageCircleCodeIcon, SendIcon } from "lucide-react";

interface ChatComposerProps {
  input: string;
  isProcessingUrl: boolean;
  isWebSearchMode: boolean;
  isSidebarOpen: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onToggleWebSearch: () => void;
}

export const ChatComposer: FC<ChatComposerProps> = ({
  input,
  isProcessingUrl,
  isWebSearchMode,
  isSidebarOpen,
  onChange,
  onSubmit,
  onToggleWebSearch,
}) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSubmit();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div
      className={`h-[8%] shadow-md border-accent rounded-md border absolute ${
        isSidebarOpen ? "bottom-0" : "sm:bottom-0 bottom-4"
      } left-0 right-0`}
    >
      <div className="p-default gap-default bg-secondary/50 rounded-md flex gap-small items-center h-full justify-between">
        <MessageCircleCodeIcon className="text-accent" />
        <input
          type="text"
          className="flex-1 text-default outline-none"
          placeholder={isWebSearchMode ? "Enter a web search query" : "Type your message..."}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <div className="flex gap-default">
          <button className="button" disabled={isProcessingUrl} onClick={onSubmit}>
            <SendIcon className="text-accent" />
          </button>
          <button
            className={`button ${isWebSearchMode ? "bg-accent/20 border border-accent" : ""}`}
            disabled={isProcessingUrl}
            onClick={onToggleWebSearch}
          >
            <Globe2Icon className={`text-accent ${isProcessingUrl ? "opacity-50" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
