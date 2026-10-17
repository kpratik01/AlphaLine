const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Banking", "Healthcare", "Government", "Other"],
      default: "Other",
    },
    address:  { type: String, required: true, trim: true },
    avgWait:  { type: Number, default: 10 },   // minutes
    status:   { type: String, enum: ["active", "paused", "closed"], default: "active" },
    rating:   { type: Number, default: 4.0 },
    owner:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Runtime counters (updated live)
    queueLength:  { type: Number, default: 0 },
    servedToday:  { type: Number, default: 0 },
    noshowsToday: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shop", shopSchema);
