import {
  Home,
  Compass,
  PlaySquare,
  Video,
  Clock,
  ThumbsUp,
  History,
  User,
  Download,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

type SidebarProps = {
  isOpen: boolean;
  onClose?: () => void;
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isdialogeopen, setisdialogeopen] = useState(false);

  const handleLinkClick = () => {
    onClose?.();
  };

  return (
    <aside
      aria-label="Primary"
      className={`fixed left-0 top-0 z-40 h-[100dvh] w-[78vw] max-w-72 border-r p-2 overflow-y-auto transition-transform duration-200 ease-out md:sticky md:top-14 md:z-10 md:h-[calc(100dvh-3.5rem)] md:max-w-none md:w-64 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:hidden"
      } ${
        isDark
          ? "bg-[#0f0f0f] border-white/10"
          : "bg-white border-gray-200"
      }`}
    >
      <nav className="space-y-1">
        <Link href="/" onClick={handleLinkClick}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
          >
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/calls" onClick={handleLinkClick}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
          >
            <Video className="w-5 h-5 mr-3" />
            Calls
          </Button>
        </Link>
        <Link href="/explore" onClick={handleLinkClick}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
          >
            <Compass className="w-5 h-5 mr-3" />
            Explore
          </Button>
        </Link>
        <Link href="/subscriptions" onClick={handleLinkClick}>
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
          >
            <PlaySquare className="w-5 h-5 mr-3" />
            Subscriptions
          </Button>
        </Link>
        <Link href="/premium" onClick={handleLinkClick}>
          <Button
            variant="ghost"
            className="w-full justify-start text-amber-600 hover:text-amber-700"
          >
            <Sparkles className="w-5 h-5 mr-3" />
            Premium
            {user?.plan && user.plan !== "free" && (
              <span className="ml-auto text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                {user.plan}
              </span>
            )}
          </Button>
        </Link>

        {user && (
          <>
            <div className={`border-t pt-2 mt-2 ${isDark ? "border-white/10" : ""}`}>
              <Link href="/history" onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
                >
                  <History className="w-5 h-5 mr-3" />
                  History
                </Button>
              </Link>
              <Link href="/liked" onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
                >
                  <ThumbsUp className="w-5 h-5 mr-3" />
                  Liked videos
                </Button>
              </Link>
              <Link href="/watch-later" onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  Watch later
                </Button>
              </Link>
              <Link href="/downloads" onClick={handleLinkClick}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
                >
                  <Download className="w-5 h-5 mr-3" />
                  Downloads
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user._id}`} onClick={handleLinkClick}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${isDark ? "text-white hover:bg-white/10" : ""}`}
                  >
                    <User className="w-5 h-5 mr-3" />
                    Your channel
                  </Button>
                </Link>
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
            </div>
          </>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
