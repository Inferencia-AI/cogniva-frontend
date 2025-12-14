import { useState, type FC } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useNotesContext } from "../../context/NotesContext";
import { ConfirmDialog } from "../ui";
import type { Note } from "../../types/notes";

// =============================================================================
// NotesSidebar - Right sidebar for listing and managing notes
// =============================================================================

export const NotesSidebar: FC = () => {
  const {
    notes,
    isLoading,
    notesSidebarOpen,
    setNotesSidebarOpen,
    openNoteEditor,
    deleteNote,
  } = useNotesContext();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectNote = (note: Note) => {
    openNoteEditor(note);
    setNotesSidebarOpen(false);
  };

  const handleCreateNote = () => {
    openNoteEditor();
    setNotesSidebarOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setNoteToDelete(note);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    await deleteNote(noteToDelete.id);
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  return (
    <>
      <div className={`transition-all duration-300 ${notesSidebarOpen ? "sm:w-64 w-full" : "w-0 overflow-hidden opacity-0"} h-full overflow-hidden`}>
        <button className="button w-full text-default" onClick={handleCreateNote}>
          <PlusIcon className="size-4 inline mr-2" />
          New Note
        </button>
        <hr className="border-accent my-default" />
        <div className="overflow-y-auto overflow-x-hidden h-[80%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin" dir="rtl">
          {isLoading ? (
            <p className="text-default/50 text-body p-default text-center">Loading notes...</p>
          ) : notes.length > 0 ? (
            notes.map((note) => (
              <div key={note.id} className="button bg-secondary/20! p-small hover:bg-accent rounded-md cursor-pointer group" dir="ltr">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => handleSelectNote(note)} 
                    className=" cursor-pointer w-full text-left truncate"
                  >
                    {note.title || "Untitled"}
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, note)}
                    className="text-red-500 hover:text-red-700 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-default text-body p-default text-center">No notes yet.</p>
          )}
        </div>
        <hr className="border-accent my-default" />
        <div className="text-default text-caption text-center">
          <p className="text-default/50">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title || "Untitled"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
