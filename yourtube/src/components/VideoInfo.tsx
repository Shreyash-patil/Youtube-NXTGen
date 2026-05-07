import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import axiosInstance from "@/lib/axiosinstance";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useRouter } from "next/router";
import { toast } from "sonner";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video?.Like || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [dislikes, setDislikes] = useState(video?.Dislike || 0);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  useEffect(() => {
    setlikes(video?.Like || 0);
    setIsLiked(false);
    setDislikes(video?.Dislike || 0);
    setIsDisliked(false);
  }, [video]);

  useEffect(() => {
    const loadReactionStatus = async () => {
      if (!user?._id || !video?._id) return;
      try {
        const [likeRes, dislikeRes] = await Promise.all([
          axiosInstance.get(`/like/status/${video._id}/${user._id}`),
          axiosInstance.get(`/dislike/status/${video._id}/${user._id}`),
        ]);
        setIsLiked(!!likeRes.data?.liked);
        setIsDisliked(!!dislikeRes.data?.disliked);
      } catch (error) {
        console.log(error);
      }
    };
    loadReactionStatus();
  }, [user?._id, video?._id]);

  useEffect(() => {
    const fetchChannelData = async () => {
      if (!video?.uploader) {
        setChannelData(null);
        return;
      }
      try {
        const res = await axiosInstance.get(`/user/${video.uploader}`);
        setChannelData(res.data);
        setSubscribersCount(res.data?.subscribers || 0);
      } catch (error) {
        console.log(error);
        setChannelData(null);
        setSubscribersCount(0);
      }
    };
    fetchChannelData();
  }, [video?.uploader]);

  useEffect(() => {
    const getSubscriptionStatus = async () => {
      const targetChannelId = channelData?._id || video?.uploader;
      if (!user?._id || !targetChannelId || user._id === targetChannelId) {
        setIsSubscribed(false);
        return;
      }
      try {
        const res = await axiosInstance.get(
          `/user/subscribe/status/${targetChannelId}/${user._id}`
        );
        setIsSubscribed(!!res.data?.subscribed);
      } catch (error) {
        console.log(error);
      }
    };
    getSubscriptionStatus();
  }, [channelData?._id, user?._id, video?.uploader]);

  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      setIsLiked(!!res.data?.liked);
      setlikes(res.data?.Like ?? likes);
      setDislikes(res.data?.Dislike ?? dislikes);
      if (res.data?.liked) setIsDisliked(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/dislike/${video._id}`, {
        userId: user?._id,
      });
      setIsDisliked(!!res.data?.disliked);
      setlikes(res.data?.Like ?? likes);
      setDislikes(res.data?.Dislike ?? dislikes);
      if (res.data?.disliked) setIsLiked(false);
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleSubscribe = async () => {
    const targetChannelId = channelData?._id || video?.uploader;
    if (!user?._id || !targetChannelId || user._id === targetChannelId) return;
    try {
      const res = await axiosInstance.post(`/user/subscribe/${targetChannelId}`, {
        userId: user._id,
      });
      setIsSubscribed(!!res.data?.subscribed);
      setSubscribersCount(res.data?.subscribers || 0);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDownload = async () => {
    if (!user?._id) {
      toast.info("Please sign in to download videos");
      return;
    }
    try {
      const res = await axiosInstance.post(`/video/download/${video?._id}`, {
        userId: user._id,
      });
      const src = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${res.data.downloadPath}`;
      const a = document.createElement("a");
      a.href = src;
      a.download = video?.filename || `${video?.videotitle || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(
        res.data.plan && res.data.plan !== "free"
          ? "Download started"
          : `Download started. Remaining today: ${res.data.remainingDownloads}`
      );
    } catch (error: any) {
      const requiresPremium = error?.response?.data?.requiresPremium;
      if (requiresPremium) {
        toast.error("Free limit reached. Upgrade to Premium for unlimited downloads.");
        router.push("/premium");
        return;
      }
      toast.error(error?.response?.data?.message || "Could not download video");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/watch/${video?._id}`;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: video?.videotitle || "Video",
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch (error) {
      toast.error("Could not share link");
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-base sm:text-lg md:text-xl font-semibold break-words">
        {video.videotitle}
      </h1>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarFallback>
              {channelData?.channelname?.[0] || video?.videochanel?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 sm:flex-none">
            <h3 className="font-medium truncate">
              {channelData?.channelname || video.videochanel}
            </h3>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              {subscribersCount.toLocaleString()} subscribers
            </p>
          </div>
          {user && user?._id !== (channelData?._id || video?.uploader) && (
            <Button
              size="sm"
              className={`sm:ml-4 ${
                isSubscribed ? "bg-gray-100 text-black hover:bg-gray-200" : ""
              }`}
              variant={isSubscribed ? "outline" : "default"}
              onClick={handleSubscribe}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? (isDark ? "fill-white text-white" : "fill-black text-black") : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className={`w-px h-6 ${isDark ? "bg-white/20" : "bg-gray-300"}`} />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? (isDark ? "fill-white text-white" : "fill-black text-black") : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"} ${
              isWatchLater ? "text-primary" : ""
            }`}
            onClick={handleWatchLater}
            aria-label={isWatchLater ? "Saved to Watch Later" : "Save to Watch Later"}
          >
            <Clock className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">{isWatchLater ? "Saved" : "Watch Later"}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            onClick={handleShare}
            aria-label="Share"
          >
            <Share className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            onClick={handleDownload}
            aria-label="Download"
          >
            <Download className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}
                aria-label="More options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                Download video
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/watch/${video?._id}`
                  )
                }
              >
                Copy video link
              </DropdownMenuItem>
              {(channelData?._id || video?.uploader) && (
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/channel/${channelData?._id || video?.uploader}`)
                  }
                >
                  Go to channel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className={`rounded-lg p-3 sm:p-4 ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
        <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm font-medium mb-2">
          <span>{video?.views?.toLocaleString() ?? 0} views</span>
          <span>
            {video?.createdAt
              ? `${formatDistanceToNow(new Date(video.createdAt))} ago`
              : "Unknown"}
          </span>
        </div>
        <div
          className={`text-sm break-words ${
            showFullDescription ? "" : "line-clamp-3"
          }`}
        >
          <p>{video?.videodescription || "No description available."}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>
    </div>
  );
};

export default VideoInfo;
