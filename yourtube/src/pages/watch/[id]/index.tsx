import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";

const PLAN_WATCH_LIMITS: Record<string, number | null> = {
  free: 300,    // 5 minutes
  bronze: 420,  // 7 minutes
  silver: 600,  // 10 minutes
  gold: null,   // unlimited
};

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser() as any;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const videoId = typeof id === "string" ? id : null;
  const [videos, setvideo] = useState<any>(null);
  const [allVideos, setAllVideos] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const commentsRef = useRef<HTMLDivElement>(null);

  const userPlan = user?.plan || "free";
  const watchLimitSeconds = PLAN_WATCH_LIMITS[userPlan] ?? 300;

  // Fetch single video by ID + all videos for related sidebar
  useEffect(() => {
    const fetchvideo = async () => {
      if (!videoId) return;
      try {
        const [singleRes, allRes] = await Promise.all([
          axiosInstance.get(`/video/${videoId}`),
          axiosInstance.get("/video/getall"),
        ]);
        setvideo(singleRes.data);
        setAllVideos(allRes.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, [videoId]);

  if (loading) {
    return <div>Loading..</div>;
  }
  
  if (!videos) {
    return <div>Video not found</div>;
  }

  const handleStarted = async () => {
    if (!videoId || !user?._id) return;
    try {
      await axiosInstance.post(`/history/${videoId}`, { userId: user._id });
    } catch (error) {
      console.log(error);
    }
  };

  const handleTrackedView = async () => {
    if (!videoId) return;
    try {
      await axiosInstance.post(`/history/views/${videoId}`);
      setvideo((prev: any) =>
        prev ? { ...prev, views: (prev.views || 0) + 1 } : prev
      );
    } catch (error) {
      console.log(error);
    }
  };

  // Triple-tap center → navigate to the next video in the list
  const handleNextVideo = () => {
    if (!allVideos || !Array.isArray(allVideos) || allVideos.length === 0) return;
    const currentIdx = allVideos.findIndex((v: any) => v._id === videoId);
    const nextIdx = (currentIdx + 1) % allVideos.length;
    const nextVideo = allVideos[nextIdx];
    if (nextVideo?._id && nextVideo._id !== videoId) {
      router.push(`/watch/${nextVideo._id}`);
    }
  };

  // Backward button → navigate to previous video
  const handlePrevVideo = () => {
    if (!allVideos || !Array.isArray(allVideos) || allVideos.length === 0) return;
    const currentIdx = allVideos.findIndex((v: any) => v._id === videoId);
    const prevIdx = (currentIdx - 1 + allVideos.length) % allVideos.length;
    const prevVideo = allVideos[prevIdx];
    if (prevVideo?._id && prevVideo._id !== videoId) {
      router.push(`/watch/${prevVideo._id}`);
    }
  };

  // Triple-tap left → scroll to comments section
  const handleOpenComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f]" : "bg-white"}`}>
      <div className="max-w-7xl mx-auto p-2 sm:p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 min-w-0">
            <Videopplayer
              video={videos}
              userPlan={userPlan}
              watchLimitSeconds={watchLimitSeconds}
              onStarted={handleStarted}
              onTrackedView={handleTrackedView}
              onNextVideo={handleNextVideo}
              onPrevVideo={handlePrevVideo}
              onOpenComments={handleOpenComments}
            />
            <VideoInfo video={videos} />
            <div ref={commentsRef}>
              {videoId && <Comments videoId={videoId} />}
            </div>
          </div>
          <div className="space-y-4 min-w-0">
            <RelatedVideos videos={allVideos} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
