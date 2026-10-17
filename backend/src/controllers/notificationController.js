const Notification = require("../models/Notification");

// GET /api/notifications  — logged-in user's notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifs = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, notifications: notifs });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all  — mark all as read
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, unread: true }, { unread: false });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read  — mark one as read
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { unread: false }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
