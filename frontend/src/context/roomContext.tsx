/* eslint-disable @typescript-eslint/no-explicit-any */
import { useConnection } from "@/hooks/useConnection";
import { usePlayer } from "@/hooks/usePlayer";
import { createContext, useState } from "react";
export interface Room {
  id: string;
  clients: RoomClient[];
  owner: RoomClient;
  status: RoomStatusEnum;
}

export enum RoomStatusEnum {
  WAITING = "waiting",
  READY = "ready",
  PLAYING = "playing",
  END = "end",
}

interface RoomClient {
  playerID: string;
  currentRoomID: string | null;
  isReady: boolean;
}
interface RoomContextType {
  roomList: Room[];
  setRoomList: React.Dispatch<React.SetStateAction<Room[]>>;
  roomState: RoomState | null;
  setRoomState: React.Dispatch<React.SetStateAction<RoomState | null>>;
  joinRoom: (roomID: string) => void;
  createRoom: (roomID: string) => void;
}

const defaultRoomContext: RoomContextType = {
  roomList: [],
  setRoomList: () => {},
  roomState: null,
  setRoomState: () => {},
  joinRoom: () => {},
  createRoom: () => {},
};

export const RoomContext = createContext<RoomContextType>(defaultRoomContext);

interface RoomProviderProps {
  children: React.ReactNode;
}

interface RoomState {
  id: string;
  owner: string;
  status: "waiting" | "ready" | "playing";
}

export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
  const { CONNECTION_TYPE } = useConnection();
  const [roomList, setRoomList] = useState<Room[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const { playerID } = usePlayer();

  const { sendMessage, isConnected: isConnectedWs } = useConnection();

  const joinRoom = (roomID: string) => {
    if (!playerID.trim()) {
      // alert("請先輸入您的名字！");
      console.log("請先輸入您的名字！");
      return;
    }
    if (!isConnectedWs) {
      alert("請先連線！");
      return;
    }
    sendMessage(CONNECTION_TYPE, "join", { roomID });
  };

  const createRoom = (roomID: string) => {
    joinRoom(roomID);
  };

  return (
    <RoomContext.Provider
      value={{
        roomList,
        setRoomList,
        roomState,
        setRoomState,
        joinRoom,
        createRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
