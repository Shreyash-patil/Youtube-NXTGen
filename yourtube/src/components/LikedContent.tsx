"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, X, ThumbsUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

export default function LikedVideosContent() {
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadLikedVideos();
    }
  }, [user]);

  const loadLikedVideos = async () => {
    if (!user) return;

    try {
      const likedData = await axiosInstance.get(`/like/${user?._id}`);
      const validVideos = likedData.data.filter((item: any) => item.videoid);
      setLikedVideos(validVideos);
    } catch (error) {
      console.error("Error loading liked videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlikeVideo = async (likedVideoId: string) => {
    if (!user) return;

    const previous = likedVideos;
    setLikedVideos(previous.filter((item) => item._id !== likedVideoId));
    try {
      await axiosInstance.delete(`/like/${likedVideoId}`);
      toast.success("Removed from liked videos");
    } catch (error) {
      setLikedVideos(previous);
      toast.error("Failed to remove from liked videos");
      console.error("Error unliking video:", error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Keep track of videos you like
        </h2>
        <p className="text-gray-600">Sign in to see your liked videos.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading liked videos...</div>;
  }

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <ThumbsUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No liked videos yet</h2>
        <p className="text-gray-600">Videos you like will appear here.</p>
      </div>
    );
  }
  const videos = "/video/vdo.mp4";
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <p className="text-sm text-gray-600">{likedVideos.length} videos</p>
        <Button size="sm" className="flex items-center gap-2 shrink-0">
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Play all</span>
          <span className="sm:hidden">Play</span>
        </Button>
      </div>

      <div className="space-y-4">
        {likedVideos.map((item) => (
          <div
            key={item._id}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 group"
          >
            <Link
              href={`/watch/${item.videoid._id}`}
              className="flex-shrink-0 block w-full sm:w-40 md:w-48"
            >
              <div className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden">
                <video
                  src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${item.videoid?.filepath}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  preload="metadata"
                  muted
                  playsInline
                />
              </div>
            </Link>

            <div className="flex flex-1 gap-2 min-w-0">
              <div className="flex-1 min-w-0">
                <Link href={`/watch/${item.videoid._id}`}>
                  <h3 className="font-medium text-sm sm:text-base line-clamp-2 group-hover:text-blue-600 mb-1 break-words">
                    {item.videoid.videotitle}
                  </h3>
                </Link>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                  {item.videoid.videochanel}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                  {item.videoid.views.toLocaleString()} views •{" "}
                  {formatDistanceToNow(new Date(item.videoid.createdAt))} ago
                </p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  Liked {formatDistanceToNow(new Date(item.createdAt))} ago
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleUnlikeVideo(item._id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove from liked videos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
