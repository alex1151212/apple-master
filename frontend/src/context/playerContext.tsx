import { createContext, useState } from "react";

interface PlayerContextType {
  playerID: string;
  setPlayerID: (id: string) => void;
  isReady: boolean;
  setIsReady: (ready: boolean) => void;
}

const defaultPlayerContext: PlayerContextType = {
  playerID: "",
  setPlayerID: () => {},
  isReady: false,
  setIsReady: () => {},
};

export const PlayerContext =
  createContext<PlayerContextType>(defaultPlayerContext);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [playerID, setPlayerID] = useState<string>("");
  const [isReady, setIsReady] = useState<boolean>(false);

  return (
    <PlayerContext.Provider
      value={{ playerID, setPlayerID, isReady, setIsReady }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
