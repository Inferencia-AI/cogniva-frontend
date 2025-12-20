import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useKnowledgebase } from "../hooks/useKnowledgebase";
import { useCorpus } from "../hooks/useCorpus";
import type {
  Knowledgebase,
  KnowledgebaseSearchPayload,
  KnowledgebaseSearchResponse,
  KnowledgebaseHomeResponse,
  KnowledgebaseUpdatePayload,
} from "../types/knowledgebase";
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
// Knowledgebase Context - Global state for knowledgebase & corpus management
// =============================================================================

interface KnowledgebaseContextType {
  // Knowledgebase State
  knowledgebases: Knowledgebase[];
  currentKnowledgebase: Knowledgebase | null;
  searchResults: KnowledgebaseSearchResponse | null;
  homeData: KnowledgebaseHomeResponse | null;
  isLoading: boolean;
  error: string | null;
  
  // Corpus State
  corpusList: Corpus[];
  currentCorpus: Corpus | null;
  corpusSearchResults: CorpusSearchResponse | null;
  isCorpusLoading: boolean;
  corpusError: string | null;
  
  // Corpus Viewer State
  viewedCorpus: Corpus | null;
  isCorpusViewerOpen: boolean;
  
  // Corpus Editor State
  isCorpusEditorOpen: boolean;
  editingCorpus: Corpus | null;
  
  // Knowledgebase Actions
  fetchKnowledgebase: (id: number) => Promise<Knowledgebase | null>;
  fetchHomeData: () => Promise<KnowledgebaseHomeResponse | null>;
  createKnowledgebase: (payload: {
    banner_url?: string;
    image_url?: string;
    name: string;
    description?: string;
  }) => Promise<Knowledgebase | null>;
  updateKnowledgebase: (id: number, payload: KnowledgebaseUpdatePayload) => Promise<Knowledgebase | null>;
  deleteKnowledgebase: (id: number) => Promise<boolean>;
  subscribe: (knowledgebaseId: number) => Promise<boolean>;
  unsubscribe: (knowledgebaseId: number) => Promise<boolean>;
  getSubscribers: (knowledgebaseId: number) => Promise<string[]>;
  search: (payload: KnowledgebaseSearchPayload) => Promise<KnowledgebaseSearchResponse | null>;
  
  // Corpus Actions
  fetchCorpus: (id: number) => Promise<Corpus | null>;
  fetchKnowledgebaseCorpus: (knowledgebaseId: number, showDrafts?: boolean) => Promise<Corpus[]>;
  createCorpus: (payload: CorpusCreatePayload) => Promise<Corpus | null>;
  updateCorpus: (id: number, payload: CorpusUpdatePayload) => Promise<Corpus | null>;
  deleteCorpus: (id: number) => Promise<boolean>;
  approveCorpus: (id: number, isApproved: boolean) => Promise<boolean>;
  likeCorpus: (id: number) => Promise<boolean>;
  unlikeCorpus: (id: number) => Promise<boolean>;
  addComment: (id: number, commentText: string) => Promise<boolean>;
  deleteComment: (id: number, createdAt: string) => Promise<boolean>;
  saveCorpusToNotes: (id: number) => Promise<Note | null>;
  searchCorpus: (payload: CorpusSearchPayload) => Promise<CorpusSearchResponse | null>;
  queryCorpus: (payload: CorpusQueryPayload) => Promise<CorpusQueryResponse | null>;
  
  // Corpus Viewer Actions
  openCorpusViewer: (corpus: Corpus) => void;
  closeCorpusViewer: () => void;
  
  // Corpus Editor Actions
  openCorpusEditor: (corpus?: Corpus) => void;
  closeCorpusEditor: () => void;
  
  // Helpers
  isSubscribed: (knowledgebase: Knowledgebase | null) => boolean;
  getUserRole: (knowledgebase: Knowledgebase | null) => string | null;
  isAdmin: (knowledgebase: Knowledgebase | null) => boolean;
  isLiked: (corpus: Corpus | null) => boolean;
  
  // Setters
  setCurrentKnowledgebase: (kb: Knowledgebase | null) => void;
  setSearchResults: (results: KnowledgebaseSearchResponse | null) => void;
}

const KnowledgebaseContext = createContext<KnowledgebaseContextType | undefined>(undefined);

interface KnowledgebaseProviderProps {
  children: ReactNode;
  userId: string | undefined;
}

// =============================================================================
// Knowledgebase Provider Component
// =============================================================================

export function KnowledgebaseProvider({ children, userId }: KnowledgebaseProviderProps) {
  const knowledgebaseState = useKnowledgebase(userId);
  const corpusState = useCorpus(userId);
  
  // Corpus Viewer State
  const [viewedCorpus, setViewedCorpus] = useState<Corpus | null>(null);
  const [isCorpusViewerOpen, setIsCorpusViewerOpen] = useState(false);
  
  // Corpus Editor State
  const [isCorpusEditorOpen, setIsCorpusEditorOpen] = useState(false);
  const [editingCorpus, setEditingCorpus] = useState<Corpus | null>(null);

  // Corpus Viewer Actions
  const openCorpusViewer = useCallback((corpus: Corpus) => {
    setViewedCorpus(corpus);
    setIsCorpusViewerOpen(true);
  }, []);

  const closeCorpusViewer = useCallback(() => {
    setIsCorpusViewerOpen(false);
    setViewedCorpus(null);
  }, []);
  
  // Corpus Editor Actions
  const openCorpusEditor = useCallback((corpus?: Corpus) => {
    setEditingCorpus(corpus || null);
    setIsCorpusEditorOpen(true);
  }, []);

  const closeCorpusEditor = useCallback(() => {
    setIsCorpusEditorOpen(false);
    setEditingCorpus(null);
  }, []);

  // Fetch home data when userId changes
  useEffect(() => {
    if (userId) {
      knowledgebaseState.fetchHomeData();
    }
  }, [userId]);

  const contextValue: KnowledgebaseContextType = {
    // Knowledgebase State
    knowledgebases: knowledgebaseState.knowledgebases,
    currentKnowledgebase: knowledgebaseState.currentKnowledgebase,
    searchResults: knowledgebaseState.searchResults,
    homeData: knowledgebaseState.homeData,
    isLoading: knowledgebaseState.isLoading,
    error: knowledgebaseState.error,
    
    // Corpus State
    corpusList: corpusState.corpusList,
    currentCorpus: corpusState.currentCorpus,
    corpusSearchResults: corpusState.searchResults,
    isCorpusLoading: corpusState.isLoading,
    corpusError: corpusState.error,
    
    // Corpus Viewer State
    viewedCorpus,
    isCorpusViewerOpen,
    
    // Corpus Editor State
    isCorpusEditorOpen,
    editingCorpus,
    
    // Knowledgebase Actions
    fetchKnowledgebase: knowledgebaseState.fetchKnowledgebase,
    fetchHomeData: knowledgebaseState.fetchHomeData,
    createKnowledgebase: knowledgebaseState.createKnowledgebase,
    updateKnowledgebase: knowledgebaseState.updateKnowledgebase,
    deleteKnowledgebase: knowledgebaseState.deleteKnowledgebase,
    subscribe: knowledgebaseState.subscribe,
    unsubscribe: knowledgebaseState.unsubscribe,
    getSubscribers: knowledgebaseState.getSubscribers,
    search: knowledgebaseState.search,
    
    // Corpus Actions
    fetchCorpus: corpusState.fetchCorpus,
    fetchKnowledgebaseCorpus: corpusState.fetchKnowledgebaseCorpus,
    createCorpus: corpusState.createCorpus,
    updateCorpus: corpusState.updateCorpus,
    deleteCorpus: corpusState.deleteCorpus,
    approveCorpus: corpusState.approveCorpus,
    likeCorpus: corpusState.likeCorpus,
    unlikeCorpus: corpusState.unlikeCorpus,
    addComment: corpusState.addComment,
    deleteComment: corpusState.deleteComment,
    saveCorpusToNotes: corpusState.saveCorpusToNotes,
    searchCorpus: corpusState.searchCorpus,
    queryCorpus: corpusState.queryCorpus,
    
    // Corpus Viewer Actions
    openCorpusViewer,
    closeCorpusViewer,
    
    // Corpus Editor Actions
    openCorpusEditor,
    closeCorpusEditor,
    
    // Helpers
    isSubscribed: knowledgebaseState.isSubscribed,
    getUserRole: knowledgebaseState.getUserRole,
    isAdmin: knowledgebaseState.isAdmin,
    isLiked: corpusState.isLiked,
    
    // Setters
    setCurrentKnowledgebase: knowledgebaseState.setCurrentKnowledgebase,
    setSearchResults: knowledgebaseState.setSearchResults,
  };

  return (
    <KnowledgebaseContext.Provider value={contextValue}>
      {children}
    </KnowledgebaseContext.Provider>
  );
}

// =============================================================================
// useKnowledgebaseContext Hook
// =============================================================================

export function useKnowledgebaseContext(): KnowledgebaseContextType {
  const context = useContext(KnowledgebaseContext);
  if (context === undefined) {
    throw new Error("useKnowledgebaseContext must be used within a KnowledgebaseProvider");
  }
  return context;
}
