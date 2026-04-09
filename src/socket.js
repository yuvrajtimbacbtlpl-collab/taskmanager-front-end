import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ["websocket", "polling"], // Force websocket first to reduce polling logs
  reconnection: true,
  reconnectionAttempts: 3,
});

export default socket;