import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { Collection } from "../models/Collection.js";
import { Media } from "../models/Media.js";
import { Message } from "../models/Message.js";

/** Deletes media records (and their searchable OCR text), files, collection links and message attachments. */
export async function deleteMediaDocs(ownerId: string, docs: { _id: unknown; storedFile: string }[]) {
  if (!docs.length) return 0;
  const ids = docs.map((d) => d._id);
  await Media.deleteMany({ _id: { $in: ids }, ownerId });
  await Collection.updateMany({ ownerId }, { $pull: { mediaIds: { $in: ids } } });
  await Message.deleteMany({ mediaId: { $in: ids }, text: "" }); // image-only messages go away with the image
  await Message.updateMany({ mediaId: { $in: ids } }, { $unset: { mediaId: 1 } });
  await Promise.all(docs.map((d) => fs.unlink(path.join(env.uploadDir, d.storedFile)).catch(() => {})));
  return ids.length;
}
