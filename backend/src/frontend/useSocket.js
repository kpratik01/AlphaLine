/**
 * FILE: src/hooks/useSocket.js
 *
 * React hook that connects to the QueueLess Socket.io server.
 * Returns the socket instance and a helper to join/leave shop rooms.
 *
 * Usage:
 *   const { socket, joinShop, leaveShop } = useSocket();
 *
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on("queue:updated", ({ queue }) => setQueue(queue));
 *     joinShop(shopId);
 *     return () => leaveShop(shopId);
 *   }, [socket, shopId]);
 */

import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { tokenStore } from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let _socket = null; // singleton — one connection per tab

export default function useSocket(enabled = true) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const token = tokenStore.get();
    if (!token) return;

    // Reuse existing socket if already connected
    if (_socket?.connected) {
      socketRef.current = _socket;
      return;
    }

    _socket = io(SOCKET_URL, {
      auth:       { token },
      transports: ["websocket", "polling"],
      reconnectionDelay:    1000,
      reconnectionAttempts: 10,
    });

    _socket.on("connect",         () => console.log("🔌 Socket connected"));
    _socket.on("disconnect",      () => console.log("🔌 Socket disconnected"));
    _socket.on("connect_error",   (e) => console.warn("Socket error:", e.message));

    socketRef.current = _socket;

    return () => {
      // Don't disconnect on unmount — singleton lives for the session
    };
  }, [enabled]);

  const joinShop = useCallback((shopId) => {
    socketRef.current?.emit("joinShopRoom", shopId);
  }, []);

  const leaveShop = useCallback((shopId) => {
    socketRef.current?.emit("leaveShopRoom", shopId);
  }, []);

  return { socket: socketRef.current, joinShop, leaveShop };
}
