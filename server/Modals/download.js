import mongoose from "mongoose";

const downloadSchema = mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    videoId: { type: String, required: true, index: true },
    downloadedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("download", downloadSchema);
