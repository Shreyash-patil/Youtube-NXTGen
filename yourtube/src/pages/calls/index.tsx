import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

const makeRoomCode = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
};

export default function CallsLobbyPage() {
  const { user } = useUser();
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState<any[]>([]);
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);

  const inviteLink = useMemo(() => {
    if (!createdCode) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/calls/${createdCode}`;
  }, [createdCode]);

  useEffect(() => {
    const q = inviteSearch.trim();
    if (!q || !user) {
      setInviteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/user/search?q=${encodeURIComponent(q)}`);
        setInviteResults(res.data || []);
      } catch (error) {
        console.log(error);
        setInviteResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inviteSearch, user]);

  const toggleInvite = (targetId: string) => {
    setInvitedUserIds((prev) => {
      if (prev.includes(targetId)) return prev.filter((id) => id !== targetId);
      return [...prev, targetId];
    });
  };

  if (!user) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto text-center py-12 sm:py-16">
          <h1 className="text-xl sm:text-2xl font-semibold mb-3">Group Calls</h1>
          <p className="text-gray-600">You need to sign in first to create or join a call.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Group Calls</h1>

        <div className="space-y-4 sm:space-y-6">
          <section className="rounded-lg border p-3 sm:p-5 space-y-3">
            <h2 className="text-base sm:text-lg font-semibold">Create a room</h2>
            <p className="text-sm text-gray-600">A room code will be generated for your group call.</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  const code = makeRoomCode();
                  setCreatedCode(code);
                  router.push(`/calls/${code}`);
                }}
              >
                Create room
              </button>
            </div>
          </section>

          {createdCode && (
            <section className="rounded-lg border p-3 sm:p-5 space-y-3">
              <h2 className="text-base sm:text-lg font-semibold">Invite link</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-sm break-all">
                  Room code: <span className="font-mono">{createdCode}</span>
                </div>
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                    } catch {
                      // ignore: clipboard may be blocked
                    }
                  }}
                >
                  Copy invite link
                </button>
              </div>
              <div className="pt-2">
                <div className="text-sm text-gray-600">
                  Invited users: <span className="font-medium">{invitedUserIds.length}</span>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border p-3 sm:p-5 space-y-3">
            <h2 className="text-base sm:text-lg font-semibold">Join by room code</h2>
            <p className="text-sm text-gray-600">Enter the code your friend shared.</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input
                className="border rounded px-3 py-2 w-full sm:w-64"
                placeholder="ROOM CODE"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => {
                  if (!joinCode.trim()) return;
                  router.push(`/calls/${joinCode.trim()}`);
                }}
              >
                Join
              </button>
            </div>
          </section>

          {createdCode && (
            <section className="rounded-lg border p-3 sm:p-5 space-y-3">
              <h2 className="text-base sm:text-lg font-semibold">Invite friends</h2>
              <p className="text-sm text-gray-600">
                Search users and select who you want to invite. They can join using the invite link.
              </p>

              <div className="flex items-center gap-3">
                <input
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Search by email, name, or channel"
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                />
              </div>

              {inviteSearch.trim() && (
                <div className="space-y-2">
                  {inviteResults.length === 0 ? (
                    <div className="text-sm text-gray-600">No users found.</div>
                  ) : (
                    inviteResults.map((u) => {
                      const selected = invitedUserIds.includes(u._id);
                      return (
                        <div key={u._id} className="flex items-center justify-between gap-3 border rounded p-2 sm:p-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {u.channelname || u.name || u.email}
                            </div>
                            <div className="text-xs text-gray-600 truncate">{u.email}</div>
                          </div>
                          <button
                            type="button"
                            className={`shrink-0 px-3 py-2 rounded ${
                              selected ? "bg-gray-100 hover:bg-gray-200" : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                            onClick={() => {
                              toggleInvite(u._id);
                              toast.success(selected ? "Removed invite" : "Invited user");
                            }}
                          >
                            {selected ? "Invited" : "Invite"}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

