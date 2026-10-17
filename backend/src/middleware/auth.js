const jwt        = require("jsonwebtoken");
const User       = require("../models/User");
const Shop       = require("../models/Shop");
const QueueEntry = require("../models/QueueEntry");

// Attach req.user from JWT bearer token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id || decoded.userId;
    req.user = await User.findById(userId).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

// Role gate — call AFTER protect
exports.requireRole = (...roles) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  const userRole = req.user.role;

  // Direct role match
  if (roles.includes(userRole)) {
    return next();
  }

  // Allow shop owner role ("admin" or "shop") whenever route requires admin or shop permissions
  if ((roles.includes("admin") || roles.includes("shop")) && (userRole === "admin" || userRole === "shop")) {
    return next();
  }

  // Allow "customer" role for "user" routes and vice-versa, and allow any logged in account for user queue requests
  if ((roles.includes("user") || roles.includes("customer")) && (userRole === "user" || userRole === "customer" || userRole === "admin" || userRole === "shop")) {
    return next();
  }

  // If route requires shop management permissions, check ownership
  if (roles.includes("admin") || roles.includes("shop")) {
    // 1. If entryId is present, verify if user owns the shop of this entry
    if (req.params?.entryId) {
      const entry = await QueueEntry.findById(req.params.entryId).select("shop");
      if (entry) {
        const isEntryShopOwner = await Shop.exists({ _id: entry.shop, owner: req.user._id });
        if (isEntryShopOwner) {
          return next();
        }
      }
    }

    // 2. If shopId is present, verify if user owns this shop
    if (req.params?.shopId) {
      const isShopOwner = await Shop.exists({ _id: req.params.shopId, owner: req.user._id });
      if (isShopOwner) {
        return next();
      }
    }

    // 3. General check if user owns any shop
    const isOwner = await Shop.exists({ owner: req.user._id });
    if (isOwner) {
      return next();
    }
  }

  return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions" });
};
