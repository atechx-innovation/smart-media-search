import { Router } from "express";
import rateLimit from "express-rate-limit";
import { clearHistory, deleteHistoryItem, getHistory, search } from "../controllers/search.js";
import { requireAuth } from "../middleware/auth.js";

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false });

export const searchRouter = Router();
searchRouter.use(requireAuth);
searchRouter.get("/", limiter, search);
searchRouter.get("/history", getHistory);
searchRouter.delete("/history", clearHistory);
searchRouter.delete("/history/:id", deleteHistoryItem);
