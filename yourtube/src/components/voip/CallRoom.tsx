import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";
import useCallSignaling from "./useCallSignaling";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function CallRoom({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const { user } = useUser();

  const userId = user?._id || "";
  const {
    status,
    localStream,
    remoteStreamEntries,
    toggleScreenShare,
    isScreenSharing,
  } = useCallSignaling(roomCode, userId);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const drawRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (!user) return;
    if (!roomCode) return;
  }, [user, roomCode]);

  // Recording loop: draw all participant videos onto the canvas.
  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const participants: { key: string; video: HTMLVideoElement | null }[] = [];
    participants.push({ key: "local", video: localVideoRef.current });
    for (const [peerId] of remoteStreamEntries) {
      participants.push({ key: peerId, video: remoteVideoRefs.current.get(peerId) || null });
    }

    // Simple grid layout.
    const count = participants.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const tileW = Math.floor(canvas.width / cols);
    const tileH = Math.floor(canvas.height / rows);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    participants.forEach((p, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = col * tileW;
      const y = row * tileH;
      const w = tileW;
      const h = tileH;
      const v = p.video;
      if (v && v.readyState >= 2) {
        ctx.drawImage(v, x, y, w, h);
      }
    });
  };

  const startRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!localStream) {
      toast.error("Local media not ready yet");
      return;
    }

    // Configure a stable recording canvas.
    canvas.width = 1280;
    canvas.height = 720;

    const mixedStream = canvas.captureStream(30);
    const mimeCandidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    let mimeType: string | undefined;
    for (const m of mimeCandidates) {
      if ((window as any).MediaRecorder?.isTypeSupported?.(m)) {
        mimeType = m;
        break;
      }
    }

    const recorder = new MediaRecorder(mixedStream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `call-${roomCode}-${ts}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    // Draw loop for the canvas.
    const tick = () => {
      drawGrid();
      drawRafRef.current = requestAnimationFrame(tick);
    };
    drawRafRef.current = requestAnimationFrame(tick);

    recorder.start(1000);
    setIsRecording(true);
    toast.success("Recording started");
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      recorder.stop();
    } catch {
      // ignore
    }
    if (drawRafRef.current) cancelAnimationFrame(drawRafRef.current);
    drawRafRef.current = null;
    setIsRecording(false);
    toast.success("Recording downloaded");
  };

  if (!user) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto text-center py-12 sm:py-16">
          <h1 className="text-xl sm:text-2xl font-semibold mb-3">Group Call</h1>
          <p className="text-gray-600">You need to sign in first to join the call.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold truncate">
              Room: {roomCode}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">Status: {status}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 sm:flex-none bg-gray-100 text-gray-800 hover:bg-gray-200"
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? "Stop sharing" : "Share Screen"}
            </Button>
            <Button
              size="sm"
              className={`flex-1 sm:flex-none ${
                isRecording
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              onClick={() => (isRecording ? stopRecording() : startRecording())}
            >
              {isRecording ? "⏹ Stop recording" : "⏺ Record"}
            </Button>
            <Button
              size="sm"
              className="flex-1 sm:flex-none bg-red-100 text-red-700 border border-red-300 hover:bg-red-600 hover:text-white"
              onClick={() => {
                router.push("/calls");
              }}
            >
              Leave
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={(el) => {
                localVideoRef.current = el;
                if (el && localStream) el.srcObject = localStream;
              }}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {remoteStreamEntries.length === 0 ? (
            <div className="relative bg-white border rounded-lg p-6 text-gray-600">
              Waiting for others to join...
            </div>
          ) : (
            remoteStreamEntries.map(([peerId, stream]) => (
              <div key={peerId} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={(el) => {
                    if (el) remoteVideoRefs.current.set(peerId, el);
                    else remoteVideoRefs.current.delete(peerId);
                    if (el) el.srcObject = stream;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {peerId.slice(-4)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Hidden canvas used for MediaRecorder. */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </main>
  );
}

