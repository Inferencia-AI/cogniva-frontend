import { useRef, useEffect, useState, useCallback } from "react";
import { TypingIndicator } from "./TypingIndicator";
import HumanMessage from "./ChatMessageList/HumanMessage";
import AIMessage from "./ChatMessageList/AIMessage";
import SourcePreview from "./ChatMessageList/SourcePreview";
import { useNotesContext } from "../../context/NotesContext";
import type { ChatMessage, Source } from "../../types/chat";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isReplying: boolean;
}

export default function ChatMessageList({ messages, isReplying }: ChatMessageListProps) {
  const [previewSource, setPreviewSource] = useState<Source | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const { notes, openNoteEditor } = useNotesContext();

  const handleOpenSource = (source: Source) => {
    if (!source?.url) return;
    setPreviewSource(source);
  };

  const handleClosePreview = () => {
    setPreviewSource(null);
  };

  const handleOpenNote = useCallback((noteId: number) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      openNoteEditor(note);
    }
  }, [notes, openNoteEditor]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, isReplying]);

  return (
    <>
      <div
        ref={messagesContainerRef}
        className="flex flex-col h-[90%] overflow-y-auto absolute top-0 left-0 right-0"
      >
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            if (msg?.role === "human") {
              return <HumanMessage key={`msg-${index}`} content={typeof msg.content === "string" ? msg.content : ""} />;
            }

            return <AIMessage key={`msg-${index}`} content={Array.isArray(msg.content) ? msg.content : []} onOpenSource={handleOpenSource} onOpenNote={handleOpenNote} />;
          })
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-default text-heading">Welcome to Cogniva Chat!</p>
            <p className="text-default/50 text-body">Start a new chat by typing a message below.</p>
          </div>
        )}
        {messages.length > 0 && isReplying ? (
          <div className="mb-default">
            <TypingIndicator />
          </div>
        ) : null}
      </div>

      <SourcePreview source={previewSource} onClose={handleClosePreview} />
    </>
  );
}
