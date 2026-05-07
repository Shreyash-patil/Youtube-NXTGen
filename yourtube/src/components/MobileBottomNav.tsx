import { Compass, Home, PlaySquare, User, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useUser } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match?: (path: string) => boolean;
};

const baseItems: Item[] = [
  { href: "/", label: "Home", icon: Home, match: (p) => p === "/" },
  { href: "/explore", label: "Explore", icon: Compass, match: (p) => p.startsWith("/explore") },
  { href: "/calls", label: "Calls", icon: Video, match: (p) => p.startsWith("/calls") },
  {
    href: "/subscriptions",
    label: "Subs",
    icon: PlaySquare,
    match: (p) => p.startsWith("/subscriptions"),
  },
];

const MobileBottomNav = () => {
  const router = useRouter();
  const { user } = useUser();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const items: Item[] = [
    ...baseItems,
    user?.channelname && user?._id
      ? {
          href: `/channel/${user._id}`,
          label: "You",
          icon: User,
          match: (p) => p.startsWith("/channel"),
        }
      : { href: "/history", label: "You", icon: User, match: (p) => p.startsWith("/history") },
  ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className={`md:hidden fixed bottom-0 inset-x-0 z-30 border-t pb-[env(safe-area-inset-bottom)] transition-colors duration-300 ${
        isDark
          ? "bg-[#0f0f0f] border-white/10"
          : "bg-white border-gray-200"
      }`}
    >
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon: Icon, match }) => {
          const isActive = match ? match(router.pathname) : router.pathname === href;
          return (
            <li key={label}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] leading-tight ${
                  isActive
                    ? isDark
                      ? "text-white"
                      : "text-black"
                    : isDark
                    ? "text-gray-500 hover:text-white"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "stroke-[2.25]" : ""}`}
                  aria-hidden="true"
                />
                <span className="truncate max-w-full px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
