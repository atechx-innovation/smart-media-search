import { RequestHandler } from "express";
import { Collection } from "../models/Collection.js";
import { Media } from "../models/Media.js";
import { SearchHistory } from "../models/SearchHistory.js";
import { toDTO } from "./media.js";

/** All numbers come from the database; nothing is hardcoded. */
export const dashboard: RequestHandler = async (req, res, next) => {
  try {
    const ownerId = req.userId;
    const [total, searchable, processing, failed, collections, recent, searches] = await Promise.all([
      Media.countDocuments({ ownerId }),
      Media.countDocuments({ ownerId, status: "done", extractedText: { $ne: "" } }),
      Media.countDocuments({ ownerId, status: { $in: ["pending", "processing"] } }),
      Media.countDocuments({ ownerId, status: "failed" }),
      Collection.find({ ownerId }).sort({ createdAt: -1 }).limit(4),
      Media.find({ ownerId }).sort({ uploadedAt: -1 }).limit(6),
      SearchHistory.find({ ownerId }).sort({ timestamp: -1 }).limit(5),
    ]);
    res.json({
      ok: true,
      stats: { total, searchable, processing, failed },
      collections: collections.map((c) => ({ id: c.id, name: c.name, count: c.mediaIds.length })),
      recentUploads: recent.map(toDTO),
      recentSearches: searches.map((h) => ({ id: h.id, query: h.query, filterType: h.filterType })),
    });
  } catch (e) { next(e); }
};
