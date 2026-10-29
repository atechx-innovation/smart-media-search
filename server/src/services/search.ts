import { Conversation } from "../models/Conversation.js";
import { Media } from "../models/Media.js";
import { Message } from "../models/Message.js";
import { AppError } from "../utils/errors.js";
import { escapeRegex, makeSnippet, scoreDoc, tokenize } from "./searchCore.js";

export type SearchType = "all" | "messages" | "photos" | "videos" | "documents";
export interface SearchParams {
  q: string; type: SearchType; sort: "relevance" | "date"; match: "all" | "any";
  page: number; limit: number; conversationId?: string;
}

const CANDIDATE_CAP = 500; // prototype scale: score at most this many newest matches in memory

function textFilter(terms: string[], fields: string[], match: "all" | "any") {
  if (!terms.length) return {};
  const clauses = terms.map((t) => {
    const re = new RegExp(escapeRegex(t), "i");
    return { $or: fields.map((f) => ({ [f]: re })) };
  });
  return match === "all" ? { $and: clauses } : { $or: clauses.flatMap((c) => c.$or) };
}

export async function runSearch(ownerId: string, p: SearchParams) {
  const { terms, phrase } = tokenize(p.q);
  const base = { terms, page: p.page, limit: p.limit };

  // Videos and documents are demonstration categories only: nothing is indexed for them.
  if (p.type === "videos" || p.type === "documents") {
    return { ...base, total: 0, hasMore: false, truncated: false, demoOnly: true, results: [] };
  }

  const convs = await Conversation.find({ ownerId }).select("displayName");
  const convName = new Map(convs.map((c) => [c.id as string, c.displayName as string]));
  if (p.conversationId && !convName.has(p.conversationId)) throw new AppError(404, "Conversation not found");

  type Row = { kind: "photo" | "message"; id: string; score: number; date: Date; [k: string]: unknown };
  const rows: Row[] = [];
  let truncated = false;

  if (p.type === "all" || p.type === "photos") {
    const filter: Record<string, unknown> = { ownerId, ...textFilter(terms, ["extractedText", "originalFilename", "description"], p.match) };
    if (p.conversationId) filter.conversationId = p.conversationId;
    const docs = await Media.find(filter).sort({ uploadedAt: -1 }).limit(CANDIDATE_CAP);
    truncated ||= docs.length === CANDIDATE_CAP;
    for (const m of docs) {
      const { score, matched } = scoreDoc({ text: m.extractedText, filename: m.originalFilename, description: m.description }, terms, phrase);
      if (terms.length && p.match === "all" && matched < terms.length) continue;
      rows.push({
        kind: "photo", id: m.id, score, date: m.uploadedAt,
        filename: m.originalFilename, status: m.status, isDemo: m.isDemo,
        snippet: makeSnippet(m.extractedText ?? "", terms),
        conversationName: m.conversationId ? convName.get(String(m.conversationId)) ?? null : null,
      });
    }
  }

  if (p.type === "all" || p.type === "messages") {
    const filter: Record<string, unknown> = {
      conversationId: p.conversationId ?? { $in: [...convName.keys()] },
      ...textFilter(terms, ["text"], p.match),
    };
    const docs = await Message.find(filter).sort({ timestamp: -1 }).limit(CANDIDATE_CAP);
    truncated ||= docs.length === CANDIDATE_CAP;
    for (const m of docs) {
      if (!m.text) continue;
      const { score, matched } = scoreDoc({ text: m.text }, terms, phrase);
      if (terms.length && p.match === "all" && matched < terms.length) continue;
      rows.push({
        kind: "message", id: m.id, score, date: m.timestamp,
        text: m.text, snippet: makeSnippet(m.text, terms), sender: m.sender,
        conversationId: String(m.conversationId), conversationName: convName.get(String(m.conversationId)) ?? null,
      });
    }
  }

  const byDate = (a: Row, b: Row) => +b.date - +a.date;
  rows.sort(p.sort === "relevance" && terms.length ? (a, b) => b.score - a.score || byDate(a, b) : byDate);

  const start = (p.page - 1) * p.limit;
  return {
    ...base, total: rows.length, hasMore: start + p.limit < rows.length, truncated, demoOnly: false,
    results: rows.slice(start, start + p.limit),
  };
}
