import { RequestHandler } from "express";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import { z } from "zod";
import { env } from "../config/env.js";
import { hasImageSignature } from "../utils/imageSignature.js";
import { Conversation } from "../models/Conversation.js";
import { Media } from "../models/Media.js";
import { deleteMediaDocs } from "../services/mediaCleanup.js";
import { enqueueOcr } from "../services/ocr.js";
import { AppError } from "../utils/errors.js";

export const toDTO = (m: any) => ({
  id: m.id,
  originalFilename: m.originalFilename,
  mimeType: m.mimeType,
  size: m.size,
  extractedText: m.extractedText,
  description: m.description,
  status: m.status,
  ocrError: m.ocrError ?? null,
  ocrProgress: m.ocrProgress,
  uploadedAt: m.uploadedAt,
  conversationId: m.conversationId ?? null,
  isDemo: m.isDemo,
});

/** Every lookup includes ownerId, so another user's id behaves exactly like a missing one (404). */
async function findOwned(id: string, ownerId: string) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, "Image not found");
  const media = await Media.findOne({ _id: id, ownerId });
  if (!media) throw new AppError(404, "Image not found");
  return media;
}

const removeFile = (name: string) => fs.unlink(`${env.uploadDir}/${name}`).catch(() => {});

export const uploadMedia: RequestHandler = async (req, res, next) => {
  const file = req.file;
  try {
    if (!file) throw new AppError(400, "No file received");
    const head = Buffer.alloc(12);
    const fh = await fs.open(file.path, "r");
    await fh.read(head, 0, 12, 0);
    await fh.close();
    if (!hasImageSignature(head, file.mimetype)) throw new AppError(400, "File content does not match an image type");
    const media = await Media.create({
      ownerId: req.userId,
      originalFilename: file.originalname.slice(0, 200),
      storedFile: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      status: "pending",
    });
    enqueueOcr(media.id);
    res.status(201).json({ ok: true, media: toDTO(media) });
  } catch (e) {
    if (file) await removeFile(file.filename);
    next(e);
  }
};

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["pending", "processing", "done", "failed"]).optional(),
});

export const listMedia: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit, status } = listSchema.parse(req.query);
    const filter: Record<string, unknown> = { ownerId: req.userId };
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      Media.find(filter).sort({ uploadedAt: -1 }).skip((page - 1) * limit).limit(limit),
      Media.countDocuments(filter),
    ]);
    res.json({ ok: true, items: items.map(toDTO), total, page, limit });
  } catch (e) { next(e); }
};

export const getMedia: RequestHandler = async (req, res, next) => {
  try {
    const media = await findOwned(req.params.id, req.userId!);
    const conv = media.conversationId ? await Conversation.findOne({ _id: media.conversationId, ownerId: req.userId }) : null;
    res.json({ ok: true, media: { ...toDTO(media), conversationName: conv?.displayName ?? null } });
  } catch (e) { next(e); }
};

export const getFile: RequestHandler = async (req, res, next) => {
  try {
    const media = await findOwned(req.params.id, req.userId!);
    const path = `${env.uploadDir}/${media.storedFile}`;
    res.setHeader("Cache-Control", "private, max-age=3600");
    if (req.query.download) return res.download(path, media.originalFilename);
    res.type(media.mimeType).sendFile(path);
  } catch (e) { next(e); }
};

export const deleteMedia: RequestHandler = async (req, res, next) => {
  try {
    const media = await findOwned(req.params.id, req.userId!);
    await deleteMediaDocs(req.userId!, [media]); // OCR text lives on the media document, so search data goes with it
    res.json({ ok: true });
  } catch (e) { next(e); }
};

export const reprocessMedia: RequestHandler = async (req, res, next) => {
  try {
    const media = await findOwned(req.params.id, req.userId!);
    if (media.status === "pending" || media.status === "processing") throw new AppError(409, "Already being processed");
    media.status = "pending";
    media.ocrError = undefined;
    media.ocrProgress = 0;
    await media.save();
    enqueueOcr(media.id);
    res.json({ ok: true, media: toDTO(media) });
  } catch (e) { next(e); }
};

export const deleteAllMedia: RequestHandler = async (req, res, next) => {
  try {
    const docs = await Media.find({ ownerId: req.userId });
    res.json({ ok: true, deleted: await deleteMediaDocs(req.userId!, docs) });
  } catch (e) { next(e); }
};

export const updateMedia: RequestHandler = async (req, res, next) => {
  try {
    const { description } = z.object({ description: z.string().trim().max(500) }).parse(req.body);
    const media = await findOwned(req.params.id, req.userId!);
    media.description = description;
    await media.save();
    res.json({ ok: true, media: toDTO(media) });
  } catch (e) { next(e); }
};
