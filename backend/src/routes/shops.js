const express = require("express");
const router  = express.Router();

const {
  listShops, getShop, createShop, updateShop, deleteShop, myShops,
} = require("../controllers/shopController");

const { protect, requireRole } = require("../middleware/auth");

router.get("/",   protect, listShops);
router.get("/my", protect, requireRole("admin", "shop"), myShops);
router.get("/:id", protect, getShop);

router.post("/",     protect, requireRole("admin", "shop"), createShop);
router.patch("/:id", protect, requireRole("admin", "shop"), updateShop);
router.delete("/:id", protect, requireRole("admin", "shop"), deleteShop);

module.exports = router;
