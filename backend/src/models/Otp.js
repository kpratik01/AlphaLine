const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ["login", "register"],
    required: true,
  },
  // Pending registration data (stored until OTP verified)
  pendingData: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: true,
    // Auto-delete after expiry
    index: { expireAfterSeconds: 0 },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Index for fast lookup
otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("Otp", otpSchema);
