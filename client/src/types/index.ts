export interface User { id: string; name: string; email: string }

export type OcrStatus = "pending" | "processing" | "done" | "failed";

export interface MediaItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  extractedText: string;
  description: string;
  status: OcrStatus;
  ocrError: string | null;
  ocrProgress: number;
  uploadedAt: string;
  isDemo: boolean;
}

export type SearchType = "all" | "messages" | "photos" | "videos" | "documents";

export interface SearchResult {
  kind: "photo" | "message";
  id: string;
  score: number;
  date: string;
  snippet: string;
  conversationName: string | null;
  // photo
  filename?: string;
  status?: OcrStatus;
  isDemo?: boolean;
  // message
  sender?: string;
}

export interface SearchResponse {
  terms: string[];
  total: number;
  hasMore: boolean;
  truncated: boolean;
  demoOnly: boolean;
  results: SearchResult[];
}

export interface HistoryItem { id: string; query: string; filterType: SearchType; timestamp: string }

export interface ConversationSummary {
  id: string; displayName: string; avatar: string; isDemo: boolean;
  preview: string; lastAt: string | null; photoCount: number;
}
export interface ChatMessage {
  id: string; sender: string; text: string; timestamp: string; mine: boolean;
  media: { id: string; filename: string; status: OcrStatus } | null;
}

export interface CollectionSummary { id: string; name: string; count: number; mediaIds: string[]; createdAt: string }
export interface MediaDetail extends MediaItem { conversationName: string | null }
