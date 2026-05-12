import express from "express";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

function startOfToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }
function startOfYear() { const d = new Date(); d.setMonth(0,1); d.setHours(0,0,0,0); return d; }

async function stats(from, now) {
  const orders = await Order.find({ createdAt: { $gte: from, $lte: now } });
  const total = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cost = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const profit = orders.reduce((sum, o) => sum + (o.profit ?? ((o.totalAmount || 0) - (o.totalCost || 0))), 0);
  return { total, cost, profit, count: orders.length };
}

router.get("/summary", requireAuth, requireAdmin, async (req, res) => {
  const now = new Date();
  const [daily, monthly, yearly, lowStockCount, productCount, customerCount, pendingOrders, deliveredOrders] = await Promise.all([
    stats(startOfToday(), now),
    stats(startOfMonth(), now),
    stats(startOfYear(), now),
    Product.countDocuments({ $expr: { $lte: ["$stock", "$lowStockAlert"] } }),
    Product.countDocuments(),
    User.countDocuments({ role: "customer" }),
    Order.countDocuments({ orderStatus: { $in: ["pending", "processing"] } }),
    Order.countDocuments({ orderStatus: "delivered" })
  ]);
  res.json({ daily, monthly, yearly, lowStockCount, productCount, customerCount, pendingOrders, deliveredOrders });
});

router.get("/export", requireAuth, requireAdmin, async (req, res) => {
  const type = String(req.query.type || "daily");
  const now = new Date();
  let from = startOfToday();
  if (type === "monthly") from = startOfMonth();
  if (type === "yearly") from = startOfYear();

  const orders = await Order.find({ createdAt: { $gte: from, $lte: now } }).sort({ createdAt: -1 });

  const header = ["Date","OrderId","Customer","Phone","Email","Address","CustomerMessage","OrderStatus","Total","Cost","Profit","PaymentMethod","PaymentStatus"].join(",");
  const safe = (s) => `"${String(s ?? "").replaceAll('"','""')}"`;
  const rows = orders.map(o => {
    const date = o.createdAt.toISOString().slice(0,10);
    return [
      date,
      safe(o._id),
      safe(o.customerInfo?.name),
      safe(o.customerInfo?.phone),
      safe(o.customerInfo?.email),
      safe(o.customerInfo?.address),
      safe(o.customerMessage),
      safe(o.orderStatus),
      o.totalAmount || 0,
      o.totalCost || 0,
      o.profit || 0,
      safe(o.paymentMethod),
      safe(o.paymentStatus)
    ].join(",");
  });

  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="sales-${type}.csv"`);
  res.send(csv);
});

export default router;
