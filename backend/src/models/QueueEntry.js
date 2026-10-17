const mongoose = require("mongoose");

// Generate a short alphanumeric token like A001 / Q1234
function generateToken(prefix = "Q") {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

const queueEntrySchema = new mongoose.Schema(
  {
    shop:     { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true, index: true },
    user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token:    { type: String, required: true },
    position: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "PENDING",
        "accepted",
        "ACCEPTED",
        "rejected",
        "REJECTED",
        "waiting",
        "serving",
        "completed",
        "cancelled",
        "noshow",
      ],
      default: "pending",
      index: true,
    },
    joinedAt:    { type: Date, default: Date.now },
    acceptedAt:  { type: Date },
    calledAt:    { type: Date },
    completedAt: { type: Date },

    estimatedWait: { type: Number, default: 0 }, // minutes at join time
    actualWait:    { type: Number },              // minutes when served

    phone: { type: String, default: "" }, // snapshot from user at join time
    name:  { type: String, default: "" }, // snapshot from user at join time
  },
  { timestamps: true }
);

// Unique token per shop index
queueEntrySchema.index({ shop: 1, token: 1 });

queueEntrySchema.statics.createEntry = async function (shopId, user, position, avgWait) {
  // Generate a new unique token number (e.g. 102, 147, 231) not previously used in this shop
  const existingTokens = await this.distinct("token", { shop: shopId });
  const existingSet = new Set(existingTokens);

  let token = "";
  let attempts = 0;
  while (!token && attempts < 200) {
    const candidate = String(Math.floor(100 + Math.random() * 900));
    if (!existingSet.has(candidate)) {
      token = candidate;
    }
    attempts++;
  }

  // Fallback to 4-digit token if 3-digit range is saturated
  if (!token) {
    attempts = 0;
    while (!token && attempts < 200) {
      const candidate = String(Math.floor(1000 + Math.random() * 9000));
      if (!existingSet.has(candidate)) {
        token = candidate;
      }
      attempts++;
    }
  }

  if (!token) {
    token = String(Date.now()).slice(-4);
  }

  const requesterName = user?.name || (user?._id ? (await mongoose.model("User").findById(user._id))?.name : "") || "Customer";
  const requesterPhone = user?.phone || "";

  return this.create({
    shop:          shopId,
    user:          user._id || user,
    token,
    position,
    status:        "pending",
    estimatedWait: Math.max(0, (position - 1) * avgWait),
    phone:         requesterPhone,
    name:          requesterName,
  });
};

module.exports = mongoose.model("QueueEntry", queueEntrySchema);
