import { Schema, model } from "mongoose";

const messageSchema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
  text: { type: String, default: "" },
  sender: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  mediaId: { type: Schema.Types.ObjectId, ref: "Media" },
});
messageSchema.index({ text: "text" });

export const Message = model("Message", messageSchema);
