import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, logout, me, register } from "../controllers/auth.js";
import { requireAuth } from "../middleware/auth.js";

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

export const authRouter = Router();
authRouter.post("/register", limiter, register);
authRouter.post("/login", limiter, login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
