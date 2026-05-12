import express from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  res.json(cart || { userId: req.user.id, items: [] });
});

router.post("/add", requireAuth, async (req, res) => {
  const { productId, qty = 1 } = req.body || {};
  if (!productId) return res.status(400).json({ message: "Missing productId" });

  const p = await Product.findById(productId);
  if (!p) return res.status(404).json({ message: "Product not found" });

  const q = Math.max(1, Number(qty) || 1);
  if ((p.stock || 0) <= 0) return res.status(400).json({ message: "Product is out of stock" });

  const cart = (await Cart.findOne({ userId: req.user.id })) || (await Cart.create({ userId: req.user.id, items: [] }));
  const idx = cart.items.findIndex((it) => String(it.productId) === String(productId));
  const existingQty = idx >= 0 ? cart.items[idx].qty : 0;
  if (existingQty + q > p.stock) {
    return res.status(400).json({ message: `Only ${p.stock} item(s) available in stock` });
  }

  if (idx >= 0) {
    cart.items[idx].qty += q;
    cart.items[idx].price = p.price;
    cart.items[idx].buyingPrice = p.buyingPrice || 0;
    cart.items[idx].title = p.title;
    cart.items[idx].imageUrl = p.imageUrl || "";
  } else {
    cart.items.push({ productId: p._id, title: p.title, price: p.price, buyingPrice: p.buyingPrice || 0, qty: q, imageUrl: p.imageUrl || "" });
  }

  await cart.save();
  res.json(cart);
});

router.put("/qty", requireAuth, async (req, res) => {
  const { productId, qty } = req.body || {};
  const q = Number(qty);
  if (!productId || !Number.isFinite(q)) return res.status(400).json({ message: "Missing fields" });

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.json({ userId: req.user.id, items: [] });

  const idx = cart.items.findIndex((it) => String(it.productId) === String(productId));
  if (idx < 0) return res.json(cart);

  if (q <= 0) cart.items.splice(idx, 1);
  else {
    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ message: "Product not found" });
    if (q > p.stock) return res.status(400).json({ message: `Only ${p.stock} item(s) available in stock` });
    cart.items[idx].qty = q;
    cart.items[idx].price = p.price;
    cart.items[idx].buyingPrice = p.buyingPrice || 0;
  }

  await cart.save();
  res.json(cart);
});

router.delete("/item/:productId", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.json({ userId: req.user.id, items: [] });

  cart.items = cart.items.filter((it) => String(it.productId) !== String(req.params.productId));
  await cart.save();
  res.json(cart);
});

router.delete("/clear", requireAuth, async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.json({ userId: req.user.id, items: [] });

  cart.items = [];
  await cart.save();
  res.json(cart);
});

export default router;
