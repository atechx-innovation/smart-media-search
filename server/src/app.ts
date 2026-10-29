import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { mediaRouter } from "./routes/media.js";
import { searchRouter } from "./routes/search.js";
import { conversationsRouter } from "./routes/conversations.js";
import { collectionsRouter } from "./routes/collections.js";
import { accountRouter } from "./routes/account.js";
import { dashboard } from "./controllers/dashboard.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";

export const app = express();
app.set("trust proxy", 1);
// images are loaded cross-origin by the frontend, so CORP must allow it
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRouter);
app.use("/api/media", mediaRouter);
app.use("/api/search", searchRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/account", accountRouter);
app.get("/api/dashboard", requireAuth, dashboard);

app.use((_req, res) => res.status(404).json({ ok: false, error: "Not found" }));
app.use(errorHandler);
