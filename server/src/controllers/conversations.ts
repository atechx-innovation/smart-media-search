import { RequestHandler } from "express";
import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Media } from "../models/Media.js";
import { Message } from "../models/Message.js";
import { clearDemoForUser, seedDemoForUser } from "../services/demoSeed.js";
import { AppError } from "../utils/errors.js";
import { toDTO } from "./media.js";

async function findOwned(id: string, ownerId: string) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, "Conversation not found");
  const conv = await Conversation.findOne({ _id: id, ownerId });
  if (!conv) throw new AppError(404, "Conversation not found");
  return conv;
}

export const listConversations: RequestHandler = async (req, res, next) => {
  try {
    const convs = await Conversation.find({ ownerId: req.userId });
    const items = await Promise.all(convs.map(async (c) => {
      const [last, photoCount] = await Promise.all([
        Message.findOne({ conversationId: c._id }).sort({ timestamp: -1 }),
        Media.countDocuments({ ownerId: req.userId, conversationId: c._id }),
      ]);
      return {
        id: c.id, displayName: c.displayName, avatar: c.avatar, isDemo: c.isDemo,
        preview: last ? last.text || "Photo" : "No messages yet", lastAt: last?.timestamp ?? null, photoCount,
      };
    }));
    items.sort((a, b) => +new Date(b.lastAt ?? 0) - +new Date(a.lastAt ?? 0));
    res.json({ ok: true, items });
  } catch (e) { next(e); }
};

export const getConversation: RequestHandler = async (req, res, next) => {
  try {
    const conv = await findOwned(req.params.id, req.userId!);
    const messages = await Message.find({ conversationId: conv._id }).sort({ timestamp: 1 }).limit(300);
    const media = await Media.find({ _id: { $in: messages.map((m) => m.mediaId).filter(Boolean) }, ownerId: req.userId });
    const byId = new Map(media.map((m) => [m.id, m]));
    res.json({
      ok: true,
      conversation: { id: conv.id, displayName: conv.displayName, avatar: conv.avatar, isDemo: conv.isDemo },
      messages: messages.map((m) => {
        const md = m.mediaId ? byId.get(String(m.mediaId)) : undefined;
        return {
          id: m.id, sender: m.sender, text: m.text, timestamp: m.timestamp, mine: m.sender === "You",
          media: md ? { id: md.id, filename: md.originalFilename, status: md.status } : null,
        };
      }),
    });
  } catch (e) { next(e); }
};

export const getConversationMedia: RequestHandler = async (req, res, next) => {
  try {
    const conv = await findOwned(req.params.id, req.userId!);
    const items = await Media.find({ ownerId: req.userId, conversationId: conv._id }).sort({ uploadedAt: -1 });
    res.json({ ok: true, items: items.map(toDTO), demoOnly: { videos: true, documents: true } });
  } catch (e) { next(e); }
};

export const loadDemo: RequestHandler = async (req, res, next) => {
  try { res.status(201).json({ ok: true, ...(await seedDemoForUser(req.userId!)) }); } catch (e) { next(e); }
};
export const removeDemo: RequestHandler = async (req, res, next) => {
  try { res.json({ ok: true, ...(await clearDemoForUser(req.userId!)) }); } catch (e) { next(e); }
};
