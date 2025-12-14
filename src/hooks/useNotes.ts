import { useCallback, useState } from "react";
import api from "../utils/api";
import type { Note, NoteCreatePayload, NoteUpdatePayload } from "../types/notes";

// =============================================================================
// useNotes Hook - Manages notes state and API interactions
// =============================================================================

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch all notes for the user
  // ---------------------------------------------------------------------------
  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Note[]>(`/notes/${userId}`);
      setNotes(response.data);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to fetch notes");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ---------------------------------------------------------------------------
  // Create a new note
  // ---------------------------------------------------------------------------
  const createNote = useCallback(
    async (title: string, body = ""): Promise<Note | null> => {
      if (!userId) return null;
      setError(null);
      try {
        const payload: NoteCreatePayload = { userId, title, body };
        const response = await api.post<Note>("/notes", payload);
        const newNote = response.data;
        setNotes((prev) => [newNote, ...prev]);
        return newNote;
      } catch (err) {
        console.error("Error creating note:", err);
        setError("Failed to create note");
        return null;
      }
    },
    [userId]
  );

  // ---------------------------------------------------------------------------
  // Update an existing note
  // ---------------------------------------------------------------------------
  const updateNote = useCallback(
    async (id: number, title: string, body: string): Promise<Note | null> => {
      setError(null);
      try {
        const payload: NoteUpdatePayload = { title, body };
        const response = await api.put<Note>(`/notes/${id}`, payload);
        const updatedNote = response.data;
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? updatedNote : note))
        );
        return updatedNote;
      } catch (err) {
        console.error("Error updating note:", err);
        setError("Failed to update note");
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Delete a note
  // ---------------------------------------------------------------------------
  const deleteNote = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note");
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Get the next untitled note number
  // ---------------------------------------------------------------------------
  const getNextUntitledNumber = useCallback((): number => {
    const untitledPattern = /^Untitled (\d+)$/;
    const numbers = notes
      .map((note) => {
        const match = note.title.match(untitledPattern);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);
    return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  }, [notes]);

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    getNextUntitledNumber,
  };
}
