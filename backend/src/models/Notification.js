const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:   { type: String, required: true },
    icon:    { type: String, default: "🔔" },
    bg:      { type: String, default: "rgba(0,212,170,.1)" },
    unread:  { type: Boolean, default: true },
    link:    { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
