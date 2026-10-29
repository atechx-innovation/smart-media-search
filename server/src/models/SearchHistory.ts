import { Schema, model } from "mongoose";

const searchHistorySchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  query: { type: String, required: true },
  filterType: { type: String, default: "all" },
  timestamp: { type: Date, default: Date.now },
});
searchHistorySchema.index({ ownerId: 1, timestamp: -1 });

export const SearchHistory = model("SearchHistory", searchHistorySchema);
