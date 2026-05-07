import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";
import { useTheme } from "@/lib/ThemeContext";

const Videogrid = () => {
  const [videos, setvideo] = useState<any>(null);
  const [loading, setloading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        setvideo(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2 sm:space-y-3 animate-pulse">
            <div
              className={`aspect-video rounded-lg ${
                isDark ? "bg-white/10" : "bg-gray-200"
              }`}
            />
            <div className="flex gap-3">
              <div
                className={`w-9 h-9 rounded-full flex-shrink-0 ${
                  isDark ? "bg-white/10" : "bg-gray-200"
                }`}
              />
              <div className="flex-1 space-y-2">
                <div
                  className={`h-4 rounded w-3/4 ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`h-3 rounded w-1/2 ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
                <div
                  className={`h-3 rounded w-2/3 ${
                    isDark ? "bg-white/10" : "bg-gray-200"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div
        className={`text-center py-12 ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        No videos found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {videos.map((video: any) => (
        <Videocard key={video._id} video={video} />
      ))}
    </div>
  );
};

export default Videogrid;
