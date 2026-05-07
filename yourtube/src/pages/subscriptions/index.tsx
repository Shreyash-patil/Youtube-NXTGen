import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import axiosInstance from "@/lib/axiosinstance";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const SubscriptionsPage = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/user/subscriptions/${user._id}`);
        setChannels(res.data || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    loadSubscriptions();
  }, [user?._id]);

  if (!user) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto text-center py-12 sm:py-16">
          <h1 className="text-xl sm:text-2xl font-semibold mb-3">Subscriptions</h1>
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            You need to sign in first to see subscribed channels.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Subscriptions</h1>
        {loading ? (
          <div>Loading subscriptions...</div>
        ) : channels.length === 0 ? (
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            No subscriptions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {channels.map((channel) => (
              <Link
                href={`/channel/${channel._id}`}
                key={channel._id}
                className={`block rounded-lg border p-3 sm:p-4 transition-colors ${
                  isDark
                    ? "border-white/10 hover:bg-white/5"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className={`font-medium ${isDark ? "text-white" : ""}`}>
                  {channel.channelname || "Unnamed Channel"}
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {(channel.subscribers || 0).toLocaleString()} subscribers
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default SubscriptionsPage;
