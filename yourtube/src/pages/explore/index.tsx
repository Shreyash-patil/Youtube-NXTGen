import Videogrid from "@/components/Videogrid";
import React from "react";

const ExplorePage = () => {
  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Explore</h1>
        <Videogrid />
      </div>
    </main>
  );
};

export default ExplorePage;
