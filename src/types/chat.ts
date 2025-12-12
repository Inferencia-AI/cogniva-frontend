export type ChatRole = "human" | "ai";

export type WebAnswerSectionType = "answer" | "image" | "promoted" | "wikipedia" | "duckduckgo" | "others";

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
  type?: WebAnswerSectionType;
  topic?: string;
  response?: string | AiSnippet[];
  sources?: AiSource[];
  images?: string[];
  date?: string;
  captchaUrl?: string;
  promoted?: PromotedAnswerData;
  wikipedia?: WikipediaAnswerData;
  duckduckgo?: DuckDuckGoAnswerData;
  others?: OtherAnswerData[];
  image?: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string | AiSection[];
}

export interface ChatSummary {
  id: number;
  messages: ChatMessage[];
}

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
  data?: {
    images?: string[];
    texts?: string[];
    links?: (string | null)[];
  };
}