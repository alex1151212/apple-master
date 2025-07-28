import Konva from "konva";
import { Vector2d } from "konva/lib/types";
import React, { useEffect, useRef, useState } from "react";
import { Group, Layer, Rect, Stage } from "react-konva";
import Apple, { AppleType } from "../../components/game/Apple";
import Timer from "../../components/game/Timer";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useGame } from "@/hooks/useGame";
import { useConnection } from "@/hooks/useConnection";
import { usePlayer } from "@/hooks/usePlayer";
import { useRoom } from "@/hooks/useRoom";

const cellSize = 40;
const rows = 10;
const cols = 15;

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const MainGame: React.FC = () => {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  
  const {
    startGame,
    readyGame,
    isGameStarted,
    gameState,
    setGameState,
    isConnectedGame,
  } = useGame();

  const { roomState, setRoomState, joinRoom } = useRoom();
  const { sendMessage } = useConnection();
  const { playerID, isReady } = usePlayer();
  const stageRef = useRef<Konva.Stage | null>(null);
  const { roomID } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    reset();
    if (roomID) {
      joinRoom(roomID);
    } else {
      navigate("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateApples = () => {
    const newApples: AppleType[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        newApples.push({
          id: `${row}-${col}`,
          x: col * cellSize + 10,
          y: row * cellSize + 10,
          value: Math.floor(Math.random() * 9) + 1,
        });
      }
    }
    return newApples;
  };

  const reset = () => {
    setGameState((prev) => ({
      ...prev,
      apples: generateApples(),
      score: 0,
      opponentApples: [],
      opponentScore: 0,
    }));
  };

  const playerReady = () => {
    sendMessage("apple", "ready");
  };

  const start = () => {
    reset();
  };
  const leave = () => {
    // navigate("/");
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isGameStarted) return;
    const stage = e.target.getStage();
    if (stage === null) return;
    const { x, y } = stage.getPointerPosition() as Vector2d;
    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isGameStarted) return;
    const stage = e.target.getStage();
    if (stage === null) return;
    if (selectionBox === null) return;
    const { x, y } = stage.getPointerPosition() as Vector2d;
    setSelectionBox((prev) => (prev ? { ...prev, endX: x, endY: y } : null));
  };

  const handleMouseUp = () => {
    if (!isGameStarted) return;
    if (!selectionBox) return;
    const { startX, startY, endX, endY } = selectionBox;

    const selected = gameState.apples.filter((apple) => {
      const appleCenter = {
        x: apple.x + cellSize / 2,
        y: apple.y + cellSize / 2,
      };
      const selectionArea = {
        left: Math.min(startX, endX),
        right: Math.max(startX, endX),
        top: Math.min(startY, endY),
        bottom: Math.max(startY, endY),
      };

      // 檢查蘋果中心點是否在選擇框內
      return (
        appleCenter.x >= selectionArea.left &&
        appleCenter.x <= selectionArea.right &&
        appleCenter.y >= selectionArea.top &&
        appleCenter.y <= selectionArea.bottom
      );
    });

    const sum = selected.reduce((acc, apple) => acc + apple.value, 0);
    if (sum === 10) {
      setGameState((prev) => ({
        ...prev,
        apples: prev.apples.filter((apple) => !selected.includes(apple)),
        score: prev.score + 1,
      }));
      sendMessage("apple", "playing", {
        opponentPlate: gameState.apples.filter(
          (apple) => !selected.includes(apple)
        ),
        opponentScore: gameState.score + 1,
      });
    }
    setSelectionBox(null);
  };

  const handleTimeUp = () => {
    console.log("Time's up!");
  };

  const buttonHandler = () => {
    if (
      !isReady &&
      roomState?.owner !== playerID &&
      roomState?.status === "waiting"
    ) {
      return (
        <button
          onClick={readyGame}
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 
               transition-colors duration-200 font-semibold shadow-md"
        >
          等待準備
        </button>
      );
    } else if (
      isReady &&
      roomState?.owner !== playerID &&
      roomState?.status === "waiting"
    ) {
      return (
        <button
          className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
          disabled
        >
          已準備
        </button>
      );
    } else if (
      isReady &&
      roomState?.owner !== playerID &&
      roomState?.status === "ready"
    ) {
      return (
        <button
          onClick={playerReady}
          disabled={isReady}
          className={`px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700
                         transition-colors duration-200 font-semibold shadow-md ${
                           isReady
                             ? "bg-gray-400 text-white cursor-not-allowed"
                             : "bg-yellow-600 text-white hover:bg-yellow-700"
                         }`}
        >
          等待房主開始
        </button>
      );
    }

    if (roomState?.owner == playerID && roomState?.status === "ready") {
      return (
        <button
          onClick={startGame}
          disabled={roomState?.status !== "ready"}
          className={`px-6 py-2 rounded-lg transition-colors duration-200 font-semibold shadow-md ${
            roomState?.status === "ready"
              ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
        >
          開始遊戲
        </button>
      );
    } else if (
      roomState?.owner == playerID &&
      roomState?.status === "waiting"
    ) {
      return (
        <button className="px-6 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed">
          等待玩家準備
        </button>
      );
    }
  };

  if (!isConnectedGame) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-center text-4xl font-bold text-green-800 mb-8">
          Apple Sum Game
        </h1>

        <div className="mb-6 flex items-center justify-center gap-6">
          {buttonHandler()}
          <div className="text-xl font-semibold text-green-800">
            Score:{" "}
            <span className="text-2xl text-green-600">{gameState.score}</span>
          </div>
          <div className="text-xl font-semibold text-green-800">
            房間: <span className="text-2xl text-green-600">{roomID}</span>
          </div>
        </div>

        <div className="flex justify-center gap-8">
          {/* 玩家盤面 */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              我的盤面
            </h3>
            <Stage
              width={620}
              height={600}
              ref={stageRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Layer>
                <Group>
                  <Rect
                    x={0}
                    y={0}
                    width={620}
                    height={520}
                    fill="#f0fdf4"
                    cornerRadius={12}
                    stroke="#22c55e"
                    strokeWidth={5}
                  />
                  {gameState.apples.map((apple) => (
                    <Apple key={apple.id} apple={apple} cellSize={cellSize} />
                  ))}
                  {selectionBox && (
                    <Rect
                      x={Math.min(selectionBox.startX, selectionBox.endX)}
                      y={Math.min(selectionBox.startY, selectionBox.endY)}
                      width={Math.abs(selectionBox.endX - selectionBox.startX)}
                      height={Math.abs(selectionBox.endY - selectionBox.startY)}
                      fill="rgba(134, 239, 172, 0.3)"
                      stroke="#86efac"
                      strokeWidth={2}
                    />
                  )}
                </Group>
                <Group>
                  <Timer
                    initialTime={120}
                    onTimeUp={handleTimeUp}
                    width={600}
                    y={450}
                    isStarted={isGameStarted}
                  />
                </Group>
              </Layer>
            </Stage>
          </div>

          {/* 對手盤面 */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              對手盤面
            </h3>
            <Stage width={620} height={600}>
              <Layer>
                <Group>
                  <Rect
                    x={0}
                    y={0}
                    width={620}
                    height={520}
                    fill="#fef2f2"
                    cornerRadius={12}
                    stroke="#ef4444"
                    strokeWidth={5}
                  />
                  {gameState.opponentApples.map((apple) => (
                    <Apple key={apple.id} apple={apple} cellSize={cellSize} />
                  ))}
                </Group>
              </Layer>
            </Stage>
            <div className="mt-2 text-lg font-semibold text-red-800">
              對手分數:{" "}
              <span className="text-xl text-red-600">
                {gameState.opponentScore}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainGame;
