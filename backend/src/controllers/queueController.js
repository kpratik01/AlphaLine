const QueueEntry   = require("../models/QueueEntry");
const Shop         = require("../models/Shop");
const Notification = require("../models/Notification");
const User         = require("../models/User");

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (date) =>
  new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

// Recalculate and persist estimated waits for all waiting entries in a shop
const recalcWaits = async (shopId, avgWait) => {
  const activeWaiting = await QueueEntry.find({
    shop: shopId,
    status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting"] },
  }).sort("position");
  for (let i = 0; i < activeWaiting.length; i++) {
    activeWaiting[i].estimatedWait = i * avgWait;
    await activeWaiting[i].save();
  }
};

// ── GET /api/queue/:shopId  (current queue for a shop) ───────────────────────
exports.getQueue = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    const entries = await QueueEntry.find({
      shop: shopId,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    })
      .populate("user", "name phone")
      .sort("position");

    res.json({ success: true, queue: entries, shop });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/queue/:shopId/join  (user) ──────────────────────────────────────
exports.joinQueue = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    if (shop.status !== "active") {
      return res.status(400).json({ success: false, message: "This queue is currently paused or closed" });
    }

    // Check if user is already in this queue
    const existing = await QueueEntry.findOne({
      shop: shopId,
      user: req.user._id,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "You are already in this queue", entry: existing });
    }

    // Next position = max active position + 1
    const lastEntry = await QueueEntry.findOne({
      shop: shopId,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    }).sort("-position");
    const position  = lastEntry ? lastEntry.position + 1 : 1;

    const entry = await QueueEntry.createEntry(shopId, req.user, position, shop.avgWait);
    await entry.populate("user", "name phone email");

    // Update shop queue length
    shop.queueLength = await QueueEntry.countDocuments({
      shop: shopId,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    await shop.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { queuesJoined: 1 } });

    // Notify user
    await Notification.create({
      user:  req.user._id,
      title: `Token ${entry.token} request submitted to ${shop.name}.`,
      icon:  "⏳",
      bg:    "rgba(245,158,11,.1)",
    });

    // Real-time broadcast to shop room
    req.io.to(`shop:${shopId}`).emit("queue:joined", { entry, queueLength: shop.queueLength });
    req.io.to(`user:${req.user._id}`).emit("notification:new", { title: `Token ${entry.token} request submitted`, shop: shop.name });

    res.status(201).json({ success: true, entry, position, estimatedWait: entry.estimatedWait });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/queue/:shopId/next  (admin) ─────────────────────────────────────
exports.callNext = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    // Mark current serving entry as completed
    const serving = await QueueEntry.findOne({ shop: shopId, status: "serving" }).populate("user", "_id name");
    if (serving) {
      const waitMinutes = Math.round((Date.now() - serving.joinedAt) / 60000);
      serving.status      = "completed";
      serving.completedAt = new Date();
      serving.actualWait  = waitMinutes;
      await serving.save();

      shop.servedToday++;
      await User.findByIdAndUpdate(serving.user._id, {
        $inc: { queuesCompleted: 1, totalWaitSaved: Math.max(0, serving.estimatedWait - waitMinutes) },
      });

      // Notify served user
      await Notification.create({
        user:  serving.user._id,
        title: `Your visit at ${shop.name} is complete. Thank you!`,
        icon:  "✅",
        bg:    "rgba(16,185,129,.1)",
      });
      req.io.to(`user:${serving.user._id}`).emit("queue:completed", { token: serving.token, shop: shop.name });
    }

    // Bring next accepted or waiting entry to serving
    const next = await QueueEntry.findOne({
      shop: shopId,
      status: { $in: ["ACCEPTED", "accepted", "waiting"] },
    })
      .sort("position")
      .populate("user", "_id name phone");

    if (next) {
      next.status   = "serving";
      next.calledAt = new Date();
      await next.save();

      // Notify the called user
      await Notification.create({
        user:  next.user._id,
        title: `Your turn is here! Token ${next.token} is now being served at ${shop.name}.`,
        icon:  "🔔",
        bg:    "rgba(0,212,170,.1)",
      });
      req.io.to(`user:${next.user._id}`).emit("queue:yourTurn", { token: next.token, shop: shop.name });

      // Notify user who is now 2nd
      const second = await QueueEntry.findOne({
        shop: shopId,
        status: { $in: ["ACCEPTED", "accepted", "waiting"] },
      })
        .sort("position")
        .populate("user", "_id name");
      if (second) {
        await Notification.create({
          user:  second.user._id,
          title: `Your turn is approaching — 1 person ahead at ${shop.name}.`,
          icon:  "🔔",
          bg:    "rgba(0,212,170,.1)",
        });
        req.io.to(`user:${second.user._id}`).emit("notification:new", { title: "1 person ahead of you" });
      }
    }

    // Recalculate wait times and update shop length
    await recalcWaits(shopId, shop.avgWait);
    shop.queueLength = await QueueEntry.countDocuments({
      shop: shopId,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    await shop.save();

    const updatedQueue = await QueueEntry.find({
      shop: shopId,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    })
      .populate("user", "name phone")
      .sort("position");

    req.io.to(`shop:${shopId}`).emit("queue:updated", { queue: updatedQueue, queueLength: shop.queueLength });

    res.json({ success: true, calledEntry: next || null, queueLength: shop.queueLength });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/queue/entry/:entryId/done  (admin) ─────────────────────────────
exports.markDone = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findById(req.params.entryId).populate("user", "_id name");
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    if (entry.status === "completed") {
      return res.status(400).json({ success: false, message: "Already completed" });
    }

    const waitMinutes = Math.round((Date.now() - entry.joinedAt) / 60000);
    entry.status      = "completed";
    entry.completedAt = new Date();
    entry.actualWait  = waitMinutes;
    await entry.save();

    const shop = await Shop.findByIdAndUpdate(
      entry.shop,
      { $inc: { servedToday: 1 } },
      { new: true }
    );
    shop.queueLength = await QueueEntry.countDocuments({
      shop: entry.shop,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    await shop.save();

    await User.findByIdAndUpdate(entry.user._id, { $inc: { queuesCompleted: 1 } });

    if (entry.user?._id) {
      await Notification.create({
        user:  entry.user._id,
        title: "Your session for today is completed. Thank you!",
        icon:  "✅",
        bg:    "rgba(16,185,129,.1)",
      });
      req.io.to(`user:${entry.user._id}`).emit("queue:completed", { token: entry.token, shop: shop.name });
      req.io.to(`user:${entry.user._id}`).emit("notification:new", { title: "Your session for today is completed. Thank you!" });
    }

    const updatedQueue = await QueueEntry.find({
      shop: entry.shop,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    })
      .populate("user", "name phone")
      .sort("position");

    req.io.to(`shop:${entry.shop}`).emit("queue:updated", { queue: updatedQueue, queueLength: shop.queueLength });
    req.io.to(`shop:${entry.shop}`).emit("queue:entryUpdated", { entryId: entry._id, status: "completed", queueLength: shop.queueLength });

    res.json({ success: true, entry });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/queue/entry/:entryId/cancel  (user cancels own entry) ──────────
exports.cancelEntry = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    if (entry.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your queue entry" });
    }

    if (["ACCEPTED", "accepted"].includes(entry.status)) {
      const acceptedTime = entry.acceptedAt ? new Date(entry.acceptedAt).getTime() : new Date(entry.updatedAt).getTime();
      const diffMs = Date.now() - acceptedTime;
      const ONE_MINUTE_MS = 60 * 1000;
      if (diffMs > ONE_MINUTE_MS) {
        return res.status(400).json({
          success: false,
          message: "Cancellation window has expired. Accepted requests can only be cancelled within 1 minute of acceptance.",
        });
      }
    } else if (entry.status === "serving") {
      return res.status(400).json({
        success: false,
        message: "Your turn is currently being served and cannot be cancelled.",
      });
    }

    entry.status = "cancelled";
    await entry.save();

    await User.findByIdAndUpdate(req.user._id, { $inc: { queuesCancelled: 1 } });

    const shop = await Shop.findById(entry.shop);
    if (shop) {
      await recalcWaits(entry.shop, shop.avgWait);
      shop.queueLength = await QueueEntry.countDocuments({
        shop: entry.shop,
        status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
      });
      await shop.save();
    }

    req.io.to(`shop:${entry.shop}`).emit("queue:entryUpdated", { entryId: entry._id, status: "cancelled", queueLength: shop?.queueLength || 0 });
    req.io.to(`user:${req.user._id}`).emit("queue:cancelled", { entryId: entry._id, token: entry.token });

    res.json({ success: true, message: "Queue entry cancelled", entry });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/queue/entry/:entryId/accept  (admin/shop owner accepts customer request) ───
exports.acceptEntry = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    if (["ACCEPTED", "accepted"].includes(entry.status)) {
      return res.json({ success: true, message: "Request is already accepted.", entry });
    }

    const shop = await Shop.findById(entry.shop);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    const ownerId = shop.owner?._id ? shop.owner._id.toString() : shop.owner.toString();
    const userId  = req.user._id.toString();
    if (ownerId !== userId && req.user.role !== "admin" && req.user.role !== "shop") {
      return res.status(403).json({ success: false, message: "Not your shop" });
    }

    entry.status = "ACCEPTED";
    entry.acceptedAt = new Date();
    await entry.save();

    await recalcWaits(entry.shop, shop.avgWait);
    shop.queueLength = await QueueEntry.countDocuments({
      shop: entry.shop,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    await shop.save();

    const targetUserId = (entry.user?._id || entry.user).toString();

    const acceptMessage = "Your queue request has been accepted by the shop owner.";

    // Notify customer
    await Notification.create({
      user:  targetUserId,
      title: acceptMessage,
      icon:  "✅",
      bg:    "rgba(16,185,129,.1)",
    });

    req.io.to(`user:${targetUserId}`).emit("queue:accepted", {
      entryId: entry._id,
      token:   entry.token,
      message: acceptMessage,
    });
    req.io.to(`user:${targetUserId}`).emit("notification:new", { title: acceptMessage });

    const updatedQueue = await QueueEntry.find({
      shop: entry.shop,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    })
      .populate("user", "name phone")
      .sort("position");

    req.io.to(`shop:${entry.shop}`).emit("queue:updated", { queue: updatedQueue, queueLength: shop.queueLength });
    req.io.to(`shop:${entry.shop}`).emit("queue:entryUpdated", { entryId: entry._id, status: "ACCEPTED", queueLength: shop.queueLength });

    res.json({ success: true, message: acceptMessage, entry });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/queue/entry/:entryId/reject  (admin/shop owner rejects customer request) ───
exports.rejectEntry = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    const shop = await Shop.findById(entry.shop);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    const ownerId = shop.owner?._id ? shop.owner._id.toString() : shop.owner.toString();
    const userId  = req.user._id.toString();
    if (ownerId !== userId && req.user.role !== "admin" && req.user.role !== "shop") {
      return res.status(403).json({ success: false, message: "Not your shop" });
    }

    entry.status = "REJECTED";
    await entry.save();

    const targetUserId = (entry.user?._id || entry.user).toString();
    await User.findByIdAndUpdate(targetUserId, { $inc: { queuesCancelled: 1 } });

    shop.queueLength = await QueueEntry.countDocuments({
      shop: entry.shop,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    await shop.save();

    await recalcWaits(entry.shop, shop.avgWait);

    const rejectMessage = "Your queue request was rejected by the shop owner.";

    // Notify customer
    await Notification.create({
      user:  targetUserId,
      title: rejectMessage,
      icon:  "❌",
      bg:    "rgba(239,68,68,.1)",
    });

    req.io.to(`user:${targetUserId}`).emit("queue:rejected", {
      entryId: entry._id,
      message: rejectMessage,
    });
    req.io.to(`user:${targetUserId}`).emit("queue:cancelled", { entryId: entry._id });
    req.io.to(`user:${targetUserId}`).emit("notification:new", { title: rejectMessage });

    const updatedQueue = await QueueEntry.find({
      shop: entry.shop,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    })
      .populate("user", "name phone")
      .sort("position");

    req.io.to(`shop:${entry.shop}`).emit("queue:updated", { queue: updatedQueue, queueLength: shop.queueLength });
    req.io.to(`shop:${entry.shop}`).emit("queue:entryUpdated", { entryId: entry._id, status: "REJECTED", queueLength: shop.queueLength });

    res.json({ success: true, message: rejectMessage });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/queue/entry/:entryId  (admin removes) ────────────────────────
exports.removeEntry = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findById(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    const shop = await Shop.findById(entry.shop);
    if (shop) {
      const ownerId = shop.owner?._id ? shop.owner._id.toString() : shop.owner.toString();
      const userId  = req.user._id.toString();
      if (ownerId !== userId && req.user.role !== "admin" && req.user.role !== "shop") {
        return res.status(403).json({ success: false, message: "Not your shop" });
      }
    }

    await entry.deleteOne();

    if (shop) {
      shop.queueLength = await QueueEntry.countDocuments({
        shop: entry.shop,
        status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
      });
      await shop.save();
      req.io.to(`shop:${entry.shop}`).emit("queue:entryRemoved", { entryId: entry._id, queueLength: shop.queueLength });
    }

    res.json({ success: true, message: "Entry removed" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/queue/:shopId/pause  (admin) ────────────────────────────────────
exports.togglePause = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    shop.status = shop.status === "active" ? "paused" : "active";
    await shop.save();

    req.io.to(`shop:${shop._id}`).emit("shop:statusChanged", { shopId: shop._id, status: shop.status });

    res.json({ success: true, status: shop.status });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/queue/verify  (admin – verify a token) ─────────────────────────
exports.verifyToken = async (req, res, next) => {
  try {
    const { token, shopId } = req.body;
    const invalidMessage = "Invalid token. Request not verified.";

    if (!token || !shopId) {
      return res.json({ success: false, valid: false, message: invalidMessage });
    }

    const rawToken = String(token).trim();
    const cleanToken = rawToken.toUpperCase().replace(/^TOKEN\s*/i, "");

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.json({ success: false, valid: false, message: invalidMessage });
    }

    // Verify token belongs to correct shop and is a valid request
    const entry = await QueueEntry.findOne({
      shop: shopId,
      token: { $in: [rawToken, cleanToken] },
    })
      .sort({ createdAt: -1 })
      .populate("user", "_id name phone");

    if (!entry) {
      return res.json({ success: false, valid: false, message: invalidMessage });
    }

    const validStatuses = ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"];
    if (!validStatuses.includes(entry.status)) {
      return res.json({
        success: false,
        valid: false,
        message: invalidMessage,
      });
    }

    // If entry is pending, accepted or waiting: transition to serving!
    if (["pending", "PENDING", "accepted", "ACCEPTED", "waiting"].includes(entry.status)) {
      entry.status   = "serving";
      entry.calledAt = new Date();
      await entry.save();

      await recalcWaits(shopId, shop.avgWait);
      shop.queueLength = await QueueEntry.countDocuments({
        shop: shopId,
        status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
      });
      await shop.save();

      if (entry.user?._id) {
        await Notification.create({
          user:  entry.user._id,
          title: `Your token ${entry.token} is now being served at ${shop.name}.`,
          icon:  "🔔",
          bg:    "rgba(0,212,170,.1)",
        });
        req.io.to(`user:${entry.user._id}`).emit("queue:yourTurn", { token: entry.token, shop: shop.name });
      }

      const updatedQueue = await QueueEntry.find({
        shop: shopId,
        status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
      })
        .populate("user", "name phone")
        .sort("position");

      req.io.to(`shop:${shopId}`).emit("queue:updated", { queue: updatedQueue, queueLength: shop.queueLength });
      req.io.to(`shop:${shopId}`).emit("queue:entryUpdated", { entryId: entry._id, status: "serving", queueLength: shop.queueLength });

      return res.json({
        success: true,
        valid: true,
        message: `Token ${entry.token} verified! Marked as now serving.`,
        entry: {
          _id:      entry._id,
          token:    entry.token,
          name:     entry.name || entry.user?.name,
          phone:    entry.phone || entry.user?.phone,
          status:   "serving",
          joinedAt: formatTime(entry.joinedAt),
          position: entry.position,
        },
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: `Token ${entry.token} is currently being served.`,
      entry: {
        _id:      entry._id,
        token:    entry.token,
        name:     entry.name || entry.user?.name,
        phone:    entry.phone || entry.user?.phone,
        status:   entry.status,
        joinedAt: formatTime(entry.joinedAt),
        position: entry.position,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/queue/my  (user – their active entries) ───────────────────────────
exports.myActiveQueue = async (req, res, next) => {
  try {
    const filter = {
      user:   req.user._id,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    };
    if (req.query.shopId) {
      filter.shop = req.query.shopId;
    }
    const entries = await QueueEntry.find(filter)
      .sort({ createdAt: -1 })
      .populate("shop", "name address avgWait status category");

    res.json({ success: true, entries, entry: entries[0] || null });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/queue/:shopId/analytics  (admin) ─────────────────────────────────
exports.analytics = async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [served, noshow, waiting, serving] = await Promise.all([
      QueueEntry.countDocuments({ shop: shopId, status: "completed", completedAt: { $gte: todayStart } }),
      QueueEntry.countDocuments({ shop: shopId, status: "noshow",    createdAt:   { $gte: todayStart } }),
      QueueEntry.countDocuments({ shop: shopId, status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting"] } }),
      QueueEntry.countDocuments({ shop: shopId, status: "serving"  }),
    ]);

    const completedToday = await QueueEntry.find({
      shop: shopId, status: "completed", completedAt: { $gte: todayStart }, actualWait: { $exists: true },
    }).select("actualWait");
    const avgActualWait = completedToday.length
      ? Math.round(completedToday.reduce((s, e) => s + e.actualWait, 0) / completedToday.length)
      : 0;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRaw = await QueueEntry.aggregate([
      { $match: { shop: require("mongoose").Types.ObjectId.createFromHexString(shopId), createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dayOfWeek: "$createdAt" }, count: { $sum: 1 } } },
    ]);
    const weeklyMap = {};
    weeklyRaw.forEach((r) => { weeklyMap[r._id] = r.count; });
    const weeklyVolume = [1,2,3,4,5,6,7].map((d) => weeklyMap[d] || 0);

    res.json({
      success: true,
      analytics: { served, noshow, waiting, serving, avgActualWait, weeklyVolume },
    });
  } catch (err) {
    next(err);
  }
};
