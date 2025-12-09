export type ChatRole = "human" | "ai";

export interface AiSnippet {
  text?: string;
  code?: string;
  language?: string;
}

export interface AiSource {
  title?: string;
  url?: string;
  snippet?: string;
}

export interface AiSection {
  topic?: string;
  response?: string | AiSnippet[];
  sources?: AiSource[];
  images?: string[];
  date?: string;
  captchaUrl?: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string | AiSection[];
}

export interface ChatSummary {
  id: number;
  messages: ChatMessage[];
}
