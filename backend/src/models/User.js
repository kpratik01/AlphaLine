const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never returned in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin", "shop", "customer"],
      default: "user",
    },
    avatar: {
      type: String, // initials derived on login, not stored
      default: "",
    },
    // Stats for user dashboard
    queuesJoined:    { type: Number, default: 0 },
    queuesCompleted: { type: Number, default: 0 },
    queuesCancelled: { type: Number, default: 0 },
    totalWaitSaved:  { type: Number, default: 0 }, // minutes
    rating:          { type: Number, default: 5.0 },
    // Preferences
    smsNotifications:   { type: Boolean, default: true },
    emailAlerts:        { type: Boolean, default: true },
    pushNotifications:  { type: Boolean, default: false },
    memberSince: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain password with hashed
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Derive avatar initials from name
userSchema.methods.getAvatar = function () {
  return this.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Sanitised public profile (no password)
userSchema.methods.toPublicJSON = function () {
  return {
    id:              this._id,
    name:            this.name,
    email:           this.email,
    phone:           this.phone,
    role:            this.role,
    avatar:          this.getAvatar(),
    queuesJoined:    this.queuesJoined,
    queuesCompleted: this.queuesCompleted,
    queuesCancelled: this.queuesCancelled,
    totalWaitSaved:  this.totalWaitSaved,
    rating:          this.rating,
    memberSince:     this.memberSince,
    smsNotifications:  this.smsNotifications,
    emailAlerts:       this.emailAlerts,
    pushNotifications: this.pushNotifications,
  };
};

module.exports = mongoose.model("User", userSchema);
