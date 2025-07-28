import { Outlet } from "react-router-dom";
import { ConnectionProvider } from "@/context/connectionContext";
import { GameProvider } from "@/context/gameContext";
import { RoomProvider } from "@/context/roomContext";
import { PlayerProvider } from "@/context/playerContext";

const RootLayout = () => {
  return (
    <ConnectionProvider>
      <PlayerProvider>
        <RoomProvider>
          <GameProvider>
            <div>
              <Outlet />
            </div>
          </GameProvider>
        </RoomProvider>
      </PlayerProvider>
    </ConnectionProvider>
  );
};

export default RootLayout;
