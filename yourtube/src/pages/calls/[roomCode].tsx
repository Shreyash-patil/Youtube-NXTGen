import { useRouter } from "next/router";
import React from "react";
import CallRoom from "@/components/voip/CallRoom";
import { useMemo } from "react";

export default function CallRoomPage() {
  const router = useRouter();
  const { roomCode } = router.query;

  const code = useMemo(() => {
    if (!roomCode) return "";
    return Array.isArray(roomCode) ? roomCode[0] : roomCode;
  }, [roomCode]);

  return <CallRoom roomCode={code} />;
}

