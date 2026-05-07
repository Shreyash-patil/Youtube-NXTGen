import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useTheme } from "@/lib/ThemeContext";

const ChannelHeader = ({ channel, user }: any) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setSubscribersCount(channel?.subscribers || 0);
  }, [channel?.subscribers]);

  useEffect(() => {
    const getSubscriptionStatus = async () => {
      if (!user?._id || !channel?._id || user._id === channel._id) {
        setIsSubscribed(false);
        return;
      }
      try {
        const res = await axiosInstance.get(
          `/user/subscribe/status/${channel._id}/${user._id}`
        );
        setIsSubscribed(!!res.data?.subscribed);
      } catch (error) {
        console.log(error);
      }
    };
    getSubscriptionStatus();
  }, [channel?._id, user?._id]);

  const handleSubscribe = async () => {
    if (!user?._id || !channel?._id || user._id === channel._id) return;
    try {
      const res = await axiosInstance.post(`/user/subscribe/${channel._id}`, {
        userId: user._id,
      });
      setIsSubscribed(!!res.data?.subscribed);
      setSubscribersCount(res.data?.subscribers || 0);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="w-full">
      <div className="relative h-24 sm:h-32 md:h-48 lg:h-64 bg-gradient-to-r from-blue-400 to-purple-500 overflow-hidden"></div>

      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 shrink-0">
            <AvatarFallback className="text-xl sm:text-2xl">
              {channel?.channelname?.[0] || "C"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold break-words">
              {channel?.channelname}
            </h1>
            <div className={`flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              <span className="truncate max-w-full">
                @{channel?.channelname?.toLowerCase()?.replace(/\s+/g, "")}
              </span>
              <span>{subscribersCount.toLocaleString()} subscribers</span>
              <span>{(channel?.stats?.videos || 0).toLocaleString()} videos</span>
              <span>{(channel?.stats?.views || 0).toLocaleString()} views</span>
            </div>
            {channel?.description && (
              <p className={`text-sm max-w-2xl break-words ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {channel?.description}
              </p>
            )}
          </div>

          {user && user?._id !== channel?._id && (
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                onClick={handleSubscribe}
                variant={isSubscribed ? "outline" : "default"}
                className={`w-full md:w-auto ${
                  isSubscribed ? "bg-gray-100" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelHeader;
