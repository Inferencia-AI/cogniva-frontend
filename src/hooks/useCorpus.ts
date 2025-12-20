import { useCallback, useState } from "react";
import api from "../utils/api";
import type {
  Corpus,
  CorpusCreatePayload,
  CorpusUpdatePayload,
  CorpusSearchPayload,
  CorpusSearchResponse,
  CorpusQueryPayload,
  CorpusQueryResponse,
} from "../types/corpus";
import type { Note } from "../types/notes";

// =============================================================================
// useCorpus Hook - Manages corpus state and API interactions
// =============================================================================

export function useCorpus(userId: string | undefined) {
  const [corpusList, setCorpusList] = useState<Corpus[]>([]);
  const [currentCorpus, setCurrentCorpus] = useState<Corpus | null>(null);
  const [searchResults, setSearchResults] = useState<CorpusSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch corpus by ID
  // ---------------------------------------------------------------------------
  const fetchCorpus = useCallback(async (id: number): Promise<Corpus | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Corpus>(`/corpus/${id}`);
      setCurrentCorpus(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching corpus:", err);
      setError("Failed to fetch corpus");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch all corpus for a knowledgebase
  // ---------------------------------------------------------------------------
  const fetchKnowledgebaseCorpus = useCallback(
    async (knowledgebaseId: number, showDrafts = false): Promise<Corpus[]> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<{ corpus: Corpus[] }>(
          `/corpus/knowledgebase/${knowledgebaseId}?showDrafts=${showDrafts}`
        );
        setCorpusList(response.data.corpus || []);
        return response.data.corpus || [];
      } catch (err) {
        console.error("Error fetching corpus:", err);
        setError("Failed to fetch corpus");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Create a new corpus
  // ---------------------------------------------------------------------------
  const createCorpus = useCallback(
    async (payload: CorpusCreatePayload): Promise<Corpus | null> => {
      setError(null);
      try {
        const response = await api.post<Corpus>("/corpus", payload);
        const newCorpus = response.data;
        setCorpusList((prev) => [newCorpus, ...prev]);
        return newCorpus;
      } catch (err) {
        console.error("Error creating corpus:", err);
        setError("Failed to create corpus");
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Update an existing corpus
  // ---------------------------------------------------------------------------
  const updateCorpus = useCallback(
    async (id: number, payload: CorpusUpdatePayload): Promise<Corpus | null> => {
      setError(null);
      try {
        const response = await api.put<Corpus>(`/corpus/${id}`, payload);
        const updatedCorpus = response.data;
        setCorpusList((prev) =>
          prev.map((c) => (c.id === id ? updatedCorpus : c))
        );
        if (currentCorpus?.id === id) {
          setCurrentCorpus(updatedCorpus);
        }
        return updatedCorpus;
      } catch (err) {
        console.error("Error updating corpus:", err);
        setError("Failed to update corpus");
        return null;
      }
    },
    [currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Delete a corpus
  // ---------------------------------------------------------------------------
  const deleteCorpus = useCallback(
    async (id: number): Promise<boolean> => {
      setError(null);
      try {
        await api.delete(`/corpus/${id}`);
        setCorpusList((prev) => prev.filter((c) => c.id !== id));
        if (currentCorpus?.id === id) {
          setCurrentCorpus(null);
        }
        return true;
      } catch (err) {
        console.error("Error deleting corpus:", err);
        setError("Failed to delete corpus");
        return false;
      }
    },
    [currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Approve/unapprove corpus
  // ---------------------------------------------------------------------------
  const approveCorpus = useCallback(
    async (id: number, isApproved: boolean): Promise<boolean> => {
      setError(null);
      try {
        const response = await api.post<{ success: boolean; corpus: Corpus }>(
          `/corpus/${id}/approve`,
          { is_approved: isApproved }
        );
        const updatedCorpus = response.data.corpus;
        setCorpusList((prev) =>
          prev.map((c) => (c.id === id ? updatedCorpus : c))
        );
        if (currentCorpus?.id === id) {
          setCurrentCorpus(updatedCorpus);
        }
        return true;
      } catch (err) {
        console.error("Error approving corpus:", err);
        setError("Failed to approve corpus");
        return false;
      }
    },
    [currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Like corpus
  // ---------------------------------------------------------------------------
  const likeCorpus = useCallback(
    async (id: number): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      try {
        const response = await api.post<{ success: boolean; corpus: Corpus }>(
          `/corpus/${id}/like`,
          { user_id: userId }
        );
        const updatedCorpus = response.data.corpus;
        setCorpusList((prev) =>
          prev.map((c) => (c.id === id ? updatedCorpus : c))
        );
        if (currentCorpus?.id === id) {
          setCurrentCorpus(updatedCorpus);
        }
        return true;
      } catch (err) {
        console.error("Error liking corpus:", err);
        setError("Failed to like corpus");
        return false;
      }
    },
    [userId, currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Unlike corpus
  // ---------------------------------------------------------------------------
  const unlikeCorpus = useCallback(
    async (id: number): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      try {
        const response = await api.post<{ success: boolean; corpus: Corpus }>(
          `/corpus/${id}/unlike`,
          { user_id: userId }
        );
        const updatedCorpus = response.data.corpus;
        setCorpusList((prev) =>
          prev.map((c) => (c.id === id ? updatedCorpus : c))
        );
        if (currentCorpus?.id === id) {
          setCurrentCorpus(updatedCorpus);
        }
        return true;
      } catch (err) {
        console.error("Error unliking corpus:", err);
        setError("Failed to unlike corpus");
        return false;
      }
    },
    [userId, currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Add comment to corpus
  // ---------------------------------------------------------------------------
  const addComment = useCallback(
    async (id: number, commentText: string): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      try {
        const response = await api.post<{ success: boolean; corpus: Corpus }>(
          `/corpus/${id}/comment`,
          { user_id: userId, comment_text: commentText }
        );
        const updatedCorpus = response.data.corpus;
        setCorpusList((prev) =>
          prev.map((c) => (c.id === id ? updatedCorpus : c))
        );
        if (currentCorpus?.id === id) {
          setCurrentCorpus(updatedCorpus);
        }
        return true;
      } catch (err) {
        console.error("Error adding comment:", err);
        setError("Failed to add comment");
        return false;
      }
    },
    [userId, currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Delete comment from corpus
  // ---------------------------------------------------------------------------
  const deleteComment = useCallback(
    async (id: number, createdAt: string): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      try {
        const response = await api.delete<{ success: boolean; corpus: Corpus }>(
          `/corpus/${id}/comment`,
          { data: { user_id: userId, created_at: createdAt } }
        );
        const updatedCorpus = response.data.corpus;
        setCorpusList((prev) =>
          prev.map((c) => (c.id === id ? updatedCorpus : c))
        );
        if (currentCorpus?.id === id) {
          setCurrentCorpus(updatedCorpus);
        }
        return true;
      } catch (err) {
        console.error("Error deleting comment:", err);
        setError("Failed to delete comment");
        return false;
      }
    },
    [userId, currentCorpus]
  );

  // ---------------------------------------------------------------------------
  // Save corpus to user's notes
  // ---------------------------------------------------------------------------
  const saveCorpusToNotes = useCallback(
    async (id: number): Promise<Note | null> => {
      if (!userId) return null;
      setError(null);
      try {
        const response = await api.post<{ success: boolean; note: Note }>(
          `/corpus/${id}/save-to-notes`,
          { user_id: userId }
        );
        return response.data.note;
      } catch (err) {
        console.error("Error saving corpus to notes:", err);
        setError("Failed to save to notes");
        return null;
      }
    },
    [userId]
  );

  // ---------------------------------------------------------------------------
  // Search corpus
  // ---------------------------------------------------------------------------
  const searchCorpus = useCallback(
    async (payload: CorpusSearchPayload): Promise<CorpusSearchResponse | null> => {
      setError(null);
      try {
        const response = await api.post<CorpusSearchResponse>(
          "/corpus/search",
          payload
        );
        setSearchResults(response.data);
        return response.data;
      } catch (err) {
        console.error("Error searching corpus:", err);
        setError("Failed to search corpus");
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Query corpus for AI answers
  // ---------------------------------------------------------------------------
  const queryCorpus = useCallback(
    async (payload: CorpusQueryPayload): Promise<CorpusQueryResponse | null> => {
      setError(null);
      try {
        const response = await api.post<CorpusQueryResponse>(
          "/corpus/query",
          payload
        );
        return response.data;
      } catch (err) {
        console.error("Error querying corpus:", err);
        setError("Failed to query corpus");
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Check if user has liked a corpus
  // ---------------------------------------------------------------------------
  const isLiked = useCallback(
    (corpus: Corpus | null): boolean => {
      if (!userId || !corpus) return false;
      return (corpus.liked_users_ids || []).includes(userId);
    },
    [userId]
  );

  return {
    // State
    corpusList,
    currentCorpus,
    searchResults,
    isLoading,
    error,
    // Actions
    fetchCorpus,
    fetchKnowledgebaseCorpus,
    createCorpus,
    updateCorpus,
    deleteCorpus,
    approveCorpus,
    likeCorpus,
    unlikeCorpus,
    addComment,
    deleteComment,
    saveCorpusToNotes,
    searchCorpus,
    queryCorpus,
    // Helpers
    isLiked,
    // Setters
    setCurrentCorpus,
    setSearchResults,
  };
}
