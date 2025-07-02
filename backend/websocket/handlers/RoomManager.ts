import { WebSocket } from "ws";
import { CustomWebSocket, MessageHandler, RoomStatusEnum } from "../types.ts";

interface Room {
  id: string;
  owner: string;
  status: RoomStatusEnum;
  clients: RoomClient[];
}

interface RoomClient {
  ws: CustomWebSocket;
  playerID: string;
  currentRoomID: string | null;
  isReady: boolean;
}

export class RoomManager implements MessageHandler {
  private rooms: Map<string, Room>;
  private clients: Map<CustomWebSocket, RoomClient>;

  constructor() {
    this.rooms = new Map();
    this.clients = new Map();
  }

  private createRoom(ws: RoomClient, roomID: string): Room | undefined {
    try {
      const room: Room = {
        id: roomID,
        owner: ws.playerID,
        clients: [],
        status: RoomStatusEnum.WAITING,
      };
      this.rooms.set(roomID, room);
      return room;
    } catch (error) {
      console.error("createRoom error", error);
    }
  }

  private joinRoom(client: RoomClient, roomID: string): Room | null {
    let room = this.rooms.get(roomID);

    if (!room) {
      return null;
    }

    if (room.clients.length >= 2) {
      return null;
    }

    room.clients.push(client);
    client.currentRoomID = roomID;
    return room;
  }

  private leaveRoom(client: RoomClient) {
    const ws = client.ws;
    if (client?.currentRoomID) {
      const room = this.rooms.get(client.currentRoomID);
      if (room) {
        // Remove client from room
        room.clients = room.clients.filter((client) => client !== client);

        // If leaving client was owner, assign new owner
        if (room.owner === client.playerID && room.clients.length > 0) {
          room.owner = room.clients[0].playerID;
        }

        // Delete room if empty
        if (room.clients.length === 0) {
          this.rooms.delete(client.currentRoomID);
        }
      }
      this.clients.delete(ws);
    }
  }

  private broadcastLobby(message: string) {
    this.clients.forEach((client) => {
      client.ws.send(message);
    });
  }

  private broadcastToRoom(client: RoomClient, message: string) {
    const ws = client.ws;
    if (client?.currentRoomID) {
      const room = this.rooms.get(client.currentRoomID);
      if (room) {
        room.clients.forEach(({ ws: clientWs }) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(message);
          }
        });
      }
    }
  }

  private getRoomList() {
    return {
      roomList: Array.from(this.rooms.values()).map((room) => ({
        id: room.id,
        owner: room.owner,
        status: room.status,
        clients: room.clients.map((client) => ({
          playerID: client.playerID,
          currentRoomID: client.currentRoomID,
          isReady: client.isReady,
        })),
      })),
    };
  }

  // MessageHandler implementation
  handleMessage(ws: CustomWebSocket, message: any) {
    const { type, payload } = message;
    switch (type) {
      // 廣播訊息
      case "message":
        const client = this.clients.get(ws);
        if (!client) {
          return;
        }
        if (payload) {
          this.broadcastToRoom(
            client,
            JSON.stringify({
              type: "message",
              success: true,
              data: {
                message: payload,
                messageFrom: ws.playerID,
              },
            })
          );
        }
        break;
      case "connect": {
        const client = {
          playerID: payload.playerID,
          ws,
          currentRoomID: null,
          isReady: false,
        };
        this.clients.set(ws, client);
        ws.send(
          JSON.stringify({
            type: "connect",
            payload: {
              playerID: payload.playerID,
            },
            success: true,
            message: "連線成功",
          })
        );
        this.broadcastLobby(
          JSON.stringify({
            type: "lobby:getRoomList",
            success: true,
            payload: this.getRoomList(),
          })
        );
        break;
      }
      // 加入房間
      case "join": {
        const client = this.clients.get(ws);
        if (!client) {
          return;
        }
        const { roomID } = payload;

        if (this.rooms.get(roomID) === undefined) {
          this.createRoom(client, roomID);
          const room = this.joinRoom(client, roomID);
          if (!room) {
            return;
          }

          ws.send(
            JSON.stringify({
              type: "lobby:join",

              success: true,
              payload: {
                roomID: roomID,
                roomState: {
                  ...room,
                  players: room.clients.map((client) => ({
                    id: client.playerID,
                    status: client.isReady,
                  })),
                },
                message: "成功加入房間",
              },
            })
          );
          this.broadcastLobby(
            JSON.stringify({
              type: "lobby:getRoomList",
              success: true,
              payload: this.getRoomList(),
            })
          );
          return;
        }

        // 如果玩家已經在房間中
        if (client && client.currentRoomID === roomID) {
          ws.send(
            JSON.stringify({
              type: "lobby:join",

              success: false,
              payload: {
                roomID: roomID,
                playerStatus: this.clients.get(ws)?.isReady,
                owner: this.rooms.get(roomID)?.owner,
                roomStatus: this.rooms.get(roomID)?.status,
                message: "您已經在房間中",
                messageFrom: "server",
              },
            })
          );
          return; // Exit early if the player is already in the room
        }

        // 如果房間存在且玩家不在房間中
        if (roomID && client && client.currentRoomID !== roomID) {
          const room = this.joinRoom(client, roomID);

          if (room === null) {
            ws.send(
              JSON.stringify({
                type: "lobby:join",

                success: false,
                data: {
                  message: "房間已滿",
                },
              })
            );
            return;
          } else {
            ws.send(
              JSON.stringify({
                type: "lobby:join",
                success: true,
                payload: {
                  roomID: roomID,
                  roomState: {
                    ...room,
                    players: room.clients.map((client) => ({
                      id: client.playerID,
                      status: client.isReady,
                    })),
                  },
                  message: "成功加入房間",
                },
              })
            );
          }
        }
        break;
      }
      // 玩家準備
      case "ready": {
        const room = this.rooms.get(payload.roomID);

        if (!room) {
          return;
        }

        const client = this.clients.get(ws);
        if (!client) {
          return;
        }

        client.isReady = true;

        if (
          room.clients.every(
            (client) => client.isReady || room.owner === client.playerID
          )
        ) {
          room.status = RoomStatusEnum.READY;

          this.broadcastToRoom(
            client,
            JSON.stringify({
              type: "room:ready",
              success: true,
              payload: {
                roomID: payload.roomID,
                roomState: {
                  ...room,
                },
              },
            })
          );
          return;
        }

        break;
      }
      // 房主開始遊戲
      case "start": {
        const client = this.clients.get(ws);
        if (!client) {
          return;
        }
        const room = this.rooms.get(payload.roomID);
        if (!room) {
          ws.send(
            JSON.stringify({
              type: "room:start",

              success: false,
              data: {
                message: "房間不存在",
              },
            })
          );
          return;
        }

        if (room.owner !== client.playerID) {
          ws.send(
            JSON.stringify({
              type: "room:start",

              success: false,
              data: {
                message: "您不是房主",
              },
            })
          );
          return;
        }

        if (room.status !== RoomStatusEnum.READY) {
          ws.send(
            JSON.stringify({
              type: "room:start",

              success: false,
              data: {
                message: "房間未準備好",
              },
            })
          );
          return;
        } else {
          room.status = RoomStatusEnum.PLAYING;
          ws.send(
            JSON.stringify({
              type: "room:start",
              success: true,
              payload: {
                roomID: payload.roomID,
                roomState: {
                  ...room,
                  players: room.clients.map((client) => ({
                    id: client.playerID,
                    status: client.isReady,
                  })),
                },
              },
            })
          );
          this.broadcastToRoom(
            client,
            JSON.stringify({
              type: "room:start",
              success: true,
              payload: {
                roomID: payload.roomID,
                roomState: {
                  ...room,
                  players: room.clients.map((client) => ({
                    id: client.playerID,
                    status: client.isReady,
                  })),
                },
              },
            })
          );
        }
        return;
      }
      // 若房間內有玩家傳送playing 則廣播給所有玩家
      case "playing": {
        const { plate } = payload;
        const client = this.clients.get(ws);
        if (!client?.currentRoomID) {
          return;
        }
        const room = this.rooms.get(client.currentRoomID!);
        if (!room || room.status !== RoomStatusEnum.PLAYING) {
          ws.send(
            JSON.stringify({
              type: "playing",

              success: false,
              data: {
                message: "房間未開始",
              },
            })
          );
          return;
        }

        // 同步遊戲進行狀態（玩家盤面）

        this.broadcastToRoom(
          client,
          JSON.stringify({
            type: "playing",
            opponent: {
              id: room.clients.find((client) => client.playerID !== ws.playerID)
                ?.playerID,
              plate,
            },
          })
        );

        break;
      }
      // 若房間內有玩家傳送end 則遊戲結束
      case "end": {
        const client = this.clients.get(ws);
        if (!client) {
          return;
        }
        this.broadcastToRoom(
          client,
          JSON.stringify({
            type: "end",
            roomID: payload.roomID,
            playerID: ws.playerID,
            message: "遊戲結束",
          })
        );
        if (payload.roomID) {
          const room = this.rooms.get(payload.roomID);
          if (room) {
            room.clients.forEach((client) => {
              client.currentRoomID = null;
            });
            this.rooms.delete(payload.roomID);
          }
        }
        break;
      }
    }
  }

  handleClose(ws: CustomWebSocket) {
    console.log("handleClose", "close");
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }
    if (client?.currentRoomID) {
      this.broadcastToRoom(
        client,
        JSON.stringify({
          type: "user_left",
          message: "對方已離開房間",
        })
      );
      this.leaveRoom(client);
    }
  }

  // Public methods for HTTP API
  getRooms(): Map<string, Room> {
    return this.rooms;
  }

  getRoom(roomID: string): Room | undefined {
    return this.rooms.get(roomID);
  }
}
