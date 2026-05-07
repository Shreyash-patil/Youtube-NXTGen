import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema(
  {
    subscriber: { type: String, required: true },
    channel: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export default mongoose.model("subscription", subscriptionSchema);
