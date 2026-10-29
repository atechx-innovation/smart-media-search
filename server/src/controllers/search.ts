import { RequestHandler } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { SearchHistory } from "../models/SearchHistory.js";
import { runSearch } from "../services/search.js";
import { AppError } from "../utils/errors.js";

const MAX_HISTORY = 50;

const querySchema = z.object({
  q: z.string().max(200).default(""),
  type: z.enum(["all", "messages", "photos", "videos", "documents"]).default("all"),
  sort: z.enum(["relevance", "date"]).default("relevance"),
  match: z.enum(["all", "any"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  conversationId: z.string().optional(),
  record: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export const search: RequestHandler = async (req, res, next) => {
  try {
    const { record, conversationId, ...p } = querySchema.parse(req.query);
    if (conversationId && !mongoose.isValidObjectId(conversationId)) throw new AppError(404, "Conversation not found");
    const out = await runSearch(req.userId!, { ...p, conversationId });
    const q = p.q.trim();
    // History is saved only for submitted searches (record=true), not for every keystroke.
    if (record && q.length >= 2 && p.page === 1) {
      await SearchHistory.findOneAndUpdate(
        { ownerId: req.userId, query: q, filterType: p.type },
        { timestamp: new Date() },
        { upsert: true }
      );
      const old = await SearchHistory.find({ ownerId: req.userId }).sort({ timestamp: -1 }).skip(MAX_HISTORY).select("_id");
      if (old.length) await SearchHistory.deleteMany({ _id: { $in: old.map((o) => o._id) } });
    }
    res.json({ ok: true, query: p.q, type: p.type, ...out });
  } catch (e) { next(e); }
};

export const getHistory: RequestHandler = async (req, res, next) => {
  try {
    const items = await SearchHistory.find({ ownerId: req.userId }).sort({ timestamp: -1 }).limit(10);
    res.json({ ok: true, items: items.map((h) => ({ id: h.id, query: h.query, filterType: h.filterType, timestamp: h.timestamp })) });
  } catch (e) { next(e); }
};

export const clearHistory: RequestHandler = async (req, res, next) => {
  try {
    await SearchHistory.deleteMany({ ownerId: req.userId });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

export const deleteHistoryItem: RequestHandler = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Not found");
    await SearchHistory.deleteOne({ _id: req.params.id, ownerId: req.userId });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
