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
  const CONNECTION_TYPE = "apple";
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
      case "room:start":
        if (!success) return;
        setIsGameStarted(true);
        setRoomState({
          id: payload.roomID,
          owner: payload.roomState.owner,
          status: payload.roomState.status,
        });

        break;
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
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
