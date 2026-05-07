import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
  // Either email or phone that received the OTP
  target: { type: String, required: true },
  // "email" or "sms"
  method: { type: String, enum: ["email", "sms"], required: true },
  otp: { type: String, required: true },
  // The user's email (used to link OTP to the login attempt)
  userEmail: { type: String, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-expire after 5 minutes
});

export default mongoose.model("otp", otpSchema);
