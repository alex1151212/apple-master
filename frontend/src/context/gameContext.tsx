/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppleType } from "@/components/game/Apple";
import { useConnection } from "@/hooks/useConnection";
import { usePlayer } from "@/hooks/usePlayer";
import { useRoom } from "@/hooks/useRoom";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const initialGameState: GameState = {
  apples: [],
  score: 0,
  opponentApples: [],
  opponentScore: 0,
};

export const CONNECTION_TYPE = "apple";
export const ROWS = 10;
export const COLS = 15;
export const CELL_SIZE = 40;

interface GameContextType {
  // roomState: RoomState | null;
  isGameStarted: boolean;
  setIsGameStarted: (isGameStarted: boolean) => void;
  // setRoomState: (roomState: RoomState) => void;
  isConnectedGame: boolean;
  setIsConnectedGame: (isConnectedGame: boolean) => void;
  connectGame: (playerID: string) => void;
  sendMessage: (type: string, payload?: any) => void;
  readyGame: () => void;
  startGame: () => void;
  endGame: () => void;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  resetGame: () => void;
  syncGame: (apples: AppleType[], score: number) => void;
}

const defaultGameContext: GameContextType = {
  isConnectedGame: false,
  setIsConnectedGame: () => {},
  isGameStarted: false,
  setIsGameStarted: () => {},
  connectGame: () => {},
  sendMessage: () => {},
  readyGame: () => {},
  startGame: () => {},
  endGame: () => {},
  gameState: initialGameState,
  setGameState: () => {},
  resetGame: () => {},
  syncGame: () => {},
};

export const GameContext = createContext<GameContextType>(defaultGameContext);

interface GameProviderProps {
  children: React.ReactNode;
}

interface GameState {
  apples: AppleType[];
  score: number;
  opponentApples: AppleType[];
  opponentScore: number;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { roomState, setRoomState, setRoomList } = useRoom();
  const { setPlayerID, setIsReady } = usePlayer();

  const [gameState, setGameState] = useState<GameState>({
    apples: [],
    score: 0,
    opponentApples: [],
    opponentScore: 0,
  });

  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isConnectedGame, setIsConnectedGame] = useState(false);

  const {
    connect: connectWs,
    sendMessage,
    // isConnected: isConnectedWs,
  } = useConnection();

  const generateApples = () => {
    const newApples: AppleType[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        newApples.push({
          id: `${row}-${col}`,
          x: col * CELL_SIZE + 10,
          y: row * CELL_SIZE + 10,
          value: Math.floor(Math.random() * 9) + 1,
        });
      }
    }
    return newApples;
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

  const syncGame = (apples: AppleType[], score: number) => {
    sendMessage("apple", "playing", {
      opponentPlate: apples,
      opponentScore: score,
    });
  };

  const sendMessageToRoom = (payload?: any) => {
    sendMessage(CONNECTION_TYPE, "message", payload);
  };

  const resetGame = () => {
    setGameState({
      apples: [],
      score: 0,
      opponentApples: [],
      opponentScore: 0,
    });
  };

  const handleMessage = (data: any) => {
    if (!data) return;
    const { type, payload, success } = data;
    switch (type) {
      case "connect":
        if (!success) return;
        setPlayerID(payload.playerID);
        setIsConnectedGame(true);
        break;
      case "lobby:getRoomList":
        if (!success) return;
        setRoomList(payload.roomList);
        break;
      case "lobby:join":
        if (!success) return;
        setIsReady(false);
        setRoomState({
          id: payload.roomID,
          owner: payload.roomState.owner,
          status: payload.roomState.status,
        });
        navigate(`/room/${payload.roomID}`);
        break;
      case "room:ready":
        if (!success) return;
        setIsReady(true);
        setRoomState({
          id: payload.roomID,
          owner: payload.roomState.owner,
          status: payload.roomState.status,
        });
        break;
      case "room:start": {
        if (!success) return;
        const initApples = generateApples();
        setIsGameStarted(true);
        setGameState((prev) => ({
          ...prev,
          apples: initApples,
        }));
        setRoomState({
          id: payload.roomID,
          owner: payload.roomState.owner,
          status: payload.roomState.status,
        });
        sendMessage("apple", "playing", {
          opponentPlate: initApples,
          opponentScore: 0,
        });

        break;
      }
      case "playing":
        if (!success) return;
        setGameState((prev) => ({
          ...prev,
          opponentApples: payload.opponentPlate,
          opponentScore: payload.opponentScore,
        }));
        break;
    }
  };

  useEffect(() => {
    connectWs(handleMessage);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GameContext.Provider
      value={{
        isConnectedGame,
        setIsConnectedGame,
        sendMessage: sendMessageToRoom,
        connectGame,
        readyGame,
        startGame,
        endGame,
        isGameStarted,
        setIsGameStarted,
        gameState,
        setGameState,
        resetGame,
        syncGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
