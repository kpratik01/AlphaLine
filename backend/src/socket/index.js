const jwt        = require("jsonwebtoken");
const User       = require("../models/User");

/**
 * Attach Socket.io to the HTTP server.
 * Returns the io instance so routes can call req.io.emit(…)
 *
 * Rooms:
 *   shop:<shopId>  — joined by admins who manage that shop & users in that queue
 *   user:<userId>  — private per-user room for targeted notifications
 */
module.exports = (server, corsOptions) => {
  const { Server } = require("socket.io");

  const io = new Server(server, {
    cors: corsOptions,
    transports: ["websocket", "polling"],
  });

  // ── Auth middleware: verify JWT on socket handshake ──────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌  Socket connected: ${user.name} (${user.role}) [${socket.id}]`);

    // Always join personal room
    socket.join(`user:${user._id}`);

    // ── Join a shop room (to watch that queue) ────────────────────────────────
    socket.on("joinShopRoom", (shopId) => {
      socket.join(`shop:${shopId}`);
      console.log(`   ${user.name} joined shop room: ${shopId}`);
    });

    // ── Leave a shop room ─────────────────────────────────────────────────────
    socket.on("leaveShopRoom", (shopId) => {
      socket.leave(`shop:${shopId}`);
    });

    // ── Ping / heartbeat ──────────────────────────────────────────────────────
    socket.on("ping", () => socket.emit("pong"));

    socket.on("disconnect", () => {
      console.log(`🔌  Socket disconnected: ${user.name} [${socket.id}]`);
    });
  });

  return io;
};
