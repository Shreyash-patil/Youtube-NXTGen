import { useState } from "react";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import axiosInstance from "@/lib/axiosinstance";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Crown, Shield, Star, Sparkles, Clock } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    id: "bronze",
    name: "Bronze",
    price: 10,
    watchLimit: "7 minutes",
    color: "from-amber-600 to-amber-800",
    bgCardLight: "bg-gradient-to-br from-amber-50 to-orange-50",
    bgCardDark: "bg-gradient-to-br from-amber-950/30 to-orange-950/20",
    borderLight: "border-amber-200",
    borderDark: "border-amber-800/50",
    badgeColor: "bg-amber-100 text-amber-800",
    badgeColorDark: "bg-amber-900/50 text-amber-300",
    buttonClass: "bg-amber-600 hover:bg-amber-700 text-white",
    accentText: "text-amber-700",
    accentTextDark: "text-amber-400",
    icon: Shield,
    features: [
      "Watch videos up to 7 minutes",
      "Unlimited downloads (Free: 1/day)",
      "Access all content",
    ],
  },
  {
    id: "silver",
    name: "Silver",
    price: 50,
    watchLimit: "10 minutes",
    color: "from-indigo-500 to-purple-700",
    bgCardLight: "bg-gradient-to-br from-indigo-50 to-purple-50",
    bgCardDark: "bg-gradient-to-br from-indigo-950/30 to-purple-950/20",
    borderLight: "border-indigo-200",
    borderDark: "border-indigo-800/50",
    badgeColor: "bg-indigo-100 text-indigo-800",
    badgeColorDark: "bg-indigo-900/50 text-indigo-300",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700 text-white",
    accentText: "text-indigo-700",
    accentTextDark: "text-indigo-400",
    icon: Star,
    features: [
      "Watch videos up to 10 minutes",
      "Unlimited downloads (Free: 1/day)",
      "Access all content",
      "Priority support",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 100,
    watchLimit: "Unlimited",
    color: "from-yellow-400 to-amber-600",
    bgCardLight: "bg-gradient-to-br from-yellow-50 to-amber-50",
    bgCardDark: "bg-gradient-to-br from-yellow-950/30 to-amber-950/20",
    borderLight: "border-yellow-300",
    borderDark: "border-yellow-700/50",
    badgeColor: "bg-yellow-100 text-yellow-800",
    badgeColorDark: "bg-yellow-900/50 text-yellow-300",
    buttonClass:
      "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg",
    accentText: "text-yellow-700",
    accentTextDark: "text-yellow-400",
    icon: Crown,
    recommended: true,
    features: [
      "Unlimited video watching",
      "Unlimited downloads (Free: 1/day)",
      "Access all content",
      "Priority support",
      "Exclusive features",
    ],
  },
];

const PLAN_TIERS = ["free", "bronze", "silver", "gold"];

export default function PremiumPage() {
  const { user, login, handlegooglesignin } = useUser() as any;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [loading, setLoading] = useState<string | null>(null);

  const userPlan = user?.plan || "free";
  const userTier = PLAN_TIERS.indexOf(userPlan);

  const loadRazorpayScript = async () => {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (planId: string) => {
    if (!user?._id) {
      toast.info("Please sign in first");
      return;
    }

    setLoading(planId);
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        toast.error("Could not load payment SDK");
        return;
      }

      const orderRes = await axiosInstance.post("/user/plan/order", {
        userId: user._id,
        plan: planId,
      });

      if (orderRes.data?.alreadyOnPlan) {
        toast.info(orderRes.data.message);
        return;
      }

      const plan = PLANS.find((p) => p.id === planId);

      const options = {
        key: orderRes.data.keyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "YourTube NXTGen",
        description: `${plan?.name || planId} Plan Upgrade`,
        order_id: orderRes.data.orderId,
        prefill: {
          name: user.name,
          email: user.email,
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await axiosInstance.post("/user/plan/verify", {
              userId: user._id,
              ...response,
            });

            login(verifyRes.data.user);
            toast.success(
              `${plan?.name || planId} plan activated! Check your email for the invoice.`
            );
          } catch (err: any) {
            toast.error(
              err?.response?.data?.message || "Verification failed"
            );
          }
        },
        theme: {
          color: planId === "gold" ? "#d97706" : planId === "silver" ? "#6366f1" : "#d97706",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4 ${
              isDark
                ? "bg-amber-900/40 text-amber-300"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Your Experience
          </div>
          <h1
            className={`text-3xl sm:text-4xl font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Choose Your Plan
          </h1>
          <p
            className={`mt-2 max-w-xl mx-auto ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Unlock longer video watching times. Free users can watch up to 5
            minutes per video. Upgrade to watch more!
          </p>

          {/* Current plan indicator */}
          {user && (
            <div
              className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                isDark
                  ? "bg-white/10 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <Clock className="w-4 h-4" />
              Current plan:{" "}
              <span className="font-semibold capitalize">{userPlan}</span>
              {userPlan === "free" && (
                <span className={isDark ? "text-gray-500" : "text-gray-500"}>
                  (5 min watch limit)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map((plan) => {
            const planTier = PLAN_TIERS.indexOf(plan.id);
            const isCurrent = userPlan === plan.id;
            const isLower = planTier <= userTier;
            const Icon = plan.icon;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-5 sm:p-6 flex flex-col transition-all duration-200 hover:shadow-lg ${
                  isDark
                    ? `${plan.borderDark} ${plan.bgCardDark}`
                    : `${plan.borderLight} ${plan.bgCardLight}`
                } ${
                  plan.recommended
                    ? "ring-2 ring-yellow-400 shadow-md"
                    : ""
                }`}
              >
                {/* Recommended badge */}
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                      RECOMMENDED
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.name}
                    </h2>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isDark ? plan.badgeColorDark : plan.badgeColor
                      }`}
                    >
                      {plan.watchLimit} watch time
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-bold ${
                        isDark ? plan.accentTextDark : plan.accentText
                      }`}
                    >
                      ₹{plan.price}
                    </span>
                    <span
                      className={isDark ? "text-sm text-gray-500" : "text-sm text-gray-500"}
                    >
                      one-time
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feat, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-2 text-sm ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {!user ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handlegooglesignin}
                  >
                    Sign in to upgrade
                  </Button>
                ) : isCurrent ? (
                  <Button className="w-full" disabled>
                    ✓ Current Plan
                  </Button>
                ) : isLower ? (
                  <Button className="w-full" disabled variant="outline">
                    Already unlocked
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${plan.buttonClass}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id}
                  >
                    {loading === plan.id
                      ? "Processing..."
                      : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Free plan info */}
        <div
          className={`mt-8 rounded-xl border p-5 sm:p-6 text-center ${
            isDark
              ? "bg-white/5 border-white/10"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <h3
            className={`font-semibold mb-1 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Free Plan
          </h3>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            All users start on the Free plan with a 5-minute watch limit per
            video and 1 download per day. Upgrade anytime to unlock more watch
            time and unlimited downloads.
          </p>
          <p
            className={`text-xs mt-2 ${
              isDark ? "text-gray-600" : "text-gray-400"
            }`}
          >
            Razorpay test mode — use test card/UPI for payments
          </p>
        </div>
      </div>
    </main>
  );
}
