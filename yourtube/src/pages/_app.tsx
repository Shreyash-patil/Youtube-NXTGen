import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import OTPVerificationModal from "@/components/OTPVerificationModal";
import { Toaster } from "@/components/ui/sonner";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { ThemeProvider, useTheme } from "../lib/ThemeContext";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function AppContent({ Component, pageProps }: { Component: any; pageProps: any }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  // Read persisted state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-open");
      if (saved !== null) {
        setIsSidebarOpen(saved === "true");
      }
    } catch {}
    setMounted(true);
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("sidebar-open", String(isSidebarOpen));
    } catch {}
  }, [isSidebarOpen, mounted]);

  // On mobile, close sidebar on route change for better UX
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen((prev) => {
          // Keep desktop state in localStorage, but visually close on mobile nav
          return prev;
        });
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // Lock body scroll only on mobile when sidebar overlay is shown
  useEffect(() => {
    const root = document.documentElement;
    const isMobile = window.innerWidth < 768;
    if (isSidebarOpen && isMobile) {
      root.style.overflow = "hidden";
    } else {
      root.style.overflow = "";
    }
    return () => {
      root.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0f0f0f] text-white" : "bg-white text-black"}`}>
      <Head>
        <title>Youtube-NXTGen</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content={isDark ? "#0f0f0f" : "#ffffff"} />
      </Head>
      <Header onToggleSidebar={handleToggleSidebar} />
      <Toaster />
      <OTPVerificationModal />
      <div className="flex relative">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={handleToggleSidebar}
          />
        )}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleToggleSidebar}
        />
        <div className="flex-1 min-w-0 pb-16 md:pb-0">
          <Component {...pageProps} />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        <AppContent Component={Component} pageProps={pageProps} />
      </ThemeProvider>
    </UserProvider>
  );
}
