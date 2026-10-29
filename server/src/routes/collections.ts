import { Router } from "express";
import { createCollection, deleteCollection, getCollection, listCollections, updateCollection } from "../controllers/collections.js";
import { requireAuth } from "../middleware/auth.js";

export const collectionsRouter = Router();
collectionsRouter.use(requireAuth);
collectionsRouter.get("/", listCollections);
collectionsRouter.post("/", createCollection);
collectionsRouter.get("/:id", getCollection);
collectionsRouter.patch("/:id", updateCollection);
collectionsRouter.delete("/:id", deleteCollection);
