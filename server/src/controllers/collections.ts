import { RequestHandler } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Collection } from "../models/Collection.js";
import { Media } from "../models/Media.js";
import { AppError } from "../utils/errors.js";
import { toDTO } from "./media.js";

const MAX_COLLECTIONS = 50;
const name = z.string().trim().min(1, "Name is required").max(60, "Name is too long");
const ids = z.array(z.string()).max(100);

const dto = (c: any) => ({
  id: c.id, name: c.name, count: c.mediaIds.length, createdAt: c.createdAt,
  mediaIds: c.mediaIds.map(String),
});

async function findOwned(id: string, ownerId: string) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, "Collection not found");
  const c = await Collection.findOne({ _id: id, ownerId });
  if (!c) throw new AppError(404, "Collection not found");
  return c;
}

async function assertUnique(ownerId: string, n: string, exceptId?: string) {
  const dup = await Collection.findOne({ ownerId, name: new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
  if (dup && dup.id !== exceptId) throw new AppError(409, "A collection with this name already exists");
}

/** Only the caller's own images can be put in a collection. */
async function assertOwnedMedia(list: string[], ownerId: string) {
  const unique = new Set(list);
  if (![...unique].every((i) => mongoose.isValidObjectId(i)) ||
      (await Media.countDocuments({ _id: { $in: [...unique] }, ownerId })) !== unique.size) throw new AppError(404, "Image not found");
}

export const listCollections: RequestHandler = async (req, res, next) => {
  try { res.json({ ok: true, items: (await Collection.find({ ownerId: req.userId }).sort({ createdAt: -1 })).map(dto) }); } catch (e) { next(e); }
};

export const createCollection: RequestHandler = async (req, res, next) => {
  try {
    const { name: n } = z.object({ name }).parse(req.body);
    if ((await Collection.countDocuments({ ownerId: req.userId })) >= MAX_COLLECTIONS) throw new AppError(400, "Collection limit reached");
    await assertUnique(req.userId!, n);
    res.status(201).json({ ok: true, collection: dto(await Collection.create({ ownerId: req.userId, name: n })) });
  } catch (e) { next(e); }
};

export const getCollection: RequestHandler = async (req, res, next) => {
  try {
    const c = await findOwned(req.params.id, req.userId!);
    const media = await Media.find({ _id: { $in: c.mediaIds }, ownerId: req.userId }).sort({ uploadedAt: -1 });
    res.json({ ok: true, collection: dto(c), media: media.map(toDTO) });
  } catch (e) { next(e); }
};

export const updateCollection: RequestHandler = async (req, res, next) => {
  try {
    const body = z.object({ name: name.optional(), addMediaIds: ids.optional(), removeMediaIds: ids.optional() }).parse(req.body);
    const c = await findOwned(req.params.id, req.userId!);
    if (body.name) { await assertUnique(req.userId!, body.name, c.id); c.name = body.name; await c.save(); }
    if (body.addMediaIds?.length) {
      await assertOwnedMedia(body.addMediaIds, req.userId!);
      await Collection.updateOne({ _id: c._id }, { $addToSet: { mediaIds: { $each: body.addMediaIds } } });
    }
    if (body.removeMediaIds?.length) await Collection.updateOne({ _id: c._id }, { $pull: { mediaIds: { $in: body.removeMediaIds } } });
    res.json({ ok: true, collection: dto(await findOwned(req.params.id, req.userId!)) });
  } catch (e) { next(e); }
};

export const deleteCollection: RequestHandler = async (req, res, next) => {
  try { await Collection.deleteOne({ _id: (await findOwned(req.params.id, req.userId!))._id }); res.json({ ok: true }); } catch (e) { next(e); }
};
