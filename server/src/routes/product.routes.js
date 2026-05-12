import express from "express";
import path from "path";
import Product from "../models/Product.js";
import { upload } from "../middleware/upload.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { safeUnlink } from "../utils/file.js";

const router = express.Router();

function numberOrDefault(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFiles(files = []) {
  return files.map((file) => ({
    url: `/uploads/${file.filename}`,
    path: path.resolve(file.path),
    name: file.originalname || file.filename
  }));
}

router.get("/", async (req, res) => {
  const { category, search, sort, minPrice, maxPrice, stock } = req.query;
  const q = {};
  if (category) q.category = category;
  if (search) q.$text = { $search: String(search) };
  if (minPrice || maxPrice) {
    q.price = {};
    if (minPrice) q.price.$gte = Number(minPrice);
    if (maxPrice) q.price.$lte = Number(maxPrice);
  }
  if (stock === "available") q.stock = { $gt: 0 };

  let order = { createdAt: -1 };
  if (sort === "price_low") order = { price: 1 };
  if (sort === "price_high") order = { price: -1 };
  if (sort === "rating") order = { rating: -1 };
  if (sort === "stock_low") order = { stock: 1 };

  const items = await Product.find(q).sort(order);
  res.json(items);
});

router.get("/low-stock/list", requireAuth, requireAdmin, async (req, res) => {
  const items = await Product.find({ $expr: { $lte: ["$stock", "$lowStockAlert"] } }).sort({ stock: 1 });
  res.json(items);
});

router.get("/:id", async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  res.json(p);
});

router.post("/", requireAuth, requireAdmin, upload.array("images", 5), async (req, res) => {
  const { title, price, buyingPrice, stock, lowStockAlert, rating, category, description } = req.body || {};
  if (!title || !price || !category) return res.status(400).json({ message: "Missing fields" });

  const images = normalizeFiles(req.files || []);
  const primary = images[0] || null;

  const p = await Product.create({
    title,
    price: numberOrDefault(price),
    buyingPrice: numberOrDefault(buyingPrice),
    stock: numberOrDefault(stock),
    lowStockAlert: numberOrDefault(lowStockAlert, 5),
    rating: rating ? numberOrDefault(rating, 4.5) : 4.5,
    category,
    description: description || "",
    imageUrl: primary?.url || "",
    imagePath: primary?.path || "",
    images
  });

  res.status(201).json(p);
});

router.put("/:id", requireAuth, requireAdmin, upload.array("images", 5), async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });

  const { title, price, buyingPrice, stock, lowStockAlert, rating, category, description } = req.body || {};
  if (title != null) p.title = title;
  if (price != null) p.price = numberOrDefault(price, p.price);
  if (buyingPrice != null) p.buyingPrice = numberOrDefault(buyingPrice, p.buyingPrice || 0);
  if (stock != null) p.stock = numberOrDefault(stock, p.stock || 0);
  if (lowStockAlert != null) p.lowStockAlert = numberOrDefault(lowStockAlert, p.lowStockAlert || 5);
  if (rating != null) p.rating = numberOrDefault(rating, p.rating || 4.5);
  if (category != null) p.category = category;
  if (description != null) p.description = description;

  const newImages = normalizeFiles(req.files || []);
  if (newImages.length) {
    const oldImages = p.images?.length ? p.images : (p.imagePath ? [{ path: p.imagePath }] : []);
    oldImages.forEach((img) => safeUnlink(img.path));
    p.images = newImages;
    p.imageUrl = newImages[0].url;
    p.imagePath = newImages[0].path;
  } else if (!p.images?.length && p.imageUrl) {
    p.images = [{ url: p.imageUrl, path: p.imagePath, name: "Main image" }];
  }

  await p.save();
  res.json(p);
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });

  const images = p.images?.length ? p.images : (p.imagePath ? [{ path: p.imagePath }] : []);
  images.forEach((img) => safeUnlink(img.path));
  await p.deleteOne();
  res.json({ message: "Deleted" });
});

router.delete("/:id/image/:index", requireAuth, requireAdmin, async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });
  const index = Number(req.params.index);
  if (!p.images?.length && p.imageUrl) p.images = [{ url: p.imageUrl, path: p.imagePath, name: "Main image" }];
  if (!Number.isInteger(index) || index < 0 || index >= p.images.length) return res.status(400).json({ message: "Invalid image index" });
  const [removed] = p.images.splice(index, 1);
  safeUnlink(removed?.path);
  p.imageUrl = p.images[0]?.url || "";
  p.imagePath = p.images[0]?.path || "";
  await p.save();
  res.json(p);
});

router.delete("/:id/image", requireAuth, requireAdmin, async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: "Not found" });

  const images = p.images?.length ? p.images : (p.imagePath ? [{ path: p.imagePath }] : []);
  images.forEach((img) => safeUnlink(img.path));
  p.imageUrl = "";
  p.imagePath = "";
  p.images = [];
  await p.save();
  res.json(p);
});

export default router;
