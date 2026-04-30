import { io } from "socket.io-client";

// FIX: VITE_SOCKET_URL must point to your backend server root (no /api).
// Example .env values:
//   Local:      VITE_SOCKET_URL=http://localhost:4000
//   DevTunnel:  VITE_SOCKET_URL=https://gn4mfrgh-4000.inc1.devtunnels.ms
//   Production: VITE_SOCKET_URL=https://taskmanager-backend-i8h7.onrender.com
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  // FIX: Start with "polling" so the connection succeeds behind proxies/devtunnels
  // that don't support WebSocket upgrades, then Socket.IO auto-upgrades to ws.
  // The original ["websocket", "polling"] order caused the WebSocket to fail first
  // and left the socket stuck in reconnect loops.
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;