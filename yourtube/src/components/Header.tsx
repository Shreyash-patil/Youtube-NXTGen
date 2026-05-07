import { Bell, Menu, Mic, Search, User, VideoIcon } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import axiosInstance from "@/lib/axiosinstance";

const Header = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
  const { user, logout, handlegooglesignin } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [searchQuery, setSearchQuery] = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        const all = res.data || [];
        const lower = q.toLowerCase();
        const matches = all
          .filter(
            (v: any) =>
              v.videotitle?.toLowerCase().includes(lower) ||
              v.videochanel?.toLowerCase().includes(lower)
          )
          .slice(0, 6);
        setSuggestions(matches);
        setShowSuggestions(true);
      } catch (error) {
        console.log(error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        suggestionsBoxRef.current &&
        !suggestionsBoxRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSuggestionClick = (video: any) => {
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/watch/${video._id}`);
  };
  return (
    <header
      className={`sticky top-0 z-30 flex flex-wrap items-center justify-between px-3 sm:px-4 py-2 border-b gap-2 min-h-14 transition-colors duration-300 ${
        isDark
          ? "bg-[#0f0f0f] border-white/10 text-white"
          : "bg-white border-gray-200 text-black"
      }`}
    >
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className={isDark ? "text-white hover:bg-white/10" : ""}
        >
          <Menu className="w-6 h-6" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className={`text-base sm:text-xl font-medium ${isDark ? "text-white" : ""}`}>
            YouTube
          </span>
          <img
            src="/yt_nxt_gen_logo.png"
            alt="NXTGen"
            className="hidden sm:block h-8 w-auto self-end mb-1 object-contain"
          />
        </Link>
      </div>
      <form
        onSubmit={handleSearch}
        className="order-3 sm:order-none flex items-center gap-2 w-full sm:flex-1 sm:max-w-2xl sm:mx-4"
      >
        <div className="flex flex-1 relative" ref={suggestionsBoxRef}>
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className={`rounded-l-full border-r-0 focus-visible:ring-0 ${
              isDark
                ? "bg-[#121212] border-white/20 text-white placeholder:text-gray-500"
                : ""
            }`}
          />
          <Button
            type="submit"
            className={`rounded-r-full px-6 border border-l-0 ${
              isDark
                ? "bg-white/10 hover:bg-white/15 text-gray-300 border-white/20"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600"
            }`}
          >
            <Search className="w-5 h-5" />
          </Button>

          {showSuggestions && suggestions.length > 0 && (
            <div
              className={`absolute top-full left-0 right-0 mt-2 border rounded-lg shadow-lg z-50 overflow-hidden ${
                isDark
                  ? "bg-[#1a1a2e] border-white/10"
                  : "bg-white border-gray-200"
              }`}
            >
              {suggestions.map((s: any) => (
                <button
                  type="button"
                  key={s._id}
                  onClick={() => handleSuggestionClick(s)}
                  className={`w-full text-left px-4 py-3 ${
                    isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                  }`}
                >
                  <div className={`text-sm font-medium line-clamp-1 ${isDark ? "text-white" : ""}`}>
                    {s.videotitle}
                  </div>
                  <div
                    className={`text-xs line-clamp-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {s.videochanel}
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowSuggestions(false);
                  if (searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className={`w-full text-left px-4 py-2 text-sm border-t ${
                  isDark
                    ? "text-blue-400 hover:bg-white/5 border-white/10"
                    : "text-blue-600 hover:bg-gray-50 border-gray-200"
                }`}
              >
                See all results
              </button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full hidden sm:inline-flex ${
            isDark ? "text-white hover:bg-white/10" : ""
          }`}
        >
          <Mic className="w-5 h-5" />
        </Button>
      </form>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {user ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className={`hidden sm:inline-flex ${isDark ? "text-white hover:bg-white/10" : ""}`}
              aria-label="Upload"
            >
              <VideoIcon className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`hidden sm:inline-flex ${isDark ? "text-white hover:bg-white/10" : ""}`}
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user?.channelname ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/channel/${user?._id}`}>Your channel</Link>
                  </DropdownMenuItem>
                ) : (
                  <div className="px-2 py-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => setisdialogeopen(true)}
                    >
                      Create Channel
                    </Button>
                  </div>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/history">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/liked">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watch-later">Watch later</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/downloads">Downloads</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/premium" className="font-medium text-amber-600">
                    Premium
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild size="sm" variant="outline" className="border-amber-400 text-amber-700">
              <Link href="/premium">Premium</Link>
            </Button>
            <Button
              size="sm"
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4"
              onClick={handlegooglesignin}
            >
              <User className="w-4 h-4" />
              <span>Sign in</span>
            </Button>
          </>
        )}{" "}
      </div>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </header>
  );
};

export default Header;
