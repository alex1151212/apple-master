/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppleType } from "@/components/game/Apple";
import { useConnection } from "@/hooks/useConnection";
import { createContext, useState } from "react";

// interface GameState {
//   apples: number;
//   score: number;
// }

interface GameContextType {
  //   apples: number;
  //   score: number;
  roomState: RoomState | null;
  isGameStarted: boolean;
  setIsGameStarted: (isGameStarted: boolean) => void;
  setRoomState: (roomState: RoomState) => void;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
  connectGame: (playerID: string) => void;
  sendMessage: (type: string, payload?: any) => void;
  joinRoom: (roomID: string) => void;
  readyGame: () => void;
  createRoom: (roomID: string) => void;
  startGame: () => void;
  endGame: () => void;
  opponentApples: AppleType[];
  setOpponentApples: React.Dispatch<React.SetStateAction<AppleType[]>>;
  opponentScore: number;
  setOpponentScore: React.Dispatch<React.SetStateAction<number>>;
  myApples: AppleType[];
  setMyApples: React.Dispatch<React.SetStateAction<AppleType[]>>;
  myScore: number;
  setMyScore: React.Dispatch<React.SetStateAction<number>>;
}

// const defaultGameState: GameState = {
//   apples: 0,
//   score: 0,
// };

const defaultGameContext: GameContextType = {
  //   ...defaultGameState,
  isConnected: false,
  setIsConnected: () => {},
  roomState: null,
  isGameStarted: false,
  setIsGameStarted: () => {},
  setRoomState: () => {},
  connectGame: () => {},
  sendMessage: () => {},
  joinRoom: () => {},
  readyGame: () => {},
  createRoom: () => {},
  startGame: () => {},
  endGame: () => {},
  opponentApples: [],
  setOpponentApples: () => {},
  opponentScore: 0,
  setOpponentScore: () => {},
  myApples: [],
  setMyApples: () => {},
  myScore: 0,
  setMyScore: () => {},
};

export const GameContext = createContext<GameContextType>(defaultGameContext);

interface GameProviderProps {
  children: React.ReactNode;
}

interface RoomState {
  id: string;
  owner: string;
  status: "waiting" | "ready" | "playing";
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const CONNECTION_TYPE = "apple";
  const [myApples, setMyApples] = useState<AppleType[]>([]);
  const [myScore, setMyScore] = useState<number>(0);
  const [opponentApples, setOpponentApples] = useState<AppleType[]>([]);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const { sendMessage } = useConnection();

  const joinRoom = (roomID: string) => {
    sendMessage(CONNECTION_TYPE, "join", { roomID });
  };

  const createRoom = (roomID: string) => {
    joinRoom(roomID);
  };

  const connectGame = (playerID: string) => {
    sendMessage(CONNECTION_TYPE, "connect", { playerID });
  };

  const readyGame = () => {
    sendMessage(CONNECTION_TYPE, "ready", { roomID: roomState?.id });
  };

  const startGame = () => {
    sendMessage(CONNECTION_TYPE, "start", { roomID: roomState?.id });
  };

  const endGame = () => {
    sendMessage(CONNECTION_TYPE, "end");
  };

  const sendMessageToRoom = (payload?: any) => {
    sendMessage(CONNECTION_TYPE, "message", payload);
  };

  return (
    <GameContext.Provider
      value={{
        isConnected,
        setIsConnected,
        sendMessage: sendMessageToRoom,
        connectGame,
        roomState,
        setRoomState,
        joinRoom,
        createRoom,
        readyGame,
        startGame,
        endGame,
        isGameStarted,
        setIsGameStarted,
        opponentApples,
        setOpponentApples,
        opponentScore,
        setOpponentScore,
        myApples,
        setMyApples,
        myScore,
        setMyScore,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
