import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axiosInstance from "@/lib/axiosinstance";
import { useTheme } from "@/lib/ThemeContext";

const SearchResult = ({ query }: any) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Enter a search term to find videos and channels.
        </p>
      </div>
    );
  }
  const [video, setvideos] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const videos = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/video/getall");
      const allVideos = res.data || [];
      const results = allVideos.filter(
        (vid: any) =>
          vid.videotitle?.toLowerCase().includes(query.toLowerCase()) ||
          vid.videochanel?.toLowerCase().includes(query.toLowerCase())
      );
      setvideos(results);
    } catch (error) {
      console.log(error);
      setvideos([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    videos();
  }, [query]);
  if (loading || !video) {
    return (
      <div className="text-center py-12">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading results...</p>
      </div>
    );
  }
  const hasResults = video ? video.length > 0 : true;
  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Try different keywords or remove search filters
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {video.length > 0 && (
        <div className="space-y-4">
          {video.map((video: any) => (
            <div
              key={video._id}
              className="flex flex-col md:flex-row gap-3 md:gap-4 group"
            >
              <Link
                href={`/watch/${video._id}`}
                className="flex-shrink-0 block w-full md:w-80"
              >
                <div
                  className={`relative w-full aspect-video rounded-lg overflow-hidden ${
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
              </Link>

              <div className="flex-1 min-w-0 py-1">
                <Link href={`/watch/${video._id}`}>
                  <h3
                    className={`font-medium text-base sm:text-lg line-clamp-2 group-hover:text-blue-600 mb-1 sm:mb-2 break-words ${
                      isDark ? "text-white" : ""
                    }`}
                  >
                    {video.videotitle}
                  </h3>
                </Link>

                <div
                  className={`flex items-center flex-wrap gap-x-2 gap-y-1 text-xs sm:text-sm mb-2 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  <span>{video.views?.toLocaleString?.() ?? 0} views</span>
                  <span>•</span>
                  <span>
                    {video.createdAt
                      ? `${formatDistanceToNow(new Date(video.createdAt))} ago`
                      : ""}
                  </span>
                </div>

                <Link
                  href={`/channel/${video.uploader}`}
                  className="flex items-center gap-2 mb-2 hover:text-blue-600"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    <AvatarFallback className="text-xs">
                      {video.videochanel?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`text-xs sm:text-sm truncate ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {video.videochanel}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasResults && (
        <div className="text-center py-6 sm:py-8">
          <p
            className={`text-sm sm:text-base ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Showing {video.length} results for "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResult;
