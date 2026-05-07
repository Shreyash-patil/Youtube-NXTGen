import mongoose from "mongoose";
const historyschema = mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    watchedon: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

historyschema.index({ viewer: 1, videoid: 1 }, { unique: true });

export default mongoose.model("history", historyschema);
