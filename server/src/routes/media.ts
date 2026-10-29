import { Router } from "express";
import rateLimit from "express-rate-limit";
import { upload } from "../config/upload.js";
import { deleteAllMedia, deleteMedia, getFile, getMedia, listMedia, reprocessMedia, updateMedia, uploadMedia } from "../controllers/media.js";
import { requireAuth } from "../middleware/auth.js";

const uploadLimiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

export const mediaRouter = Router();
mediaRouter.use(requireAuth);
mediaRouter.post("/upload", uploadLimiter, upload.single("file"), uploadMedia);
mediaRouter.get("/", listMedia);
mediaRouter.get("/:id", getMedia);
mediaRouter.get("/:id/file", getFile);
mediaRouter.delete("/", deleteAllMedia);
mediaRouter.patch("/:id", updateMedia);
mediaRouter.delete("/:id", deleteMedia);
mediaRouter.post("/:id/reprocess", reprocessMedia);
