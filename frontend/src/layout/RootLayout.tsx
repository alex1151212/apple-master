import { Outlet } from "react-router-dom";
import { ConnectionProvider } from "@/context/connectionContext";
import { GameProvider } from "@/context/gameContext";
import { PlayerProvider } from "@/context/playerContext";

const RootLayout = () => {
  return (
    <ConnectionProvider>
      <GameProvider>
        <PlayerProvider>
          <div>
            <Outlet />
          </div>
        </PlayerProvider>
      </GameProvider>
    </ConnectionProvider>
  );
};

export default RootLayout;
