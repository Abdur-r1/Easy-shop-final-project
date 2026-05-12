import express from "express";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function canAccessOrder(order, user) {
  return user.role === "admin" || String(order.userId) === String(user.id);
}

router.post("/", requireAuth, async (req, res) => {
  const { customerInfo, paymentMethod, customerMessage } = req.body || {};
  if (!customerInfo?.name || !customerInfo?.phone || !customerInfo?.address) {
    return res.status(400).json({ message: "Customer info missing" });
  }
  if (!["COD", "ONLINE_DEMO"].includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  const orderItems = [];
  for (const item of cart.items) {
    const product = await Product.findById(item.productId);
    if (!product) return res.status(404).json({ message: `${item.title} not found` });
    if ((product.stock || 0) < item.qty) {
      return res.status(400).json({ message: `${product.title} stock only ${product.stock}` });
    }
    orderItems.push({
      productId: product._id,
      title: product.title,
      price: product.price,
      buyingPrice: product.buyingPrice || 0,
      qty: item.qty,
      imageUrl: product.imageUrl || ""
    });
  }

  const totalAmount = orderItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const totalCost = orderItems.reduce((sum, it) => sum + (it.buyingPrice || 0) * it.qty, 0);
  const profit = totalAmount - totalCost;
  const paymentStatus = paymentMethod === "COD" ? "cod" : "paid";

  const order = await Order.create({
    userId: req.user.id,
    customerInfo: {
      name: customerInfo.name,
      phone: customerInfo.phone,
      email: customerInfo.email || req.user.email || "",
      address: customerInfo.address
    },
    customerMessage: customerMessage || "",
    items: orderItems,
    totalAmount,
    totalCost,
    profit,
    paymentMethod,
    paymentStatus,
    orderStatus: "pending"
  });

  await User.updateOne(
    { _id: req.user.id },
    { $set: { name: customerInfo.name, phone: customerInfo.phone, address: customerInfo.address } }
  );

  for (const item of orderItems) {
    await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.qty } });
  }

  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

router.get("/my", requireAuth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.query;
  const q = status && statuses.includes(status) ? { orderStatus: status } : {};
  const orders = await Order.find(q).sort({ createdAt: -1 });
  res.json(orders);
});

router.put("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { orderStatus, paymentStatus } = req.body || {};
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (orderStatus != null) {
    if (!statuses.includes(orderStatus)) return res.status(400).json({ message: "Invalid order status" });
    order.orderStatus = orderStatus;
  }
  if (paymentStatus != null) {
    if (!["pending", "paid", "cod", "failed"].includes(paymentStatus)) return res.status(400).json({ message: "Invalid payment status" });
    order.paymentStatus = paymentStatus;
  }
  await order.save();
  res.json(order);
});

router.get("/:id/invoice", requireAuth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).send("Order not found");
  if (!canAccessOrder(order, req.user)) return res.status(403).send("Forbidden");

  const rows = order.items.map((it) => `
    <tr>
      <td>${escapeHtml(it.title)}</td>
      <td>${it.qty}</td>
      <td>$${Number(it.price || 0).toFixed(2)}</td>
      <td>$${Number((it.price || 0) * (it.qty || 0)).toFixed(2)}</td>
    </tr>`).join("");

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>Invoice ${order._id}</title>
    <style>
      body{font-family:Arial,sans-serif;margin:32px;color:#111} .top{display:flex;justify-content:space-between;gap:20px}
      h1{margin:0 0 6px}.muted{color:#555}.box{border:1px solid #ddd;border-radius:10px;padding:14px;margin:16px 0}
      table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left} th{background:#f3f3f3}
      .total{text-align:right;font-size:20px;font-weight:700;margin-top:18px}.print{margin-top:20px;padding:10px 16px;border:0;background:#111;color:white;border-radius:8px;cursor:pointer}
      @media print{.print{display:none} body{margin:12px}}
    </style></head><body>
      <div class="top"><div><h1>Easy Shop Invoice</h1><div class="muted">Order ID: ${escapeHtml(order._id)}</div></div><div class="muted">${new Date(order.createdAt).toLocaleString()}</div></div>
      <div class="box"><b>Customer</b><br/>${escapeHtml(order.customerInfo?.name)}<br/>${escapeHtml(order.customerInfo?.phone)}<br/>${escapeHtml(order.customerInfo?.email)}<br/>${escapeHtml(order.customerInfo?.address)}</div>
      <div class="box"><b>Order Status:</b> ${escapeHtml(order.orderStatus)} &nbsp; <b>Payment:</b> ${escapeHtml(order.paymentStatus)} (${escapeHtml(order.paymentMethod)})</div>
      <table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="total">Grand Total: $${Number(order.totalAmount || 0).toFixed(2)}</div>
      ${order.customerMessage ? `<div class="box"><b>Customer Message:</b><br/>${escapeHtml(order.customerMessage)}</div>` : ""}
      <button class="print" onclick="window.print()">Print / Save as PDF</button>
    </body></html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;
