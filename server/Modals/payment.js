import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["created", "captured", "failed"],
      default: "created",
    },
    plan: {
      type: String,
      enum: ["bronze", "silver", "gold"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("payment", paymentSchema);
