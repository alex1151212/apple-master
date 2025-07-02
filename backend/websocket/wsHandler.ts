import { WebSocketServer } from "ws";
import type {
  MessageHandler,
  WSHandlerResponse,
  WSMessage,
  CustomWebSocket,
} from "./types.ts";

export class WSHandler {
  private messageHandlers: Map<string, MessageHandler>;
  private closeHandlers: Set<(ws: CustomWebSocket) => void>;
  private wss: WebSocketServer;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.messageHandlers = new Map();
    this.closeHandlers = new Set();
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws: CustomWebSocket, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const pathParts = url.pathname.split("/");
      // const playerID = pathParts[pathParts.length - 1];

      // if (!playerID) {
      //   ws.send(
      //     JSON.stringify({
      //       type: "error",
      //       message: "需要提供playerID",
      //     })
      //   );
      //   ws.close();
      //   return;
      // }

      // ws.playerID = playerID;

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString()) as WSMessage;
          const handler = this.messageHandlers.get(data.gameID);

          if (handler) {
            handler.handleMessage(ws, data);
          }
        } catch (error) {
          console.error("消息處理錯誤:", error);
        }
      });

      ws.on("close", () => {
        this.closeHandlers.forEach((handler) => handler(ws));
      });

      ws.on("error", (error) => {
        console.error("WebSocket 錯誤:", error);
      });
    });
  }

  registerHandler(gameID: string, handler: MessageHandler) {
    this.messageHandlers.set(gameID, handler);
    if (handler.handleClose) {
      this.closeHandlers.add(handler.handleClose.bind(handler));
    }
  }
}
