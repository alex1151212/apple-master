import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { RoomManager } from "./websocket/handlers/RoomManager.ts";
import { createRoomRoutes } from "./routes/roomRoutes.ts";
import { WSHandler } from "./websocket/wsHandler.ts";
import cors from "cors";
import type { WSMessage } from "./websocket/types.ts";

const app = express();
const port = process.env.PORT || 3000;

// 中間件設置
app.use(express.json());
app.use(cors());

// 創建 HTTP 服務器
const server = createServer(app);

// 創建 WebSocket 服務器
const wss = new WebSocketServer({ server });

// 創建房間管理器
const roomManager = new RoomManager();

// 創建 WebSocket 處理器
const wsHandler = new WSHandler(wss);

// 註冊房間管理器
wsHandler.registerHandler("apple", roomManager);

// 註冊 HTTP 路由
app.use("/api", createRoomRoutes(roomManager));

// 註冊自定義消息處理器
wsHandler.registerHandler("custom_message", {
  handleMessage: (ws: WebSocket, message: WSMessage) => {
    console.log("收到自定義消息:", message);
  },
});

// 基礎路由
app.get("/", (req, res) => {
  res.send("WebSocket 房間服務器正在運行");
});

// 啟動服務器
server.listen(port, () => {
  console.log(`服務器運行在 http://localhost:${port}`);
});
