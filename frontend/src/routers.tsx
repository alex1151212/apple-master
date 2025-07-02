import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import MainGame from "./pages/MainGame/MainGame";
import Lobby from "./pages/Lobby/Lobby";
import RootLayout from "./layout/RootLayout";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route index element={<Lobby />} />
      <Route path="/room/:roomID" element={<MainGame />} />
    </Route>
  )
);
