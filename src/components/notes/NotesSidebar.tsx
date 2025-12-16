import { useState, useMemo, type FC } from "react";
import { PlusIcon, TrashIcon, UploadIcon, SearchIcon } from "lucide-react";
import { useNotesContext } from "../../context/NotesContext";
import { ConfirmDialog } from "../ui";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
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
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError,
    clearUploadError,
    validateDocumentFile,
  } = useNotesContext();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const title = (note.title || "Untitled").toLowerCase();
      return title.includes(query);
    });
  }, [notes, searchQuery]);

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

  const handleOpenUploadDialog = () => {
    clearUploadError();
    setUploadDialogOpen(true);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
  };

  const handleUploadDocument = async (file: File) => {
    const result = await uploadDocument(file);
    if (result) {
      setUploadDialogOpen(false);
      setNotesSidebarOpen(false);
    }
  };

  return (
    <>
      <div
        className={`transition-all duration-300 h-full overflow-hidden ${
          notesSidebarOpen ? "sm:w-64 w-full" : "w-0 overflow-hidden opacity-0"
        } ${
          notesSidebarOpen
            ? "max-sm:absolute max-sm:inset-y-0 max-sm:right-0 max-sm:left-auto max-sm:z-40 max-sm:w-full max-sm:h-full max-sm:bg-primary max-sm:p-default max-sm:translate-x-0"
            : "max-sm:absolute max-sm:inset-y-0 max-sm:right-0 max-sm:left-auto max-sm:z-40 max-sm:w-full max-sm:h-full max-sm:opacity-0 max-sm:pointer-events-none max-sm:translate-x-full"
        }`}
      >
        <button className="button w-full text-default" onClick={handleCreateNote}>
          <PlusIcon className="size-4 inline mr-2" />
          New Note
        </button>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-default/50" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-secondary/30 border border-accent/30 rounded-md text-default text-body placeholder:text-default/40 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <hr className="border-accent my-default" />
        <div className="overflow-y-auto overflow-x-hidden h-[75%] p-default flex flex-col gap-default bg-secondary/10 rounded-md scrollbar-thin" dir="rtl">
          {isLoading ? (
            <p className="text-default/50 text-body p-default text-center">Loading notes...</p>
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
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
            <p className="text-default text-body p-default text-center">
              {searchQuery ? "No notes found." : "No notes yet."}
            </p>
          )}
        </div>
        <hr className="border-accent my-default" />
        <div className="text-default text-caption text-center">
          <p className="text-default/50">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </p>
          <button
            onClick={handleOpenUploadDialog}
            className="mt-2 flex items-center justify-center gap-2 w-full py-2 px-3 text-default/70 hover:text-default hover:bg-accent/20 rounded-md transition-all duration-200 cursor-pointer text-caption"
          >
            <UploadIcon className="size-4" />
            Upload Document
          </button>
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

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        isOpen={uploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onUpload={handleUploadDocument}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadError={uploadError}
        validateFile={validateDocumentFile}
      />
    </>
  );
};
