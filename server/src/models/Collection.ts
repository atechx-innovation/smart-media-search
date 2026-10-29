import { Schema, model } from "mongoose";

const collectionSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: "Media" }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Collection = model("Collection", collectionSchema);
