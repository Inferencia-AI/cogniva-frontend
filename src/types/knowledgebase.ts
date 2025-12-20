// =============================================================================
// Knowledgebase Types - Core types for knowledgebase functionality
// =============================================================================

export type ManagerRole = 'admin' | 'editor' | 'viewer' | 'approver'

export interface Manager {
  userId: string
  role: ManagerRole
}

export interface Knowledgebase {
  id: number
  banner_url: string | null
  image_url: string | null
  name: string | null
  description: string | null
  notes_ids: string[]
  managers: Manager[]
  subscribers_ids: string[]
  created_at: string
  updated_at: string
}

export interface KnowledgebaseWithNotes extends Knowledgebase {
  latest_notes?: KnowledgebaseNote[] | null
}

export interface KnowledgebaseNote {
  id: number
  user_id: string
  title: string
  body: string
  knowledgebase_id: number | null
  similarity?: number
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface KnowledgebaseCreatePayload {
  banner_url?: string
  image_url?: string
  name: string
  description?: string
  userId: string
}

export interface KnowledgebaseUpdatePayload {
  banner_url?: string
  image_url?: string
  name?: string
  description?: string
  managers?: Manager[]
  notes_ids?: string[]
}

export interface KnowledgebaseSearchPayload {
  query: string
  filter?: 'all' | 'knowledgebases' | 'notes'
}

export interface KnowledgebaseSearchResponse {
  knowledgebases: Knowledgebase[]
  notes: KnowledgebaseNote[]
}

export interface KnowledgebaseHomeResponse {
  featured: Knowledgebase[]
  subscribed: KnowledgebaseWithNotes[]
  myKnowledgebases: Knowledgebase[]
}

export interface KnowledgebaseQueryPayload {
  question: string
  knowledgebase_id?: number
}

export interface KnowledgebaseQueryResponse {
  notes: KnowledgebaseNote[]
  sources: {
    title: string
    url: string
    snippet: string
    noteId: number
  }[]
}

export interface SubscribePayload {
  user_id: string
}

export interface NoteAddPayload {
  note_id: number
}

// =============================================================================
// Component Props Types
// =============================================================================

export interface KnowledgebaseCardProps {
  knowledgebase: Knowledgebase
  onClick?: () => void
  showActions?: boolean
  isManaged?: boolean
}

export interface KnowledgebaseSearchBarProps {
  onSearch: (query: string, filter: 'all' | 'knowledgebases' | 'notes') => void
  placeholder?: string
  initialFilter?: 'all' | 'knowledgebases' | 'notes'
}

export interface ManagerListProps {
  managers: Manager[]
  isAdmin?: boolean
  onAddManager?: (userId: string, role: ManagerRole) => void
  onRemoveManager?: (userId: string) => void
  onUpdateRole?: (userId: string, role: ManagerRole) => void
}

export interface NotesListProps {
  notes: KnowledgebaseNote[]
  userRole?: ManagerRole | null
  onViewNote?: (noteId: number) => void
  onSuggestEdit?: (noteId: number) => void
  onApprove?: (noteId: number) => void
  onReject?: (noteId: number) => void
}
