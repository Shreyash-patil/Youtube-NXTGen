import React from "react";
import { Button } from "./ui/button";
import { useTheme } from "@/lib/ThemeContext";

export const tabs = [
  { id: "home", label: "Home" },
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "playlists", label: "Playlists" },
  { id: "community", label: "Community" },
  { id: "about", label: "About" },
];
const Channeltabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`border-b px-3 sm:px-4 md:px-6 ${isDark ? "border-white/10" : ""}`}>
      <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`shrink-0 px-1 sm:px-0 py-3 sm:py-4 border-b-2 rounded-none whitespace-nowrap text-sm sm:text-base ${
              activeTab === tab.id
                ? isDark
                  ? "border-white text-white"
                  : "border-black text-black"
                : isDark
                ? "border-transparent text-gray-400 hover:text-white"
                : "border-transparent text-gray-600 hover:text-black"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Channeltabs;
