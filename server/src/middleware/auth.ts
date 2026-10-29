import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.sid;
  if (!token) return next(new AppError(401, "Authentication required"));
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    next();
  } catch {
    next(new AppError(401, "Session expired. Please log in again."));
  }
};
