import mongoose from "mongoose";

const videoViewSchema = mongoose.Schema({
  videoId: { type: String, required: true },
  ip: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now, expires: 3600 }, // TTL: auto-delete after 1 hour
});

// Compound index so we can quickly check "did this IP already view this video recently?"
videoViewSchema.index({ videoId: 1, ip: 1 });

export default mongoose.model("videoviews", videoViewSchema);
