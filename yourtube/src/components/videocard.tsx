"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useTheme } from "@/lib/ThemeContext";

export default function VideoCard({ video }: any) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const channelName = video?.videochanel || "";
  const initial = channelName ? channelName[0] : "C";
  const views = typeof video?.views === "number" ? video.views : 0;
  const createdAt = video?.createdAt ? new Date(video.createdAt) : null;
  const createdLabel = createdAt && !isNaN(createdAt.getTime())
    ? `${formatDistanceToNow(createdAt)} ago`
    : "";

  return (
    <Link href={`/watch/${video?._id}`} className="group block">
      <div className="space-y-2 sm:space-y-3">
        <div
          className={`relative aspect-video rounded-lg overflow-hidden ${
            isDark ? "bg-white/5" : "bg-gray-100"
          }`}
        >
          <video
            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            preload="metadata"
            muted
            playsInline
          />
        </div>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-sm line-clamp-2 group-hover:text-blue-600 break-words ${
                isDark ? "text-white" : ""
              }`}
            >
              {video?.videotitle}
            </h3>
            <p
              className={`text-xs sm:text-sm mt-1 line-clamp-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {channelName}
            </p>
            <p
              className={`text-xs sm:text-sm line-clamp-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {views.toLocaleString()} views{createdLabel ? ` • ${createdLabel}` : ""}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
