/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useRef, useState } from "react";

interface ConnectionContextType {
  CONNECTION_TYPE: string;
  // playerID: string | null;
  isConnected: boolean;
  connect: (handleMessage: (data: any) => void) => void;
  disconnect: () => void;
  sendMessage: (gameID: string, type: string, payload?: any) => void;
}

const defaultConnectionContext: ConnectionContextType = {
  CONNECTION_TYPE: "apple",
  // playerID: null,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
  sendMessage: () => {},
};

export const ConnectionContext = createContext<ConnectionContextType>(
  defaultConnectionContext
);

interface ConnectionProviderProps {
  children: React.ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({
  children,
}) => {
  // const [playerID, setPlayerID] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);

  const connect = (handleMessage: (data: any) => void) => {
    ws.current = new WebSocket(`ws://localhost:3000`);
    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };
  };

  const disconnect = () => {
    if (ws.current) {
      ws.current.close();
      setIsConnected(false);
    }
  };

  const sendMessage = (gameID: string, type: string, payload?: any) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ gameID, type, payload }));
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        CONNECTION_TYPE: "apple",
        isConnected,
        connect,
        disconnect,
        sendMessage,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};
