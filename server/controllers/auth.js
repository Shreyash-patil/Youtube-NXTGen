import mongoose from "mongoose";
import crypto from "crypto";
import Razorpay from "razorpay";
import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import subscription from "../Modals/subscription.js";
import payment from "../Modals/payment.js";
import { sendInvoiceEmail } from "./emailService.js";

// ─── Plan configuration ───────────────────────────────────────────
const PLAN_CONFIG = {
  bronze: { amount: 1000, label: "Bronze", watchLimitMinutes: 7 },
  silver: { amount: 5000, label: "Silver", watchLimitMinutes: 10 },
  gold: { amount: 10000, label: "Gold", watchLimitMinutes: null }, // unlimited
};

const PLAN_TIERS = ["free", "bronze", "silver", "gold"];

const FREE_WATCH_LIMIT_MINUTES = 5;

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── Auth endpoints ───────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getuserbyid = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const user = await users.findById(id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const [videoCount, channelStats] = await Promise.all([
      video.countDocuments({ uploader: id }),
      video.aggregate([
        { $match: { uploader: id } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      ...user,
      stats: {
        videos: videoCount,
        views: channelStats[0]?.totalViews || 0,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── Plan endpoints ───────────────────────────────────────────────

export const getplanlimits = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const targetUser = await users.findById(userId).select("plan").lean();
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const plan = targetUser.plan || "free";
    let watchLimitSeconds = FREE_WATCH_LIMIT_MINUTES * 60; // default free

    if (plan !== "free") {
      const cfg = PLAN_CONFIG[plan];
      watchLimitSeconds = cfg?.watchLimitMinutes
        ? cfg.watchLimitMinutes * 60
        : null; // null = unlimited
    }

    return res.status(200).json({ plan, watchLimitSeconds });
  } catch (error) {
    console.error("Get plan limits error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const createplanorder = async (req, res) => {
  const { userId, plan } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (!plan || !PLAN_CONFIG[plan]) {
    return res
      .status(400)
      .json({ message: "Invalid plan. Choose bronze, silver, or gold." });
  }

  try {
    const targetUser = await users.findById(userId).select("_id plan");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has this plan or a higher one
    const currentTier = PLAN_TIERS.indexOf(targetUser.plan || "free");
    const requestedTier = PLAN_TIERS.indexOf(plan);

    if (requestedTier <= currentTier) {
      return res.status(200).json({
        alreadyOnPlan: true,
        message:
          currentTier === requestedTier
            ? `You are already on the ${PLAN_CONFIG[plan].label} plan`
            : `You already have a higher plan`,
      });
    }

    const client = getRazorpayClient();
    if (!client) {
      return res.status(500).json({
        message:
          "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      });
    }

    const planCfg = PLAN_CONFIG[plan];

    const order = await client.orders.create({
      amount: planCfg.amount,
      currency: "INR",
      receipt: `${plan}_${userId.toString().slice(-8)}_${Date.now()}`,
      notes: { userId, plan },
    });

    await payment.create({
      userId,
      razorpayOrderId: order.id,
      amount: planCfg.amount,
      currency: "INR",
      status: "created",
      plan,
    });

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      planLabel: planCfg.label,
    });
  } catch (error) {
    console.error("Create plan order error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyplanpayment = async (req, res) => {
  const {
    userId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !razorpayOrderId ||
    !razorpayPaymentId ||
    !razorpaySignature
  ) {
    return res.status(400).json({ message: "Invalid payment payload" });
  }

  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res
        .status(500)
        .json({ message: "Razorpay secret is not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      await payment.findOneAndUpdate(
        { razorpayOrderId },
        {
          $set: {
            razorpayPaymentId,
            razorpaySignature,
            status: "failed",
          },
        }
      );
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Get the plan from the payment record
    const paymentRecord = await payment.findOne({ razorpayOrderId }).lean();
    const purchasedPlan = paymentRecord?.plan || "bronze";
    const planCfg = PLAN_CONFIG[purchasedPlan];

    await Promise.all([
      payment.findOneAndUpdate(
        { razorpayOrderId },
        {
          $set: {
            razorpayPaymentId,
            razorpaySignature,
            status: "captured",
          },
        }
      ),
      users.findByIdAndUpdate(
        userId,
        {
          $set: {
            plan: purchasedPlan,
            planActivatedAt: new Date(),
          },
        },
        { new: true }
      ),
    ]);

    const updatedUser = await users.findById(userId).lean();

    // Send invoice email (fire and forget – don't block response)
    sendInvoiceEmail({
      userEmail: updatedUser.email,
      userName: updatedUser.name || updatedUser.email,
      planName: planCfg.label,
      amountINR: planCfg.amount / 100,
      paymentId: razorpayPaymentId,
      orderId: razorpayOrderId,
      date: new Date(),
      watchLimit: planCfg.watchLimitMinutes,
    }).catch((err) => console.error("Invoice email error:", err));

    return res.status(200).json({
      message: `${planCfg.label} plan activated successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Verify plan payment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── Subscription endpoints ──────────────────────────────────────

export const togglesubscription = async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(channelId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (channelId === userId) {
    return res.status(400).json({ message: "Cannot subscribe to yourself" });
  }

  try {
    const channelUser = await users.findById(channelId).select("_id");
    if (!channelUser) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const existing = await subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    if (existing) {
      await subscription.findByIdAndDelete(existing._id);
      const updatedUser = await users.findByIdAndUpdate(
        channelId,
        { $inc: { subscribers: -1 } },
        { new: true }
      );
      return res.status(200).json({
        subscribed: false,
        subscribers: Math.max(updatedUser?.subscribers || 0, 0),
      });
    }

    await subscription.create({ subscriber: userId, channel: channelId });
    const updatedUser = await users.findByIdAndUpdate(
      channelId,
      { $inc: { subscribers: 1 } },
      { new: true }
    );
    return res.status(200).json({
      subscribed: true,
      subscribers: updatedUser?.subscribers || 0,
    });
  } catch (error) {
    console.error("Toggle subscribe error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getsubscriptionstatus = async (req, res) => {
  const { channelId, userId } = req.params;
  if (
    !mongoose.Types.ObjectId.isValid(channelId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const existing = await subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });
    return res.status(200).json({ subscribed: !!existing });
  } catch (error) {
    console.error("Get subscribe status error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getsubscribedchannels = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  try {
    const subscriptions = await subscription
      .find({ subscriber: userId })
      .lean();
    const channelIds = subscriptions.map((item) => item.channel);
    const channels = await users
      .find({ _id: { $in: channelIds } })
      .select("_id channelname description image subscribers")
      .lean();
    return res.status(200).json(channels);
  } catch (error) {
    console.error("Get subscriptions error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const searchusers = async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) {
    return res.status(200).json([]);
  }

  // Basic text search: match email/name/channelname with a case-insensitive regex.
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  try {
    const results = await users
      .find({
        $or: [{ email: regex }, { name: regex }, { channelname: regex }],
      })
      .select("_id email name channelname image subscribers")
      .limit(10)
      .lean();
    return res.status(200).json(results);
  } catch (error) {
    console.error("Search users error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
