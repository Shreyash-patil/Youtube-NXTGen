import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  phone: { type: String, default: "" },
  state: { type: String, default: "" },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  subscribers: { type: Number, default: 0 },
  plan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  planActivatedAt: { type: Date, default: null },
  joinedon: { type: Date, default: Date.now },
});

export default mongoose.model("user", userschema);
