const Shop       = require("../models/Shop");
const QueueEntry = require("../models/QueueEntry");

// ── GET /api/shops  (public – any logged-in user) ─────────────────────────────
exports.listShops = async (req, res, next) => {
  try {
    const { category, status } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;

    const shops = await Shop.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    const shopList = await Promise.all(
      shops.map(async (shop) => {
        const queueLength = await QueueEntry.countDocuments({
          shop: shop._id,
          status: { $in: ["waiting", "serving"] },
        });
        const obj = shop.toObject();
        obj.queueLength = queueLength;
        return obj;
      })
    );

    res.json({ success: true, count: shopList.length, shops: shopList });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/shops/:id ────────────────────────────────────────────────────────
exports.getShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate("owner", "name email");
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });
    res.json({ success: true, shop });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/shops  (admin only) ─────────────────────────────────────────────
exports.createShop = async (req, res, next) => {
  try {
    const { name, category, address, avgWait } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Shop name is required" });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: "Shop address is required" });
    }

    const validCategories = ["Banking", "Healthcare", "Government", "Other"];
    const normalizedCategory = validCategories.includes(category) ? category : "Other";
    const normalizedWait = Math.max(1, parseInt(avgWait, 10) || 10);

    const shop = await Shop.create({
      name: name.trim(),
      category: normalizedCategory,
      address: address.trim(),
      avgWait: normalizedWait,
      owner: req.user._id,
      status: "active",
      queueLength: 0,
      servedToday: 0,
      noshowsToday: 0,
    });

    const populatedShop = await Shop.findById(shop._id).populate("owner", "name email");

    // Broadcast to all connected sockets
    if (req.io) {
      req.io.emit("shop:created", populatedShop || shop);
    }

    res.status(201).json({ success: true, shop: populatedShop || shop });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/shops/:id  (admin, owner only) ─────────────────────────────────
exports.updateShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    // Only the owning admin can update
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your shop" });
    }

    const allowed = ["name", "category", "address", "avgWait", "status"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) shop[f] = req.body[f]; });
    await shop.save();

    req.io.emit("shop:updated", shop);
    res.json({ success: true, shop });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/shops/:id  (admin, owner only) ────────────────────────────────
exports.deleteShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ success: false, message: "Shop not found" });

    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not your shop" });
    }

    // Safely update all active queue entries for this shop and notify customers
    const activeEntries = await QueueEntry.find({
      shop: shop._id,
      status: { $in: ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"] },
    });
    for (const entry of activeEntries) {
      entry.status = "cancelled";
      await entry.save();
      const targetUserId = (entry.user?._id || entry.user).toString();
      req.io.to(`user:${targetUserId}`).emit("queue:rejected", {
        entryId: entry._id,
        message: "The shop owner cancelled your queue request."
      });
      req.io.to(`user:${targetUserId}`).emit("queue:cancelled", { entryId: entry._id });
      req.io.to(`user:${targetUserId}`).emit("notification:new", { title: "The shop owner cancelled your queue request." });
    }

    await shop.deleteOne();

    req.io.emit("shop:deleted", { shopId: shop._id });
    req.io.emit("shop:updated", { shopId: shop._id });

    res.json({ success: true, message: "Shop deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/shops/my  (admin – their own shops) ──────────────────────────────
exports.myShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({ owner: req.user._id }).sort({ createdAt: -1 });

    const shopList = await Promise.all(
      shops.map(async (shop) => {
        const queueLength = await QueueEntry.countDocuments({
          shop: shop._id,
          status: { $in: ["waiting", "serving", "pending", "accepted"] },
        });
        const obj = shop.toObject();
        obj.queueLength = queueLength;
        return obj;
      })
    );

    res.json({ success: true, count: shopList.length, shops: shopList });
  } catch (err) {
    next(err);
  }
};
