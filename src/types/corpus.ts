// =============================================================================
// Corpus Types - Core types for corpus functionality
// =============================================================================

export interface CorpusComment {
  user_id: string
  comment_text: string
  created_at: string
}

export interface Corpus {
  id: number
  title: string | null
  body: string | null
  keywords: string[]
  knowledgebase_id: number | null
  liked_users_ids: string[]
  comments: CorpusComment[]
  is_approved: boolean
  similarity?: number
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CorpusCreatePayload {
  title?: string
  body?: string
  keywords?: string[]
  knowledgebase_id: number
  is_approved?: boolean
}

export interface CorpusUpdatePayload {
  title?: string
  body?: string
  keywords?: string[]
  is_approved?: boolean
}

export interface CorpusSearchPayload {
  query: string
  knowledgebase_id?: number
}

export interface CorpusSearchResponse {
  corpus: Corpus[]
  sources: {
    title: string | null
    snippet: string
    corpusId: number
    similarity: number
  }[]
}

export interface CorpusQueryPayload {
  question: string
  knowledgebase_id?: number
}

export interface CorpusQueryResponse {
  corpus: Corpus[]
  sources: {
    title: string | null
    url: string
    snippet: string
    corpusId: number
  }[]
}

export interface CorpusCommentPayload {
  user_id: string
  comment_text: string
}

export interface CorpusLikePayload {
  user_id: string
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface CorpusListProps {
  knowledgebaseId: number
  showDrafts?: boolean
  showActions?: boolean
  onCorpusClick?: (corpus: Corpus) => void
  onEditClick?: (corpus: Corpus) => void
  onDeleteClick?: (corpus: Corpus) => void
  className?: string
}

export interface CorpusViewerProps {
  corpus: Corpus | null
  isOpen: boolean
  onClose: () => void
  onLike?: () => void
  onUnlike?: () => void
  onComment?: (comment: string) => void
  onSaveToNotes?: () => void
  isLiked?: boolean
  canEdit?: boolean
  currentUserId?: string
}

export interface CorpusEditorProps {
  corpus?: Corpus | null
  knowledgebaseId: number
  isOpen: boolean
  onClose: () => void
  onSave: (data: CorpusCreatePayload | CorpusUpdatePayload) => Promise<void>
  isCreating?: boolean
}
