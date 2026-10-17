const express = require("express");
const router  = express.Router();

const {
  getQueue, joinQueue, callNext, markDone, cancelEntry, acceptEntry, rejectEntry,
  removeEntry, togglePause, verifyToken, myActiveQueue, analytics,
} = require("../controllers/queueController");

const { protect, requireRole } = require("../middleware/auth");

// User routes
router.get("/my",                 protect, myActiveQueue);
router.get("/:shopId",            protect, getQueue);
router.post("/:shopId/join",      protect, requireRole("user", "customer"), joinQueue);
router.patch("/entry/:entryId/cancel", protect, requireRole("user", "customer"), cancelEntry);

// Admin routes
router.patch("/entry/:entryId/accept", protect, requireRole("admin", "shop"), acceptEntry);
router.patch("/entry/:entryId/reject", protect, requireRole("admin", "shop"), rejectEntry);
router.post("/:shopId/next",      protect, requireRole("admin", "shop"), callNext);
router.patch("/entry/:entryId/done", protect, requireRole("admin", "shop"), markDone);
router.delete("/entry/:entryId",  protect, requireRole("admin", "shop"), removeEntry);
router.post("/:shopId/pause",     protect, requireRole("admin"), togglePause);
router.post("/verify",            protect, requireRole("admin"), verifyToken);
router.get("/:shopId/analytics",  protect, requireRole("admin"), analytics);

module.exports = router;
