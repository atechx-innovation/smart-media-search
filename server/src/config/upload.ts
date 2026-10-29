import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import { env } from "./env.js";
import { AppError } from "../utils/errors.js";

export const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

fs.mkdirSync(env.uploadDir, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    // random server-chosen name; the user's filename never touches the disk path
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + ALLOWED[file.mimetype]),
  }),
  limits: { fileSize: env.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new AppError(400, "Only JPEG, PNG and WebP images are allowed")),
});
