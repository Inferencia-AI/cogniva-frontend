import type { FC } from "react";
import { Eye, Edit, Check, X, FileText } from "lucide-react";
import type { KnowledgebaseNote, ManagerRole } from "../../types/knowledgebase";

// =============================================================================
// KnowledgebaseNotesList - Displays notes within a knowledgebase
// =============================================================================

interface KnowledgebaseNotesListProps {
  notes: KnowledgebaseNote[];
  userRole?: ManagerRole | null;
  onViewNote?: (noteId: number) => void;
  onSuggestEdit?: (noteId: number) => void;
  onApprove?: (noteId: number) => void;
  onReject?: (noteId: number) => void;
  isLoading?: boolean;
}

export const KnowledgebaseNotesList: FC<KnowledgebaseNotesListProps> = ({
  notes,
  userRole,
  onViewNote,
  onSuggestEdit,
  onApprove,
  onReject,
  isLoading = false,
}) => {
  const canApprove = userRole === "admin" || userRole === "approver";
  const canEdit = userRole === "admin" || userRole === "editor";

  // Strip HTML tags for preview
  const stripHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  if (isLoading) {
    return (
      <div className="bg-secondary rounded-lg p-4">
        <h3 className="font-semibold text-default mb-4">Notes</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-primary rounded-lg p-4">
              <div className="h-4 bg-default/10 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-default/10 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-default">Notes ({notes.length})</h3>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="size-12 text-default/20 mx-auto mb-3" />
          <p className="text-default/40 text-body">No notes in this knowledgebase</p>
          <p className="text-default/30 text-caption mt-1">
            Add notes to start building your knowledge collection
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group bg-primary rounded-lg p-4 hover:ring-1 hover:ring-accent/30 transition-all cursor-pointer"
              onClick={() => onViewNote?.(note.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-default text-body truncate">
                    {note.title || "Untitled Note"}
                  </h4>
                  <p className="text-default/50 text-caption line-clamp-2 mt-1">
                    {stripHtml(note.body || "No content")}
                  </p>
                  {note.similarity !== undefined && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded">
                      {Math.round(note.similarity * 100)}% match
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewNote?.(note.id);
                    }}
                    className="p-2 rounded-md hover:bg-secondary text-default/50 hover:text-accent transition-colors"
                    title="View note"
                  >
                    <Eye className="size-4" />
                  </button>

                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSuggestEdit?.(note.id);
                      }}
                      className="p-2 rounded-md hover:bg-secondary text-default/50 hover:text-blue-400 transition-colors"
                      title="Suggest edit"
                    >
                      <Edit className="size-4" />
                    </button>
                  )}

                  {canApprove && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove?.(note.id);
                        }}
                        className="p-2 rounded-md hover:bg-secondary text-default/50 hover:text-green-400 transition-colors"
                        title="Approve"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReject?.(note.id);
                        }}
                        className="p-2 rounded-md hover:bg-secondary text-default/50 hover:text-red-400 transition-colors"
                        title="Reject"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
