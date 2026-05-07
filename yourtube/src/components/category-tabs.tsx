"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/ThemeContext";

const categories = [
  "All",
  "Music",
  "Gaming",
  "Movies",
  "News",
  "Sports",
  "Technology",
  "Comedy",
  "Education",
  "Science",
  "Travel",
  "Food",
  "Fashion",
];

export default function CategoryTabs() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-thin">
      {categories.map((category) => (
        <Button
          key={category}
          size="sm"
          variant={activeCategory === category ? "default" : "secondary"}
          className={`whitespace-nowrap shrink-0 ${
            isDark
              ? activeCategory === category
                ? "bg-white text-black hover:bg-gray-200"
                : "bg-white/10 text-white hover:bg-white/20 border-0"
              : ""
          }`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
