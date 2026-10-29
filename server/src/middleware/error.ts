import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { AppError } from "../utils/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ ok: false, error: err.issues[0]?.message ?? "Invalid request" });
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({ ok: false, error: tooBig ? "File is too large" : "Upload failed" });
  }
  if (err instanceof AppError) return res.status(err.status).json({ ok: false, error: err.message });
  console.error(err);
  res.status(500).json({ ok: false, error: "Something went wrong" });
};
