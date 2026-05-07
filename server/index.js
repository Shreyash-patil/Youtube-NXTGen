import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { WebSocketServer } from "ws";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import dislikeroutes from "./routes/dislike.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import otproutes from "./routes/otp.js";
dotenv.config();
console.log("DB URL:", process.env.MONGO_DB_URL);
const app = express();
import path from "path";
app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.get("/", (req, res) => {
  res.send("Youtube-NXTGen backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/dislike", dislikeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/otp", otproutes);
const PORT = process.env.PORT || 5000;
const DBURL = process.env.MONGO_DB_URL;

// roomCode -> Map<userId, WebSocket>
const rooms = new Map();

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const sendToUser = (roomCode, userId, payload) => {
  const room = rooms.get(roomCode);
  const peer = room?.get(userId);
  if (peer && peer.readyState === 1) {
    peer.send(JSON.stringify(payload));
  }
};

const broadcastToRoomExcept = (roomCode, exceptUserId, payload) => {
  const room = rooms.get(roomCode);
  if (!room) return;
  for (const [peerUserId, peerWs] of room.entries()) {
    if (peerUserId === exceptUserId) continue;
    if (peerWs.readyState === 1) {
      peerWs.send(JSON.stringify(payload));
    }
  }
};

wss.on("connection", (ws) => {
  // We'll populate these when the client sends {type:"join"}
  ws._roomCode = null;
  ws._userId = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const { type } = msg || {};
    if (!type) return;

    if (type === "join") {
      const { roomCode, userId } = msg;
      if (typeof roomCode !== "string" || !roomCode.trim()) return;
      if (typeof userId !== "string" || !userId.trim()) return;

      ws._roomCode = roomCode.trim();
      ws._userId = userId.trim();

      const room = rooms.get(ws._roomCode) || new Map();
      room.set(ws._userId, ws);
      rooms.set(ws._roomCode, room);

      const existingPeers = [...room.keys()].filter((id) => id !== ws._userId);

      // Tell the joiner which peers already exist; joiner will create PCs and wait for offers.
      ws.send(
        JSON.stringify({
          type: "peers-existing",
          roomCode: ws._roomCode,
          peers: existingPeers,
        })
      );

      // Tell existing peers that a new peer joined; existing peers will create offers to the newcomer.
      for (const peerUserId of existingPeers) {
        sendToUser(ws._roomCode, peerUserId, {
          type: "peer-joined",
          roomCode: ws._roomCode,
          peerUserId: ws._userId,
        });
      }
    }

    if (type === "leave") {
      const roomCode = ws._roomCode;
      const userId = ws._userId;
      if (!roomCode || !userId) return;

      const room = rooms.get(roomCode);
      if (room) {
        room.delete(userId);
        if (room.size === 0) rooms.delete(roomCode);
      }
      broadcastToRoomExcept(roomCode, userId, {
        type: "peer-left",
        roomCode,
        peerUserId: userId,
      });
      ws.close();
    }

    if (type === "offer") {
      const roomCode = msg.roomCode;
      const toUserId = msg.toUserId;
      if (!roomCode || !toUserId) return;
      sendToUser(roomCode, toUserId, {
        type: "offer",
        roomCode,
        fromUserId: ws._userId,
        sdp: msg.sdp,
      });
    }

    if (type === "answer") {
      const roomCode = msg.roomCode;
      const toUserId = msg.toUserId;
      if (!roomCode || !toUserId) return;
      sendToUser(roomCode, toUserId, {
        type: "answer",
        roomCode,
        fromUserId: ws._userId,
        sdp: msg.sdp,
      });
    }

    if (type === "ice-candidate") {
      const roomCode = msg.roomCode;
      const toUserId = msg.toUserId;
      if (!roomCode || !toUserId) return;
      sendToUser(roomCode, toUserId, {
        type: "ice-candidate",
        roomCode,
        fromUserId: ws._userId,
        candidate: msg.candidate,
      });
    }
  });

  ws.on("close", () => {
    const roomCode = ws._roomCode;
    const userId = ws._userId;
    if (!roomCode || !userId) return;

    const room = rooms.get(roomCode);
    if (room) {
      room.delete(userId);
      if (room.size === 0) rooms.delete(roomCode);
    }

    broadcastToRoomExcept(roomCode, userId, {
      type: "peer-left",
      roomCode,
      peerUserId: userId,
    });
  });
});

mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
    httpServer.listen(PORT, () => {
      console.log(`server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });
