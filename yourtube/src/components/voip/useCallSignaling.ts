import { useCallback, useEffect, useMemo, useRef, useState } from "react";
type WsPayload =
  | {
      type: "join";
      roomCode: string;
      userId: string;
    }
  | {
      type: "leave";
      roomCode: string;
      userId: string;
    }
  | {
      type: "offer";
      roomCode: string;
      fromUserId: string;
      toUserId: string;
      sdp: any;
    }
  | {
      type: "answer";
      roomCode: string;
      fromUserId: string;
      toUserId: string;
      sdp: any;
    }
  | {
      type: "ice-candidate";
      roomCode: string;
      fromUserId: string;
      toUserId: string;
      candidate: any;
    }
  | {
      type: "peers-existing";
      roomCode: string;
      peers: string[];
    }
  | {
      type: "peer-joined";
      roomCode: string;
      peerUserId: string;
    }
  | {
      type: "peer-left";
      roomCode: string;
      peerUserId: string;
    };

type RemoteStreamsMap = Map<string, MediaStream>;

const deriveWsUrl = () => {
  const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
  const fallback = typeof window !== "undefined" ? window.location.origin : "";
  const base = backend || fallback;
  if (!base) return "";
  return base.replace(/^http(s)?:\/\//, (m) => (m.startsWith("https") ? "wss://" : "ws://"));
};

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
];

export default function useCallSignaling(roomCode: string, userId: string) {
  const wsUrl = useMemo(() => deriveWsUrl(), []);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamsMap>(new Map());
  const [status, setStatus] = useState<string>("connecting");

  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const pcByPeerIdRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceQueueByPeerIdRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  const wsRef = useRef<WebSocket | null>(null);

  const updateRemoteStream = useCallback((peerId: string, stream: MediaStream | null) => {
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      if (!stream) next.delete(peerId);
      else next.set(peerId, stream);
      return next;
    });
  }, []);

  const addIceCandidateWhenReady = useCallback(
    async (peerId: string, candidateInit: RTCIceCandidateInit, pc: RTCPeerConnection) => {
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(candidateInit);
          return;
        }
      } catch {
        // fallthrough to queue
      }

      const queue = iceQueueByPeerIdRef.current.get(peerId) || [];
      queue.push(candidateInit);
      iceQueueByPeerIdRef.current.set(peerId, queue);
    },
    []
  );

  const flushIceQueue = useCallback((peerId: string, pc: RTCPeerConnection) => {
    const queue = iceQueueByPeerIdRef.current.get(peerId) || [];
    if (!queue.length) return;
    for (const candidate of queue) {
      pc.addIceCandidate(candidate).catch(() => void 0);
    }
    iceQueueByPeerIdRef.current.delete(peerId);
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string) => {
      const existing = pcByPeerIdRef.current.get(peerId);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers });
      pcByPeerIdRef.current.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (!event.candidate || !wsRef.current) return;
        wsRef.current.send(
          JSON.stringify({
            type: "ice-candidate",
            roomCode,
            fromUserId: userId,
            toUserId: peerId,
            candidate: event.candidate,
          })
        );
      };

      pc.ontrack = (event) => {
        const [stream] = event.streams;
        if (stream) updateRemoteStream(peerId, stream);
      };

      // Add current local tracks (if available).
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          // Keep it simple: if it fails, clean up remote stream.
          try {
            pc.close();
          } catch {
            // ignore
          }
          pcByPeerIdRef.current.delete(peerId);
          updateRemoteStream(peerId, null);
        }
      };

      return pc;
    },
    [roomCode, userId, updateRemoteStream]
  );

  const setRemoteAndAnswer = useCallback(
    async (peerId: string, sdp: any) => {
      const pc = createPeerConnection(peerId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      flushIceQueue(peerId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsRef.current?.send(
        JSON.stringify({
          type: "answer",
          roomCode,
          fromUserId: userId,
          toUserId: peerId,
          sdp: answer,
        })
      );
    },
    [createPeerConnection, flushIceQueue, roomCode, userId]
  );

  const setRemoteDescription = useCallback(
    async (peerId: string, sdp: any) => {
      const pc = createPeerConnection(peerId);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      flushIceQueue(peerId, pc);
    },
    [createPeerConnection, flushIceQueue]
  );

  const createOffer = useCallback(
    async (peerId: string) => {
      const pc = createPeerConnection(peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      wsRef.current?.send(
        JSON.stringify({
          type: "offer",
          roomCode,
          fromUserId: userId,
          toUserId: peerId,
          sdp: offer,
        })
      );
    },
    [createPeerConnection, roomCode, userId]
  );

  const startMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    cameraStreamRef.current = stream;
    localStreamRef.current = stream;
    setLocalStream(stream);
    setStatus("ready");
  }, []);

  // Local media
  useEffect(() => {
    if (!roomCode || !userId) return;
    startMedia().catch((e) => {
      console.error(e);
      setStatus("media-permission-denied");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, userId]);

  // WS + join
  useEffect(() => {
    if (!wsUrl || !roomCode || !userId) return;
    if (!localStream) return; // wait for media so PCs can add tracks immediately

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("joined");
      ws.send(JSON.stringify({ type: "join", roomCode, userId } satisfies WsPayload));
    };

    ws.onmessage = async (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      const type = msg?.type;
      if (!type) return;

      // Server -> joiner existing peers list
      if (type === "peers-existing") {
        const peers: string[] = msg.peers || [];
        for (const peerId of peers) {
          createPeerConnection(peerId);
        }
        return;
      }

      // Server -> existing peers told about new peer: existing peers create offers.
      if (type === "peer-joined") {
        const peerId = msg.peerUserId;
        if (!peerId) return;
        createPeerConnection(peerId);
        // existing peer -> create offer to newcomer
        createOffer(peerId).catch(() => void 0);
        return;
      }

      if (type === "peer-left") {
        const peerId = msg.peerUserId;
        if (!peerId) return;
        const pc = pcByPeerIdRef.current.get(peerId);
        if (pc) {
          try {
            pc.close();
          } catch {
            // ignore
          }
        }
        pcByPeerIdRef.current.delete(peerId);
        updateRemoteStream(peerId, null);
        return;
      }

      if (type === "offer") {
        const fromUserId = msg.fromUserId;
        if (!fromUserId) return;
        // We are the intended recipient because WS server routes by toUserId.
        await setRemoteAndAnswer(fromUserId, msg.sdp);
        return;
      }

      if (type === "answer") {
        const fromUserId = msg.fromUserId;
        if (!fromUserId) return;
        await setRemoteDescription(fromUserId, msg.sdp);
        return;
      }

      if (type === "ice-candidate") {
        const fromUserId = msg.fromUserId;
        if (!fromUserId) return;
        const pc = createPeerConnection(fromUserId);
        await addIceCandidateWhenReady(fromUserId, msg.candidate, pc);
        return;
      }
    };

    ws.onerror = () => {
      setStatus("ws-error");
    };

    return () => {
      try {
        ws.send(JSON.stringify({ type: "leave", roomCode, userId }));
      } catch {
        // ignore
      }
      ws.close();
      wsRef.current = null;

      for (const pc of pcByPeerIdRef.current.values()) {
        try {
          pc.close();
        } catch {
          // ignore
        }
      }
      pcByPeerIdRef.current.clear();
      setRemoteStreams(new Map());
    };
  }, [addIceCandidateWhenReady, createOffer, createPeerConnection, localStream, roomCode, setRemoteAndAnswer, setRemoteDescription, wsUrl, userId, updateRemoteStream, flushIceQueue]);

  const replaceTrackInAllPeers = useCallback(
    async (kind: "video" | "audio", nextTrack: MediaStreamTrack) => {
      for (const pc of pcByPeerIdRef.current.values()) {
        const sender = pc
          .getSenders()
          .find((s) => s.track && s.track.kind === kind);
        if (!sender) continue;
        await sender.replaceTrack(nextTrack);
      }
    },
    []
  );

  const startScreenShare = useCallback(async () => {
    if (displayStreamRef.current) return; // already sharing
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    displayStreamRef.current = displayStream;

    const displayVideoTrack = displayStream.getVideoTracks()[0];
    displayVideoTrack.onended = () => {
      stopScreenShare().catch(() => void 0);
    };
    const fallbackAudioTrack = cameraStreamRef.current?.getAudioTracks()[0];
    const displayAudioTrack = displayStream.getAudioTracks()[0];
    const audioTrack = displayAudioTrack || fallbackAudioTrack;

    const combined = new MediaStream([
      displayVideoTrack,
      ...(audioTrack ? [audioTrack] : []),
    ]);
    localStreamRef.current = combined;
    setLocalStream(combined);
    setIsScreenSharing(true);

    await replaceTrackInAllPeers("video", displayVideoTrack);
    if (audioTrack) await replaceTrackInAllPeers("audio", audioTrack);
  }, [replaceTrackInAllPeers]);

  const stopScreenShare = useCallback(async () => {
    const displayStream = displayStreamRef.current;
    if (displayStream) {
      displayStream.getTracks().forEach((t) => t.stop());
    }
    displayStreamRef.current = null;

    const original = cameraStreamRef.current;
    if (!original) return;
    localStreamRef.current = original;
    setLocalStream(original);

    const originalVideoTrack = original.getVideoTracks()[0];
    const originalAudioTrack = original.getAudioTracks()[0];

    if (originalVideoTrack) await replaceTrackInAllPeers("video", originalVideoTrack);
    if (originalAudioTrack) await replaceTrackInAllPeers("audio", originalAudioTrack);
    setIsScreenSharing(false);
  }, [replaceTrackInAllPeers]);

  const toggleScreenShare = useCallback(async () => {
    if (displayStreamRef.current) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [startScreenShare, stopScreenShare]);

  const remoteStreamEntries = useMemo(() => Array.from(remoteStreams.entries()), [remoteStreams]);

  return {
    status,
    localStream,
    remoteStreams,
    remoteStreamEntries,
    toggleScreenShare,
    isScreenSharing,
  };
}

