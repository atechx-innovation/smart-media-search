import { Schema, model } from "mongoose";

const mediaSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    originalFilename: { type: String, required: true },
    storedFile: { type: String, required: true }, // file reference only, never the file bytes
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    extractedText: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "processing", "done", "failed"], default: "pending" },
    ocrError: { type: String },
    ocrProgress: { type: Number, default: 0 },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false } }
);
mediaSchema.index({ extractedText: "text", originalFilename: "text", description: "text" });
mediaSchema.index({ ownerId: 1, uploadedAt: -1 });

export const Media = model("Media", mediaSchema);
