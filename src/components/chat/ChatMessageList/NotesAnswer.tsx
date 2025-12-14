import { BookOpenIcon } from "lucide-react";
import type { NoteAnswerData } from "../../../types/chat";

interface NotesAnswerProps {
  notes?: NoteAnswerData[];
  onOpenNote?: (noteId: number) => void;
}

/**
 * Strip HTML tags from a string
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function NotesAnswer({ notes, onOpenNote }: NotesAnswerProps) {
  if (!notes?.length) return null;

  return (
    <div className="p-default flex flex-col gap-default">
      <div className="flex items-center gap-small">
        <BookOpenIcon className="text-accent" size={20} />
        <p className="text-heading font-semibold">From Your Notes</p>
      </div>
      
      <div className="flex flex-col gap-small">
        {notes.map((note) => (
          <button
            key={note.noteId}
            type="button"
            onClick={() => onOpenNote?.(note.noteId)}
            className="flex flex-col gap-small p-default rounded-md bg-secondary/30 border border-accent/40 hover:border-accent hover:bg-secondary/50 transition text-left w-full"
          >
            <div className="flex items-start gap-small">
              <BookOpenIcon className="text-accent shrink-0 mt-1" size={16} />
              <div className="flex flex-col overflow-hidden flex-1">
                <p className="text-body font-semibold">{note.title}</p>
                <p className="text-caption text-default/70 line-clamp-3 mt-1">
                  {stripHtmlTags(note.body || "").slice(0, 200) || "No content"}
                  {stripHtmlTags(note.body || "").length > 200 ? "..." : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-small text-caption text-default/50">
              <span>Relevance: {Math.round(note.similarity * 100)}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
