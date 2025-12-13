// =============================================================================
// Chat Types - Core types for chat functionality
// =============================================================================

export type ChatRole = "human" | "ai";

export type WebAnswerSectionType = "answer" | "image" | "promoted" | "wikipedia" | "duckduckgo" | "others" | "articles";

// =============================================================================
// Source Types - Used for displaying sources/references
// =============================================================================

export interface Source {
  title?: string;
  url?: string;
  snippet?: string;
}

// =============================================================================
// AI Response Types - Structured responses from AI
// =============================================================================

export interface AiSnippet {
  text?: string;
  code?: string;
  language?: string;
}

export interface AiSection {
  type?: WebAnswerSectionType;
  topic?: string;
  response?: string | AiSnippet[];
  sources?: Source[];
  images?: string[];
  date?: string;
  captchaUrl?: string;
  promoted?: PromotedAnswerData;
  wikipedia?: WikipediaAnswerData;
  duckduckgo?: DuckDuckGoAnswerData;
  others?: OtherAnswerData[];
  articles?: ProcessedArticle[];
  image?: string;
}

// =============================================================================
// Message Types - Chat messages and history
// =============================================================================

export interface ChatMessage {
  role: ChatRole;
  content: string | AiSection[];
}

export interface ChatSummary {
  id: number;
  messages: ChatMessage[];
}

// =============================================================================
// Web Answer Types - Responses from web search
// =============================================================================

export interface PromotedAnswerData {
  heading?: string;
  summary?: string;
  images?: string[];
  links?: string[];
}

export interface WikipediaAnswerData {
  question?: string;
  summary?: string;
  references?: string[];
}

export interface DuckDuckGoAnswerData {
  answer?: string;
  link?: string;
}

export interface OtherAnswerData {
  link?: string;
  data?: OtherAnswerContent;
}

export interface OtherAnswerContent {
  images?: (string | null)[];
  texts?: string[];
  links?: (string | null)[];
}

// =============================================================================
// API Response Types - Backend response structures
// =============================================================================

export interface UserData {
  user: {
    uid: string;
    name: string;
    email: string;
    picture: string;
  };
}

export interface WebSearchResponse {
  answer?: string;
  image?: string;
  promoted?: PromotedAnswerData;
  wikipedia_answer?: WikipediaAnswerData;
  duckduckgo_answer?: DuckDuckGoAnswerData;
  others?: OtherAnswerData[];
  articles?: Article[];
}

export interface Article {
  url?: string;
  title?: string;
  text?: string;
  authors?: string[];
  published_date?: string;
}

export interface ProcessedArticle {
  url?: string;
  title?: string;
  summary?: string;
  authors?: string[];
  published_date?: string;
  image?: string;
}

export interface ScrapUrlResponse {
  html?: string;
  description?: string;
}

export interface PreviewBlock {
  blockType?: string;
  description?: string;
  content?: string;
}