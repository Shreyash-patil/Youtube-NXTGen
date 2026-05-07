"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  Sparkles,
  SkipForward,
  SkipBack,
  Pause,
  Play,
  MessageSquare,
  X,
} from "lucide-react";
import Link from "next/link";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  userPlan?: string;
  watchLimitSeconds?: number | null; // null = unlimited
  onStarted?: () => void;
  onTrackedView?: () => void;
  onNextVideo?: () => void;
  onPrevVideo?: () => void;
  onOpenComments?: () => void;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

type GestureFeedback = {
  type:
    | "forward"
    | "backward"
    | "play"
    | "pause"
    | "next"
    | "comments"
    | "close";
  id: number;
};

export default function VideoPlayer({
  video,
  userPlan = "free",
  watchLimitSeconds = 300,
  onStarted,
  onTrackedView,
  onNextVideo,
  onPrevVideo,
  onOpenComments,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasTrackedRef = useRef(false);
  const hasStartedRef = useRef(false);
  const watchTimeRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [limitReached, setLimitReached] = useState(false);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [gestureFeedback, setGestureFeedback] =
    useState<GestureFeedback | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUnlimited = watchLimitSeconds === null;

  // ─── Tap tracking ───────────────────────────────────────────────
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapZoneRef = useRef<"left" | "center" | "right">("center");
  const feedbackIdRef = useRef(0);

  const showFeedback = useCallback((type: GestureFeedback["type"]) => {
    const id = ++feedbackIdRef.current;
    setGestureFeedback({ type, id });
    setTimeout(() => {
      setGestureFeedback((prev) => (prev?.id === id ? null : prev));
    }, 800);
  }, []);

  // ─── Show/hide controls with auto-hide ──────────────────────────
  const revealControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    revealControls();
  }, [revealControls]);

  const handleMouseLeave = useCallback(() => {
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    setShowControls(false);
  }, []);

  // ─── Gesture handler ────────────────────────────────────────────
  const handleGestureTap = useCallback(
    (zone: "left" | "center" | "right", tapCount: number) => {
      const vid = videoRef.current;
      if (!vid || limitReached) return;

      if (tapCount === 1 && zone === "center") {
        if (vid.paused) {
          vid.play();
        } else {
          vid.pause();
        }
      } else if (tapCount === 2 && zone === "right") {
        vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);
        showFeedback("forward");
      } else if (tapCount === 2 && zone === "left") {
        vid.currentTime = Math.max(0, vid.currentTime - 10);
        showFeedback("backward");
      } else if (tapCount === 3 && zone === "center") {
        showFeedback("next");
        setTimeout(() => onNextVideo?.(), 400);
      } else if (tapCount === 3 && zone === "right") {
        showFeedback("close");
        setTimeout(() => window.close(), 400);
      } else if (tapCount === 3 && zone === "left") {
        showFeedback("comments");
        onOpenComments?.();
      }
    },
    [limitReached, onNextVideo, onOpenComments, showFeedback]
  );

  // ─── Overlay click → gesture detection ──────────────────────────
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const relX = x / rect.width;

      let zone: "left" | "center" | "right";
      if (relX < 0.33) zone = "left";
      else if (relX > 0.67) zone = "right";
      else zone = "center";

      if (tapCountRef.current > 0 && tapZoneRef.current !== zone) {
        tapCountRef.current = 0;
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      }

      tapZoneRef.current = zone;
      tapCountRef.current += 1;

      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

      tapTimerRef.current = setTimeout(() => {
        const count = tapCountRef.current;
        const z = tapZoneRef.current;
        tapCountRef.current = 0;
        handleGestureTap(z, count);
      }, 350);

      revealControls();
    },
    [handleGestureTap, revealControls]
  );

  // ─── Direct button clicks ──────────────────────────────────────
  const handleBackwardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPrevVideo?.();
      revealControls();
    },
    [onPrevVideo, revealControls]
  );

  const handlePlayPauseClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const vid = videoRef.current;
      if (!vid) return;
      if (vid.paused) {
        vid.play();
      } else {
        vid.pause();
      }
      revealControls();
    },
    [revealControls]
  );

  const handleForwardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNextVideo?.();
      revealControls();
    },
    [onNextVideo, revealControls]
  );

  // ─── Reset on video change ──────────────────────────────────────
  useEffect(() => {
    hasTrackedRef.current = false;
    hasStartedRef.current = false;
    watchTimeRef.current = 0;
    lastTickRef.current = null;
    setLimitReached(false);
    setWatchedSeconds(0);
    tapCountRef.current = 0;
    setShowControls(false);
    setIsPlaying(false);

    // Force reload the video element when src changes
    const vid = videoRef.current;
    if (vid) {
      vid.load();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, [video?._id]);

  // ─── Watch time tracking ────────────────────────────────────────
  useEffect(() => {
    if (isUnlimited) return;

    timerRef.current = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.paused || vid.ended) {
        lastTickRef.current = null;
        return;
      }

      const now = Date.now();
      if (lastTickRef.current) {
        const delta = (now - lastTickRef.current) / 1000;
        if (delta > 0 && delta < 2) {
          watchTimeRef.current += delta;
          setWatchedSeconds(Math.floor(watchTimeRef.current));

          if (
            watchLimitSeconds !== null &&
            watchTimeRef.current >= watchLimitSeconds
          ) {
            vid.pause();
            setLimitReached(true);
          }
        }
      }
      lastTickRef.current = now;
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [video?._id, watchLimitSeconds, isUnlimited]);

  const handleTimeUpdate = () => {
    // View tracking is handled in handlePlay (on first play)
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStarted?.();
    }
    // Count a view on first play — works for videos of any length
    if (!hasTrackedRef.current) {
      hasTrackedRef.current = true;
      onTrackedView?.();
    }
    lastTickRef.current = Date.now();
  };

  const handlePause = () => {
    setIsPlaying(false);
    lastTickRef.current = null;
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Feedback config ────────────────────────────────────────────
  const feedbackConfig: Record<
    GestureFeedback["type"],
    { icon: React.ReactNode; label: string; position: string }
  > = {
    forward: {
      icon: <SkipForward className="w-8 h-8" />,
      label: "+10s",
      position: "right-8",
    },
    backward: {
      icon: <SkipBack className="w-8 h-8" />,
      label: "-10s",
      position: "left-8",
    },
    play: {
      icon: <Play className="w-10 h-10" />,
      label: "Play",
      position: "left-1/2 -translate-x-1/2",
    },
    pause: {
      icon: <Pause className="w-10 h-10" />,
      label: "Pause",
      position: "left-1/2 -translate-x-1/2",
    },
    next: {
      icon: <SkipForward className="w-10 h-10" />,
      label: "Next Video",
      position: "left-1/2 -translate-x-1/2",
    },
    comments: {
      icon: <MessageSquare className="w-8 h-8" />,
      label: "Comments",
      position: "left-8",
    },
    close: {
      icon: <X className="w-8 h-8" />,
      label: "Close",
      position: "right-8",
    },
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* key forces React to remount <video> when video ID changes */}
      <video
        key={video?._id}
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay
        poster={`/placeholder.svg?height=480&width=854`}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${video?.filepath}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Gesture overlay — covers top 80% to leave native controls accessible */}
      {!limitReached && (
        <div
          className="absolute inset-0 bottom-[15%] z-[5]"
          onClick={handleOverlayClick}
        />
      )}

      {/* Center control buttons — auto-hide after 3s */}
      {!limitReached && (
        <div
          className={`absolute inset-0 bottom-[15%] flex items-center justify-center z-[6] pointer-events-none transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-8">
            <button
              type="button"
              className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
              onClick={handleBackwardClick}
              aria-label="Previous video"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
              onClick={handlePlayPauseClick}
              aria-label="Play or pause"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-0.5" />
              )}
            </button>
            <button
              type="button"
              className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
              onClick={handleForwardClick}
              aria-label="Next video"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Gesture feedback animation */}
      {gestureFeedback && (
        <div
          key={gestureFeedback.id}
          className={`absolute top-1/2 -translate-y-1/2 ${feedbackConfig[gestureFeedback.type].position} z-[8] pointer-events-none animate-gesture-pop`}
        >
          <div className="flex flex-col items-center gap-1 bg-black/60 backdrop-blur-sm text-white rounded-2xl px-5 py-3">
            {feedbackConfig[gestureFeedback.type].icon}
            <span className="text-xs font-semibold">
              {feedbackConfig[gestureFeedback.type].label}
            </span>
          </div>
        </div>
      )}

      {/* Watch time indicator */}
      {!isUnlimited && !limitReached && watchedSeconds > 0 && (
        <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none z-[7]">
          <Clock className="w-3 h-3" />
          {formatTime(watchedSeconds)} /{" "}
          {formatTime(watchLimitSeconds as number)}
        </div>
      )}

      {/* Gesture guide — shows on hover briefly */}
      <div
        className={`absolute bottom-[16%] left-1/2 -translate-x-1/2 z-[7] transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-black/70 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap">
          1-tap: pause • 2-tap: ±10s • 3-tap: next/comments/close
        </div>
      </div>

      {/* Limit reached overlay */}
      {limitReached && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center px-6 max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">
              Watch Limit Reached
            </h3>
            <p className="text-gray-300 text-sm mb-1">
              Your{" "}
              <span className="text-amber-400 font-semibold">
                {PLAN_LABELS[userPlan] || "Free"}
              </span>{" "}
              plan allows{" "}
              {watchLimitSeconds
                ? `${Math.floor(watchLimitSeconds / 60)} minutes`
                : "limited"}{" "}
              of video per session.
            </p>
            <p className="text-gray-400 text-xs mb-5">
              Upgrade your plan to enjoy more watch time!
            </p>
            <Link href="/premium">
              <button className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-semibold px-6 py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl text-sm">
                <Sparkles className="w-4 h-4" />
                Upgrade Plan
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
