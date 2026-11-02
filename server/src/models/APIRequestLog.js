import mongoose from "mongoose";
const logSchema = new mongoose.Schema({
  provider: { type: String, required: true, index: true },
  status: { type: String, enum: ["success", "failure"], required: true },
  responseTimeMs: Number,
  errorMessage: String,
  endpoint: String,
}, { timestamps: true });
logSchema.index({ createdAt: -1 });
export const APIRequestLog = mongoose.model("APIRequestLog", logSchema);