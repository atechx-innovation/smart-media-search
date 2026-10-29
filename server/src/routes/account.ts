import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changePassword, deleteAccount, updateProfile } from "../controllers/account.js";
import { requireAuth } from "../middleware/auth.js";

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

export const accountRouter = Router();
accountRouter.use(requireAuth);
accountRouter.patch("/profile", updateProfile);
accountRouter.post("/password", limiter, changePassword);
accountRouter.delete("/", limiter, deleteAccount);
