/**
 * Seed script — run once to populate MongoDB with demo data.
 * Usage:  npm run seed
 * ⚠️  Drops existing Users, Shops and QueueEntries before seeding.
 */
require("dotenv").config();
const mongoose   = require("mongoose");
const connectDB  = require("../src/config/db");
const User       = require("../src/models/User");
const Shop       = require("../src/models/Shop");
const QueueEntry = require("../src/models/QueueEntry");
const Notification = require("../src/models/Notification");

async function seed() {
  await connectDB();

  // ── Wipe existing data ────────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Shop.deleteMany({}),
    QueueEntry.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log("🗑️  Cleared existing data");

  // ── Create admin ──────────────────────────────────────────────────────────
  const admin = await User.create({
    name:     "Admin User",
    email:    "admin@queueless.com",
    password: "admin1234",
    role:     "admin",
    phone:    "+91 98000 00001",
  });
  console.log(`✅  Admin created: ${admin.email}  (password: admin1234)`);

  // ── Create regular users ──────────────────────────────────────────────────
  const users = await User.insertMany([
    { name: "Raj Sharma",   email: "raj@example.com",   password: "user1234", role: "user", phone: "+91 98765 43210" },
    { name: "Priya Mehta",  email: "priya@example.com", password: "user1234", role: "user", phone: "+91 87654 32109" },
    { name: "Arjun Patel",  email: "arjun@example.com", password: "user1234", role: "user", phone: "+91 76543 21098" },
  ]);
  console.log(`✅  ${users.length} users created  (password: user1234 for all)`);

  // ── Create shops owned by admin ───────────────────────────────────────────
  const shopDefs = [
    { name: "City Bank – Main Branch",  category: "Banking",    address: "Sector 12, Pune",  avgWait: 18, rating: 4.3 },
    { name: "Apollo Clinic",            category: "Healthcare", address: "FC Road, Pune",    avgWait: 25, rating: 4.7 },
    { name: "Passport Seva Kendra",     category: "Government", address: "Deccan, Pune",     avgWait: 42, rating: 3.9, status: "paused" },
    { name: "ICICI Bank – PCMC",        category: "Banking",    address: "Pimpri, Pune",     avgWait: 12, rating: 4.1 },
    { name: "Fortis Hospital OPD",      category: "Healthcare", address: "Wakad, Pune",      avgWait: 35, rating: 4.5 },
    { name: "RTO Office",               category: "Government", address: "Chinchwad, Pune",  avgWait: 55, rating: 3.5 },
  ];

  const shops = await Shop.insertMany(
    shopDefs.map((s) => ({ ...s, owner: admin._id, servedToday: Math.floor(10 + Math.random() * 30) }))
  );
  console.log(`✅  ${shops.length} shops created`);

  // ── Seed queue entries for first shop ─────────────────────────────────────
  const mainShop = shops[0];
  const queueUsers = [users[0], users[1], users[2]];
  const entries = [];
  for (let i = 0; i < queueUsers.length; i++) {
    const u = queueUsers[i];
    entries.push({
      shop:          mainShop._id,
      user:          u._id,
      token:         `A00${i + 1}`,
      position:      i + 1,
      status:        i === 0 ? "serving" : "waiting",
      estimatedWait: i * mainShop.avgWait,
      phone:         u.phone,
      name:          u.name,
      joinedAt:      new Date(Date.now() - (queueUsers.length - i) * 8 * 60000),
    });
  }
  await QueueEntry.insertMany(entries);
  mainShop.queueLength = queueUsers.length;
  await mainShop.save();
  console.log(`✅  ${entries.length} queue entries seeded for "${mainShop.name}"`);

  // ── Seed notifications for first user ─────────────────────────────────────
  await Notification.insertMany([
    { user: users[0]._id, title: "Your turn is approaching — 2 people ahead.",             icon: "🔔", bg: "rgba(0,212,170,.1)",  unread: true  },
    { user: users[0]._id, title: "Token A001 confirmed at City Bank – Main Branch.",        icon: "✅", bg: "rgba(16,185,129,.1)", unread: true  },
    { user: users[0]._id, title: "City Bank queue has been resumed.",                       icon: "ℹ️", bg: "rgba(59,130,246,.1)", unread: false },
    { user: users[0]._id, title: "You saved 22 min using SmartQueue today!",               icon: "⚡", bg: "rgba(245,158,11,.1)", unread: false },
  ]);
  console.log("✅  Notifications seeded");

  console.log("\n🌱  Seed complete!\n");
  console.log("─────────────────────────────────────────");
  console.log("  Admin  → admin@queueless.com / admin1234");
  console.log("  User 1 → raj@example.com    / user1234");
  console.log("  User 2 → priya@example.com  / user1234");
  console.log("─────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
