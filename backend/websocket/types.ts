import { WebSocket } from "ws";

export enum PlayerStatusEnum {
  LOBBY = "lobby",
  IN_ROOM = "inRoom",
}
export enum RoomStatusEnum {
  WAITING = "waiting",
  READY = "ready",
  PLAYING = "playing",
  END = "end",
}

export interface CustomWebSocket extends WebSocket {
  playerID?: string;

  status?: PlayerStatusEnum;
  // 可以添加其他需要的自定義屬性
  [key: string]: any;
}

export interface WSMessage {
  type: string;
  [key: string]: any;
}

export interface MessageHandler {
  handleMessage: (ws: WebSocket, message: WSMessage) => void;
  handleClose?: (ws: WebSocket) => void;
}

export interface WSHandlerResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}
