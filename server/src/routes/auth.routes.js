import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function publicUser(user) {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    address: user.address || ""
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/seed-admin", async (req, res) => {
  const { name = "Admin", email = "admin@shop.com", password = "admin123", seedKey = "" } = req.body || {};
  if (process.env.ADMIN_SEED_KEY && seedKey !== process.env.ADMIN_SEED_KEY) {
    return res.status(403).json({ message: "Invalid admin seed key" });
  }
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.json({ message: "Admin already exists", email });

  const user = new User({ name, email, role: "admin", passwordHash: "x" });
  await user.setPassword(password);
  await user.save();
  return res.json({ message: "Admin created", email, password });
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already used" });

  const user = new User({ name, email, role: "customer", passwordHash: "x" });
  await user.setPassword(password);
  await user.save();

  return res.json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: "Missing fields" });

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await user.checkPassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  return res.json({ token: signToken(user), user: publicUser(user) });
});

router.get("/profile", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(publicUser(user));
});

router.put("/profile", requireAuth, async (req, res) => {
  const { name, phone, address } = req.body || {};
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (name != null) user.name = String(name).trim() || user.name;
  if (phone != null) user.phone = String(phone).trim();
  if (address != null) user.address = String(address).trim();
  await user.save();
  res.json(publicUser(user));
});

export default router;
