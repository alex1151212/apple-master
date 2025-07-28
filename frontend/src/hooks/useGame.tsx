import { useContext } from "react";
import { GameContext } from "@/context/gameContext";

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
