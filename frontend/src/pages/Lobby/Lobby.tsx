/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { instance } from "@/api/axios";
import { useConnection } from "@/hooks/useConnection";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
export enum RoomStatusEnum {
  WAITING = "waiting",
  READY = "ready",
  PLAYING = "playing",
  END = "end",
}
interface Room {
  id: string;
  clients: RoomClient[];
  owner: RoomClient;
  status: RoomStatusEnum;
}
interface RoomClient {
  playerID: string;
  currentRoomID: string | null;
  isReady: boolean;
}

const Lobby = () => {
  const [roomList, setRoomList] = useState<Room[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const {
    roomState,
    setRoomState,
    setIsConnected,
    isConnected,
    connectGame,
    isGameStarted,
    setIsGameStarted,
  } = useGame();
  const [tmpPlayerID, setTmpPlayerID] = useState(""); // 暫存玩家ID
  const { playerID, setPlayerID, setIsReady } = usePlayer();
  const {
    connect: connectWs,
    isConnected: isConnectedWs,
    sendMessage,
  } = useConnection();
  const navigate = useNavigate();

  const handleMessage = (data: any) => {
    if (!data) return;
    const { type, payload, success } = data;
    switch (type) {
      case "connect":
        if (success) {
          setPlayerID(payload.playerID);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
        break;
      case "lobby:getRoomList":
        setRoomList(payload.roomList);
        break;
      case "lobby:join":
        if (success) {
          setIsReady(false);
          setRoomState({
            id: payload.roomID,
            owner: payload.roomState.owner,
            status: payload.roomState.status,
          });
          navigate(`/room/${payload.roomID}`);
        }
        break;
      case "room:ready":
        if (success) {
          setIsReady(true);
          setRoomState({
            id: payload.roomID,
            owner: payload.roomState.owner,
            status: payload.roomState.status,
          });
        }
        break;
      case "room:start":
        if (success) {
          setIsGameStarted(true);
          setRoomState({
            id: payload.roomID,
            owner: payload.roomState.owner,
            status: payload.roomState.status,
          });
        }
        break;
    }
  };

  // 取得房間列表
  // const getRoomList = async () => {
  //   const { data } = await instance.get("/api/rooms");
  //   setRoomList(data.data);
  // };

  // 加入房間
  const handleJoinRoom = (roomID: string) => {
    if (!playerID.trim()) {
      alert("請先輸入您的名字！");
      return;
    }
    if (!isConnectedWs) {
      alert("請先連線！");
      return;
    }
    sendMessage("apple", "join", { roomID });
  };

  useEffect(() => {
    connectWs(handleMessage);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
            遊戲大廳
          </h1>

          {playerID && isConnected ? (
            <div className="text-center text-2xl font-semibold text-gray-800 mb-10">
              玩家名稱: {playerID}
            </div>
          ) : (
            <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
              <label
                htmlFor="playerID"
                className="block text-lg font-semibold text-gray-800 mb-2"
              >
                輸入您的名字
              </label>
              <input
                type="text"
                id="playerID"
                value={tmpPlayerID}
                onChange={(e) => setTmpPlayerID(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out"
                placeholder="您的名字..."
              />
              <button
                onClick={() => {
                  connectGame(tmpPlayerID);
                }}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                送出並連線
              </button>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">可用房間</h2>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors cursor-pointer"
              >
                創建房間
              </button>
            </div>

            <CreateRoomModal
              newRoomId={newRoomId}
              setNewRoomId={setNewRoomId}
              setShowCreateRoom={setShowCreateRoom}
              showCreateRoom={showCreateRoom}
              handleJoinRoom={handleJoinRoom}
            />

            <div className="grid gap-4">
              {roomList.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  handleJoinRoom={handleJoinRoom}
                />
              ))}
              {roomList.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  目前沒有可用的房間
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;

const CreateRoomModal = ({
  newRoomId,
  setNewRoomId,
  setShowCreateRoom,
  showCreateRoom,
  handleJoinRoom,
}: {
  newRoomId: string;
  setNewRoomId: (id: string) => void;
  setShowCreateRoom: (show: boolean) => void;
  showCreateRoom: boolean;
  handleJoinRoom: (id: string) => void;
}) => {
  if (!showCreateRoom) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">創建新房間</h3>
        <input
          type="text"
          value={newRoomId}
          onChange={(e) => setNewRoomId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
          placeholder="輸入房間ID..."
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setShowCreateRoom(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => {
              handleJoinRoom(newRoomId);
              setShowCreateRoom(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 cursor-pointer"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
};

const RoomCard = ({
  room,
  handleJoinRoom,
}: {
  room: Room;
  handleJoinRoom: (id: string) => void;
}) => {
  return (
    <div
      key={room.id}
      className="flex items-center justify-between bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">房間 {room.id}</h3>
        <p className="text-sm text-gray-500">玩家數: {room.clients.length}/2</p>
      </div>
      <button
        onClick={() => handleJoinRoom(room.id)}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
        disabled={room.clients.length >= 2}
      >
        加入房間
      </button>
    </div>
  );
};
