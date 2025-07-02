import express from "express";
import { RoomManager } from "../websocket/handlers/RoomManager.ts";

const router = express.Router();

export const createRoomRoutes = (roomManager: RoomManager) => {
  // Get all rooms
  router.get("/rooms", (req, res) => {
    const rooms = Array.from(roomManager.getRooms().entries()).map(
      ([id, room]) => ({
        id: room.id,
        clientCount: room.clients.length,
        status: room.status,
      })
    );
    res.json({
      success: true,
      data: rooms,
      message: "Successfully retrieved room list",
    });
  });

  // 獲取特定房間資訊
  router.get("/rooms/:roomId", (req, res) => {
    const room = roomManager.getRoom(req.params.roomId);
    if (room) {
      res.json({
        id: room.id,
        clientCount: room.clients.length,
      });
    } else {
      res.status(404).json({ message: "房間不存在" });
    }
  });

  return router;
};
