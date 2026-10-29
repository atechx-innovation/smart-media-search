import { Router } from "express";
import { getConversation, getConversationMedia, listConversations, loadDemo, removeDemo } from "../controllers/conversations.js";
import { requireAuth } from "../middleware/auth.js";

export const conversationsRouter = Router();
conversationsRouter.use(requireAuth);
conversationsRouter.get("/", listConversations);
conversationsRouter.post("/demo", loadDemo); // explicit opt-in: adds flagged demo data to this account only
conversationsRouter.delete("/demo", removeDemo);
conversationsRouter.get("/:id", getConversation);
conversationsRouter.get("/:id/media", getConversationMedia);
