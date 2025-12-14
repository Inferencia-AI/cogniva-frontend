// =============================================================================
// Notes Types - Core types for notes functionality
// =============================================================================

export interface Note {
  id: number;
  user_id: string;
  title: string;
  body: string;
}

export interface NoteCreatePayload {
  userId: string;
  title: string;
  body?: string;
}

export interface NoteUpdatePayload {
  title: string;
  body: string;
}
