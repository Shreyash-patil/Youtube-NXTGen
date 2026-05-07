import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTheme } from "@/lib/ThemeContext";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochanel: string;
    filepath: string;
    views: number;
    createdAt: string;
  }>;
}
export default function RelatedVideos({ videos }: RelatedVideosProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!videos || videos.length === 0) {
    return null;
  }
  return (
    <div className="space-y-3">
      <h2 className="text-base sm:text-lg font-semibold lg:hidden">Up next</h2>
      <div className="space-y-2 sm:space-y-3">
        {videos.map((video) => (
          <Link
            key={video._id}
            href={`/watch/${video._id}`}
            className="flex gap-2 sm:gap-3 group"
          >
            <div
              className={`relative w-32 sm:w-40 aspect-video rounded overflow-hidden flex-shrink-0 ${
                isDark ? "bg-white/5" : "bg-gray-100"
              }`}
            >
              <video
                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video.filepath}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                preload="metadata"
                muted
                playsInline
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium text-xs sm:text-sm line-clamp-2 group-hover:text-blue-600 break-words ${
                  isDark ? "text-white" : ""
                }`}
              >
                {video.videotitle}
              </h3>
              <p
                className={`text-xs mt-1 line-clamp-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {video.videochanel}
              </p>
              <p
                className={`text-xs line-clamp-1 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {video.views?.toLocaleString?.() ?? 0} views
                {video.createdAt
                  ? ` • ${formatDistanceToNow(new Date(video.createdAt))} ago`
                  : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
