import SearchResult from "@/components/SearchResult";
import { useRouter } from "next/router";
import React, { Suspense } from "react";

const index = () => {
  const router = useRouter();
  const { q } = router.query;
  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {q && (
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl font-medium mb-2 sm:mb-4 line-clamp-2 break-words">
              Search results for "{q}"
            </h1>
          </div>
        )}
        <Suspense fallback={<div>Loading search results...</div>}>
          <SearchResult query={q || ""} />
        </Suspense>
      </div>
    </main>
  );
};

export default index;
