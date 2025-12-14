import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useNotes } from "../hooks/useNotes";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import type { Note } from "../types/notes";

// =============================================================================
// Notes Context - Global state for notes management
// =============================================================================

// Content to be added to the note (text or image)
interface PendingContent {
  type: "text" | "image";
  content: string;
  timestamp: number;
}

interface NotesContextType {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  notesSidebarOpen: boolean;
  activeNote: Note | null;
  noteEditorOpen: boolean;
  pendingContent: PendingContent | null;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, body?: string) => Promise<Note | null>;
  updateNote: (id: number, title: string, body: string) => Promise<Note | null>;
  deleteNote: (id: number) => Promise<boolean>;
  getNextUntitledNumber: () => number;
  setNotesSidebarOpen: (open: boolean) => void;
  setActiveNote: (note: Note | null) => void;
  setNoteEditorOpen: (open: boolean) => void;
  openNoteEditor: (note?: Note) => void;
  closeNoteEditor: () => void;
  addTextToActiveNote: (text: string) => Promise<void>;
  addImageToActiveNote: (imageUrl: string) => Promise<void>;
  clearPendingContent: () => void;
  // Document upload
  uploadDocument: (file: File) => Promise<Note | null>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  clearUploadError: () => void;
  validateDocumentFile: (file: File) => string | null;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

interface NotesProviderProps {
  children: ReactNode;
  userId: string | undefined;
}

export function NotesProvider({ children, userId }: NotesProviderProps) {
  const {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNextUntitledNumber,
  } = useNotes(userId);

  const [notesSidebarOpen, setNotesSidebarOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);

  // Document upload - callbacks for after upload
  const handleUploadSuccess = useCallback((note: Note) => {
    // Add the new note to the list
    fetchNotes();
    // Open the note in editor
    setActiveNote(note);
    setNoteEditorOpen(true);
  }, [fetchNotes]);

  const {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError,
    clearError: clearUploadError,
    validateFile: validateDocumentFile,
  } = useDocumentUpload({
    userId,
    onSuccess: handleUploadSuccess,
  });

  // Fetch notes when userId changes
  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId, fetchNotes]);

  // ---------------------------------------------------------------------------
  // Clear pending content
  // ---------------------------------------------------------------------------
  const clearPendingContent = useCallback(() => {
    setPendingContent(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Open note editor with optional note
  // ---------------------------------------------------------------------------
  const openNoteEditor = async (note?: Note) => {
    if (note) {
      setActiveNote(note);
    } else {
      // Create new note with "Untitled X" title
      const nextNum = getNextUntitledNumber();
      const newNote = await createNote(`Untitled ${nextNum}`, "");
      if (newNote) {
        setActiveNote(newNote);
      }
    }
    setNoteEditorOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Close note editor
  // ---------------------------------------------------------------------------
  const closeNoteEditor = () => {
    setNoteEditorOpen(false);
    setActiveNote(null);
    setPendingContent(null);
  };

  // ---------------------------------------------------------------------------
  // Add selected text to active note or create new note
  // ---------------------------------------------------------------------------
  const addTextToActiveNote = async (text: string) => {
    if (activeNote && noteEditorOpen) {
      // Set pending content - the editor will pick this up
      setPendingContent({ type: "text", content: text, timestamp: Date.now() });
    } else {
      // Create new note with the text
      const nextNum = getNextUntitledNumber();
      const newNote = await createNote(`Untitled ${nextNum}`, text);
      if (newNote) {
        setActiveNote(newNote);
        setNoteEditorOpen(true);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Add image to active note or create new note with image
  // ---------------------------------------------------------------------------
  const addImageToActiveNote = async (imageUrl: string) => {
    if (activeNote && noteEditorOpen) {
      // Set pending content - the editor will pick this up
      setPendingContent({ type: "image", content: imageUrl, timestamp: Date.now() });
    } else {
      // Create new note with the image as HTML
      const nextNum = getNextUntitledNumber();
      const imageHtml = `<img src="${imageUrl}" alt="Image" />`;
      const newNote = await createNote(`Untitled ${nextNum}`, imageHtml);
      if (newNote) {
        setActiveNote(newNote);
        setNoteEditorOpen(true);
      }
    }
  };

  const value: NotesContextType = {
    notes,
    isLoading,
    error,
    notesSidebarOpen,
    activeNote,
    noteEditorOpen,
    pendingContent,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNextUntitledNumber,
    setNotesSidebarOpen,
    setActiveNote,
    setNoteEditorOpen,
    openNoteEditor,
    closeNoteEditor,
    addTextToActiveNote,
    addImageToActiveNote,
    clearPendingContent,
    // Document upload
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadError,
    clearUploadError,
    validateDocumentFile,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

// =============================================================================
// useNotesContext Hook - Access notes context
// =============================================================================

export function useNotesContext() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error("useNotesContext must be used within a NotesProvider");
  }
  return context;
}
