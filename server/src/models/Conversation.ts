import { Schema, model } from "mongoose";

const conversationSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  displayName: { type: String, required: true },
  avatar: { type: String, default: "" },
  isDemo: { type: Boolean, default: true },
});

export const Conversation = model("Conversation", conversationSchema);
