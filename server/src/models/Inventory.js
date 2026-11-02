import mongoose from "mongoose";

const invSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  quantity: { type: Number, default: 1, min: 0 },
}, { timestamps: true });

invSchema.index({ user: 1, item: 1 }, { unique: true });

export const Inventory = mongoose.model("Inventory", invSchema);