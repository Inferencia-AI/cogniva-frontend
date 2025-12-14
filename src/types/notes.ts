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

// =============================================================================
// Document Upload Types
// =============================================================================

export const ALLOWED_DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/rtf': ['.rtf'],
  'text/rtf': ['.rtf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/markdown': ['.md'],
  'text/x-markdown': ['.md'],
} as const;

export const ALLOWED_EXTENSIONS = ['.pdf', '.rtf', '.docx', '.md'] as const;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface DocumentUploadResponse {
  success: boolean;
  note: Note;
  metadata: {
    originalFileName: string;
    fileSize: number;
    mimeType: string;
  };
}

export interface DocumentUploadError {
  error: string;
  code: 'FILE_TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'PARSE_ERROR';
}
