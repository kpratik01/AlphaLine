const express = require("express");
const { body }  = require("express-validator");
const router  = express.Router();

const { register, login, getMe, updateMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const validate = (req, res, next) => {
  const { validationResult } = require("express-validator");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me",   protect, getMe);
router.patch("/me", protect, updateMe);

module.exports = router;
