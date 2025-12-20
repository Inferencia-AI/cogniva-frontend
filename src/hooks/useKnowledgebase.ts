import { useCallback, useState } from "react";
import api from "../utils/api";
import type {
  Knowledgebase,
  KnowledgebaseCreatePayload,
  KnowledgebaseUpdatePayload,
  KnowledgebaseSearchPayload,
  KnowledgebaseSearchResponse,
  KnowledgebaseHomeResponse,
  KnowledgebaseQueryPayload,
  KnowledgebaseQueryResponse,
  KnowledgebaseNote,
} from "../types/knowledgebase";

// =============================================================================
// useKnowledgebase Hook - Manages knowledgebase state and API interactions
// =============================================================================

export function useKnowledgebase(userId: string | undefined) {
  const [knowledgebases, setKnowledgebases] = useState<Knowledgebase[]>([]);
  const [currentKnowledgebase, setCurrentKnowledgebase] = useState<Knowledgebase | null>(null);
  const [searchResults, setSearchResults] = useState<KnowledgebaseSearchResponse | null>(null);
  const [homeData, setHomeData] = useState<KnowledgebaseHomeResponse | null>(null);
  const [notes, setNotes] = useState<KnowledgebaseNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch knowledgebase by ID
  // ---------------------------------------------------------------------------
  const fetchKnowledgebase = useCallback(async (id: number): Promise<Knowledgebase | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Knowledgebase>(`/knowledgebase/${id}`);
      setCurrentKnowledgebase(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching knowledgebase:", err);
      setError("Failed to fetch knowledgebase");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch home page data
  // ---------------------------------------------------------------------------
  const fetchHomeData = useCallback(async (): Promise<KnowledgebaseHomeResponse | null> => {
    if (!userId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<KnowledgebaseHomeResponse>(`/knowledgebase/home/${userId}`);
      setHomeData(response.data);
      return response.data;
    } catch (err) {
      console.error("Error fetching home data:", err);
      setError("Failed to fetch home data");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // ---------------------------------------------------------------------------
  // Create a new knowledgebase
  // ---------------------------------------------------------------------------
  const createKnowledgebase = useCallback(
    async (payload: Omit<KnowledgebaseCreatePayload, 'userId'>): Promise<Knowledgebase | null> => {
      if (!userId) return null;
      setError(null);
      try {
        const response = await api.post<Knowledgebase>("/knowledgebase", {
          ...payload,
          userId,
        });
        const newKnowledgebase = response.data;
        setKnowledgebases((prev) => [newKnowledgebase, ...prev]);
        return newKnowledgebase;
      } catch (err) {
        console.error("Error creating knowledgebase:", err);
        setError("Failed to create knowledgebase");
        return null;
      }
    },
    [userId]
  );

  // ---------------------------------------------------------------------------
  // Update an existing knowledgebase
  // ---------------------------------------------------------------------------
  const updateKnowledgebase = useCallback(
    async (id: number, payload: KnowledgebaseUpdatePayload): Promise<Knowledgebase | null> => {
      setError(null);
      try {
        const response = await api.put<Knowledgebase>(`/knowledgebase/${id}`, payload);
        const updatedKnowledgebase = response.data;
        setKnowledgebases((prev) =>
          prev.map((kb) => (kb.id === id ? updatedKnowledgebase : kb))
        );
        if (currentKnowledgebase?.id === id) {
          setCurrentKnowledgebase(updatedKnowledgebase);
        }
        return updatedKnowledgebase;
      } catch (err) {
        console.error("Error updating knowledgebase:", err);
        setError("Failed to update knowledgebase");
        return null;
      }
    },
    [currentKnowledgebase]
  );

  // ---------------------------------------------------------------------------
  // Delete a knowledgebase
  // ---------------------------------------------------------------------------
  const deleteKnowledgebase = useCallback(async (id: number): Promise<boolean> => {
    setError(null);
    try {
      await api.delete(`/knowledgebase/${id}`);
      setKnowledgebases((prev) => prev.filter((kb) => kb.id !== id));
      if (currentKnowledgebase?.id === id) {
        setCurrentKnowledgebase(null);
      }
      return true;
    } catch (err) {
      console.error("Error deleting knowledgebase:", err);
      setError("Failed to delete knowledgebase");
      return false;
    }
  }, [currentKnowledgebase]);

  // ---------------------------------------------------------------------------
  // Subscribe to a knowledgebase
  // ---------------------------------------------------------------------------
  const subscribe = useCallback(
    async (knowledgebaseId: number): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      try {
        await api.post(`/knowledgebase/${knowledgebaseId}/subscribe`, { user_id: userId });
        // Update local state
        if (currentKnowledgebase?.id === knowledgebaseId) {
          setCurrentKnowledgebase((prev) =>
            prev
              ? {
                  ...prev,
                  subscribers_ids: [...(prev.subscribers_ids || []), userId],
                }
              : null
          );
        }
        return true;
      } catch (err) {
        console.error("Error subscribing:", err);
        setError("Failed to subscribe");
        return false;
      }
    },
    [userId, currentKnowledgebase]
  );

  // ---------------------------------------------------------------------------
  // Unsubscribe from a knowledgebase
  // ---------------------------------------------------------------------------
  const unsubscribe = useCallback(
    async (knowledgebaseId: number): Promise<boolean> => {
      if (!userId) return false;
      setError(null);
      try {
        await api.post(`/knowledgebase/${knowledgebaseId}/unsubscribe`, { user_id: userId });
        // Update local state
        if (currentKnowledgebase?.id === knowledgebaseId) {
          setCurrentKnowledgebase((prev) =>
            prev
              ? {
                  ...prev,
                  subscribers_ids: (prev.subscribers_ids || []).filter((id) => id !== userId),
                }
              : null
          );
        }
        return true;
      } catch (err) {
        console.error("Error unsubscribing:", err);
        setError("Failed to unsubscribe");
        return false;
      }
    },
    [userId, currentKnowledgebase]
  );

  // ---------------------------------------------------------------------------
  // Get subscribers for a knowledgebase
  // ---------------------------------------------------------------------------
  const getSubscribers = useCallback(async (knowledgebaseId: number): Promise<string[]> => {
    setError(null);
    try {
      const response = await api.get<{ subscribers: string[] }>(
        `/knowledgebase/${knowledgebaseId}/subscribers`
      );
      return response.data.subscribers || [];
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setError("Failed to fetch subscribers");
      return [];
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Search knowledgebases
  // ---------------------------------------------------------------------------
  const search = useCallback(
    async (payload: KnowledgebaseSearchPayload): Promise<KnowledgebaseSearchResponse | null> => {
      setError(null);
      try {
        const response = await api.post<KnowledgebaseSearchResponse>(
          "/knowledgebase/search",
          payload
        );
        setSearchResults(response.data);
        return response.data;
      } catch (err) {
        console.error("Error searching:", err);
        setError("Failed to search");
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Query knowledgebase for answers
  // ---------------------------------------------------------------------------
  const queryKnowledgebase = useCallback(
    async (payload: KnowledgebaseQueryPayload): Promise<KnowledgebaseQueryResponse | null> => {
      setError(null);
      try {
        const response = await api.post<KnowledgebaseQueryResponse>(
          "/knowledgebase/query",
          payload
        );
        return response.data;
      } catch (err) {
        console.error("Error querying:", err);
        setError("Failed to query knowledgebase");
        return null;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Fetch notes for a knowledgebase
  // ---------------------------------------------------------------------------
  const fetchKnowledgebaseNotes = useCallback(
    async (knowledgebaseId: number): Promise<KnowledgebaseNote[]> => {
      setError(null);
      try {
        const response = await api.get<{ notes: KnowledgebaseNote[] }>(
          `/knowledgebase/${knowledgebaseId}/notes`
        );
        setNotes(response.data.notes || []);
        return response.data.notes || [];
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError("Failed to fetch notes");
        return [];
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Add note to knowledgebase
  // ---------------------------------------------------------------------------
  const addNoteToKnowledgebase = useCallback(
    async (knowledgebaseId: number, noteId: number): Promise<boolean> => {
      setError(null);
      try {
        await api.post(`/knowledgebase/${knowledgebaseId}/notes`, { note_id: noteId });
        // Refresh notes list
        await fetchKnowledgebaseNotes(knowledgebaseId);
        return true;
      } catch (err) {
        console.error("Error adding note:", err);
        setError("Failed to add note");
        return false;
      }
    },
    [fetchKnowledgebaseNotes]
  );

  // ---------------------------------------------------------------------------
  // Remove note from knowledgebase
  // ---------------------------------------------------------------------------
  const removeNoteFromKnowledgebase = useCallback(
    async (knowledgebaseId: number, noteId: number): Promise<boolean> => {
      setError(null);
      try {
        await api.delete(`/knowledgebase/${knowledgebaseId}/notes/${noteId}`);
        setNotes((prev) => prev.filter((note) => note.id !== noteId));
        return true;
      } catch (err) {
        console.error("Error removing note:", err);
        setError("Failed to remove note");
        return false;
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Check if user is subscribed
  // ---------------------------------------------------------------------------
  const isSubscribed = useCallback(
    (knowledgebase: Knowledgebase | null): boolean => {
      if (!userId || !knowledgebase) return false;
      return (knowledgebase.subscribers_ids || []).includes(userId);
    },
    [userId]
  );

  // ---------------------------------------------------------------------------
  // Get user's role in a knowledgebase
  // ---------------------------------------------------------------------------
  const getUserRole = useCallback(
    (knowledgebase: Knowledgebase | null): string | null => {
      if (!userId || !knowledgebase) return null;
      const manager = (knowledgebase.managers || []).find((m) => m.userId === userId);
      return manager?.role || null;
    },
    [userId]
  );

  // ---------------------------------------------------------------------------
  // Check if user is admin
  // ---------------------------------------------------------------------------
  const isAdmin = useCallback(
    (knowledgebase: Knowledgebase | null): boolean => {
      return getUserRole(knowledgebase) === 'admin';
    },
    [getUserRole]
  );

  return {
    // State
    knowledgebases,
    currentKnowledgebase,
    searchResults,
    homeData,
    notes,
    isLoading,
    error,
    // Actions
    fetchKnowledgebase,
    fetchHomeData,
    createKnowledgebase,
    updateKnowledgebase,
    deleteKnowledgebase,
    subscribe,
    unsubscribe,
    getSubscribers,
    search,
    queryKnowledgebase,
    fetchKnowledgebaseNotes,
    addNoteToKnowledgebase,
    removeNoteFromKnowledgebase,
    // Helpers
    isSubscribed,
    getUserRole,
    isAdmin,
    // Setters
    setCurrentKnowledgebase,
    setSearchResults,
  };
}
