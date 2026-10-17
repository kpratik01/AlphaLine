const jwt  = require("jsonwebtoken");
const User = require("../models/User");
const Otp  = require("../models/Otp");

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({ success: true, token, user: user.toPublicJSON() });
};

const OTP_EXPIRY_MS  = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS   = 5;

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
// Called before login or register to issue an OTP
exports.sendOtp = async (req, res, next) => {
  try {
    const { email, purpose, name, phone, password, role } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ success: false, message: "Email and purpose are required" });
    }

    // For login: verify the user exists and password is correct first
    if (purpose === "login") {
      const user = await User.findOne({ email }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }
      if (role && user.role !== role) {
        return res.status(403).json({
          success: false,
          message: `This account is registered as a "${user.role}". Please select the correct role.`,
        });
      }
    }

    // For register: check email not already taken
    if (purpose === "register") {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, message: "Email already registered. Please sign in." });
      }
      if (!name || !password) {
        return res.status(400).json({ success: false, message: "Name and password are required for registration" });
      }
    }

    // Delete any existing OTP for this email+purpose
    await Otp.deleteMany({ email, purpose });

    // Generate and save new OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await Otp.create({
      email,
      otp,
      purpose,
      expiresAt,
      // Store pending registration data so we can create user on verify
      pendingData: purpose === "register" ? { name, phone: phone || "", password, role: role || "user" } : null,
    });

    // ── In production: send via email/SMS service ──────────────────────────────
    // e.g. await sendEmail({ to: email, subject: "Your OTP", text: `Your OTP is ${otp}` });
    // For development: log to console
    console.log(`\n📧  OTP for ${email} [${purpose}]: ${otp}  (expires in 5 min)\n`);

    res.json({
      success: true,
      message: `OTP sent to ${email}`,
      // In dev mode: return OTP directly for easy testing
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ success: false, message: "Email, OTP and purpose are required" });
    }

    const record = await Otp.findOne({ email, purpose });

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not found or already used. Request a new one." });
    }

    if (new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await record.deleteOne();
      return res.status(429).json({ success: false, message: "Too many failed attempts. Request a new OTP." });
    }

    if (record.otp !== otp.trim()) {
      record.attempts += 1;
      await record.save();
      const remaining = MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      });
    }

    // ── OTP is correct ─────────────────────────────────────────────────────────
    await record.deleteOne();

    if (purpose === "login") {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      return sendToken(user, 200, res);
    }

    if (purpose === "register") {
      const { name, phone, password, role } = record.pendingData;
      const user = await User.create({ name, email, phone, password, role });
      return sendToken(user, 201, res);
    }

    res.status(400).json({ success: false, message: "Unknown OTP purpose" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
exports.resendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      return res.status(400).json({ success: false, message: "Email and purpose required" });
    }

    // Find old record to copy pendingData
    const old = await Otp.findOne({ email, purpose });
    const pendingData = old?.pendingData || null;

    await Otp.deleteMany({ email, purpose });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await Otp.create({ email, otp, purpose, expiresAt, pendingData });

    console.log(`\n🔄  Resent OTP for ${email} [${purpose}]: ${otp}\n`);

    res.json({
      success: true,
      message: `OTP resent to ${email}`,
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    });
  } catch (err) {
    next(err);
  }
};

// ── Legacy: register/login without OTP (kept for compatibility) ───────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const assignedRole = (role === "admin" || role === "shop") ? "admin" : "user";
    const user = await User.create({ name, email, phone, password, role: assignedRole });
    sendToken(user, 201, res);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required" });
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    if (role && user.role !== role)
      return res.status(403).json({ success: false, message: `This account is registered as a "${user.role}".` });
    sendToken(user, 200, res);
  } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ["name", "phone", "smsNotifications", "emailAlerts", "pushNotifications"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
      }
    });
    if (updates.name && updates.name.length < 2) {
      return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) { next(err); }
};
