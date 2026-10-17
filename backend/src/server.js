require("dotenv").config();
const express      = require("express");
const http         = require("http");
const cors         = require("cors");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");

const connectDB    = require("./config/db");
const setupSocket  = require("./socket");
const errorHandler = require("./middleware/errorHandler");

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes         = require("./routes/auth");
const shopRoutes         = require("./routes/shops");
const queueRoutes        = require("./routes/queue");
const notifRoutes        = require("./routes/notifications");

// ── App setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Rate limiting (global) ────────────────────────────────────────────────────
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // Generous capacity for live dashboard syncs and multiple users
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later" },
  })
);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = setupSocket(server, corsOptions);

// Attach io to every request so controllers can emit
app.use((req, _res, next) => { req.io = io; next(); });

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/shops",         shopRoutes);
app.use("/api/queue",         queueRoutes);
app.use("/api/notifications", notifRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() })
);

// ── 404 catch ────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Central error handler ────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀  Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    console.log(`📡  Socket.io ready`);
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down…");
  server.close(() => process.exit(0));
});
