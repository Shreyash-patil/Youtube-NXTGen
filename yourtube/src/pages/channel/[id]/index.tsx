import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [videos, setVideos] = useState<any[]>([]);
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const [videosRes, channelRes] = await Promise.all([
          axiosInstance.get("/video/getall"),
          axiosInstance.get(`/user/${id}`),
        ]);
        const channelVideos = videosRes.data?.filter(
          (vid: any) => vid.uploader === id || vid.videochanel === id
        );
        setVideos(channelVideos || []);
        setChannel(channelRes.data);
      } catch (error) {
        console.error("Error fetching channel data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannelData();
  }, [id]);

  return (
    <div className={`flex-1 min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} />
        <Channeltabs activeTab={activeTab} onTabChange={setActiveTab} />

        {(activeTab === "home" || activeTab === "videos") && (
          <>
            <div className="px-3 sm:px-4 md:px-6 pb-6 sm:pb-8">
              <VideoUploader channelId={id} channelName={channel?.channelname} />
            </div>
            <div className="px-3 sm:px-4 md:px-6 pb-6 sm:pb-8">
              {loading ? (
                <div className="text-center py-12">Loading videos...</div>
              ) : (
                <ChannelVideos videos={videos} />
              )}
            </div>
          </>
        )}

        {(activeTab === "shorts" || activeTab === "playlists" || activeTab === "community") && (
          <div className={`px-3 sm:px-4 md:px-6 py-8 sm:py-10 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {activeTab[0].toUpperCase() + activeTab.slice(1)} section coming soon.
          </div>
        )}

        {activeTab === "about" && (
          <div className="px-3 sm:px-4 md:px-6 py-8 sm:py-10 space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold">About</h2>
            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{channel?.description || "No description available."}</p>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              {(channel?.subscribers || 0).toLocaleString()} subscribers
            </p>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Joined {channel?.joinedon ? new Date(channel.joinedon).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default index;
