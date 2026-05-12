import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { apiGet, apiAuthForm, apiAuthDelete, apiAuthJson, apiAuthGet, apiAuthDownload, openInvoice, assetUrl } from "../api/http.js";

const emptyForm = {
  title: "",
  price: "",
  buyingPrice: "",
  stock: "",
  lowStockAlert: "5",
  category: "women",
  rating: "4.5",
  description: ""
};

const orderStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
const paymentStatuses = ["pending", "paid", "cod", "failed"];

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({
    daily: { total: 0, cost: 0, profit: 0, count: 0 },
    monthly: { total: 0, cost: 0, profit: 0, count: 0 },
    yearly: { total: 0, cost: 0, profit: 0, count: 0 },
    lowStockCount: 0,
    productCount: 0,
    customerCount: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });

  const [tab, setTab] = useState("dashboard");
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [images, setImages] = useState([]);
  const [msg, setMsg] = useState("");
  const [orderFilter, setOrderFilter] = useState("");

  async function refreshProducts() {
    const res = await apiGet("/products?sort=stock_low");
    setProducts(res || []);
  }
  async function refreshOrders(status = orderFilter) {
    const res = await apiAuthGet(`/orders${status ? `?status=${status}` : ""}`);
    setOrders(res || []);
  }
  async function refreshSummary() {
    const res = await apiAuthGet("/reports/summary");
    setSummary(res || summary);
  }
  async function refreshAll() {
    await Promise.all([refreshProducts(), refreshOrders(), refreshSummary()]);
  }

  useEffect(() => { refreshAll(); }, []);
  useEffect(() => { refreshOrders(orderFilter); }, [orderFilter]);

  function resetForm() {
    setForm(emptyForm);
    setImages([]);
    setEditId(null);
    setMsg("");
  }

  async function saveProduct() {
    setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    images.forEach((file) => fd.append("images", file));

    const url = editId ? `/products/${editId}` : "/products";
    const method = editId ? "PUT" : "POST";
    const res = await apiAuthForm(url, fd, method);
    if (res?._id) {
      resetForm();
      setTab("manageProducts");
      await refreshAll();
    } else setMsg(res?.message || "Error");
  }

  async function delProduct(id) {
    if (!confirm("Delete this product?")) return;
    await apiAuthDelete(`/products/${id}`);
    await refreshAll();
  }

  async function delImage(id, index = null) {
    await apiAuthDelete(index == null ? `/products/${id}/image` : `/products/${id}/image/${index}`);
    await refreshProducts();
  }

  function startEdit(p) {
    setEditId(p._id);
    setForm({
      title: p.title || "",
      price: String(p.price ?? ""),
      buyingPrice: String(p.buyingPrice ?? ""),
      stock: String(p.stock ?? ""),
      lowStockAlert: String(p.lowStockAlert ?? 5),
      category: p.category || "women",
      rating: String(p.rating ?? 4.5),
      description: p.description || ""
    });
    setImages([]);
    setMsg("");
    setTab("editProduct");
  }

  const lowStockProducts = useMemo(() => products.filter((p) => Number(p.stock || 0) <= Number(p.lowStockAlert ?? 5)), [products]);
  const orderTotal = useMemo(() => orders.reduce((s, o) => s + (o.totalAmount || 0), 0), [orders]);
  const orderProfit = useMemo(() => orders.reduce((s, o) => s + (o.profit || 0), 0), [orders]);

  async function downloadCsv(type) {
    try { await apiAuthDownload(`/reports/export?type=${type}`, `sales-${type}.csv`); }
    catch (e) { alert("Report download failed. Please login as admin again."); }
  }

  async function updateOrder(order, patch) {
    const res = await apiAuthJson(`/orders/${order._id}/status`, patch, "PUT");
    if (res?._id) {
      await refreshOrders();
      await refreshSummary();
    } else alert(res?.message || "Update failed");
  }

  function money(n) { return `$${Number(n || 0).toFixed(2)}`; }

  const ProductForm = ({ mode }) => (
    <div className="panel panel-blue admin-form">
      <div className="panel-title">{mode === "edit" ? "Edit Product" : "Add Product"}</div>
      <input className="input" placeholder="Product Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <div className="form-grid-2">
        <input className="input" type="number" placeholder="Customer Sell Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input className="input" type="number" placeholder="Admin Buying Price" value={form.buyingPrice} onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })} />
      </div>
      <div className="form-grid-2">
        <input className="input" type="number" placeholder="Stock Quantity" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <input className="input" type="number" placeholder="Low Stock Alarm Qty" value={form.lowStockAlert} onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })} />
      </div>
      <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
        <option value="men">Men</option><option value="women">Women</option><option value="kids">Kids</option>
      </select>
      <input className="input" placeholder="Rating (ex: 4.5)" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
      <textarea className="input" rows="4" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input className="input" type="file" multiple accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={(e) => setImages(Array.from(e.target.files || []))} />
      <div style={{ fontWeight: 900, color: "var(--muted)", marginBottom: 10 }}>একসাথে সর্বোচ্চ ৫টি JPG/JPEG/PNG image upload করা যাবে। Edit করলে নতুন image দিলে পুরোনো collection replace হবে।</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-blue" onClick={saveProduct}>{mode === "edit" ? "Update Product" : "Save Product"}</button>
        {mode === "edit" && <button className="btn btn-light" onClick={() => { resetForm(); setTab("manageProducts"); }}>Cancel</button>}
      </div>
      {msg && <div className="msg">{msg}</div>}
    </div>
  );

  return (
    <div className="page">
      <TopBar title="Admin Dashboard" />
      <div className="container">
        <div className="tabs admin-tabs">
          <button className={`tab ${tab === "dashboard" ? "tab-active" : ""}`} onClick={() => setTab("dashboard")}>🏠 Dashboard</button>
          <button className={`tab ${tab === "addProduct" ? "tab-active" : ""}`} onClick={() => { resetForm(); setTab("addProduct"); }}>➕ Add Product</button>
          <button className={`tab ${tab === "manageProducts" ? "tab-active" : ""}`} onClick={() => setTab("manageProducts")}>🧰 Manage Products</button>
          <button className={`tab ${tab === "orders" ? "tab-active" : ""}`} onClick={() => setTab("orders")}>🧾 Orders & Messages</button>
          <button className={`tab ${tab === "reports" ? "tab-active" : ""}`} onClick={() => setTab("reports")}>📊 Sales Report</button>
        </div>

        {tab === "dashboard" && (
          <>
            <div className="stat-grid">
              <div className="stat-card"><span>Today's Sales</span><b>{money(summary.daily.total)}</b><small>{summary.daily.count} order(s)</small></div>
              <div className="stat-card"><span>Monthly Profit</span><b>{money(summary.monthly.profit)}</b><small>Cost: {money(summary.monthly.cost)}</small></div>
              <div className="stat-card"><span>Products</span><b>{summary.productCount || products.length}</b><small>{summary.lowStockCount || lowStockProducts.length} low stock</small></div>
              <div className="stat-card"><span>Customers</span><b>{summary.customerCount || 0}</b><small>{summary.pendingOrders || 0} active orders</small></div>
            </div>
            {lowStockProducts.length > 0 && (
              <div className="panel stock-alert">
                <div className="panel-title" style={{ textAlign: "left" }}>⚠️ Stock Alarm</div>
                <div style={{ fontWeight: 900 }}>Low/empty stock: {lowStockProducts.length} product(s)</div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {lowStockProducts.slice(0, 12).map((p) => <span key={p._id} className="stock-pill">{p.title}: {p.stock}</span>)}
                </div>
              </div>
            )}
          </>
        )}

        {tab === "addProduct" && <ProductForm mode="add" />}
        {tab === "editProduct" && <ProductForm mode="edit" />}

        {tab === "manageProducts" && (
          <div className="admin-list">
            {products.map((p) => {
              const profit = Number(p.price || 0) - Number(p.buyingPrice || 0);
              const low = Number(p.stock || 0) <= Number(p.lowStockAlert ?? 5);
              const imgs = p.images?.length ? p.images : (p.imageUrl ? [{ url: p.imageUrl }] : []);
              return (
                <div className={`admin-row ${low ? "row-low-stock" : ""}`} key={p._id}>
                  <div className="admin-thumb">{p.imageUrl ? <img src={assetUrl(p.imageUrl)} alt={p.title} /> : <div className="img-placeholder small">No</div>}</div>
                  <div className="admin-info">
                    <div className="admin-title">{p.title} {low && <span className="stock-badge">Low Stock</span>}</div>
                    <div className="admin-sub">Sell: {money(p.price)} • Buy: {money(p.buyingPrice)} • Profit/item: {money(profit)}</div>
                    <div className="admin-sub">Stock: {p.stock || 0} • Alarm at: {p.lowStockAlert ?? 5} • {p.category} • ⭐ {Number(p.rating || 4.5).toFixed(1)}</div>
                    {imgs.length > 0 && <div className="mini-images">{imgs.map((img, idx) => <span key={idx}>Image {idx + 1} <button onClick={() => delImage(p._id, idx)}>×</button></span>)}</div>}
                  </div>
                  <div className="admin-actions">
                    <button className="btn btn-green" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn btn-red" onClick={() => delProduct(p._id)}>Delete</button>
                    <button className="btn btn-light" onClick={() => delImage(p._id)}>Delete All Images</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "orders" && (
          <div className="panel">
            <div className="panel-title" style={{ textAlign: "left" }}>All Orders & Customer Messages</div>
            <div className="order-toolbar">
              <div style={{ fontWeight: 900, color: "var(--muted)" }}>Orders: {orders.length} • Sales: {money(orderTotal)} • Profit: {money(orderProfit)}</div>
              <select className="input no-margin status-select" value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                <option value="">All status</option>{orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {orders.map((o) => (
                <div key={o._id} className="panel" style={{ boxShadow: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontWeight: 950 }}>Order: {o._id}</div>
                    <div style={{ fontWeight: 900, color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ marginTop: 8, fontWeight: 900 }}>Customer: {o.customerInfo?.name} • {o.customerInfo?.phone} • {o.customerInfo?.email || "No email"}</div>
                  <div style={{ marginTop: 6, fontWeight: 900, color: "var(--muted)" }}>Address: {o.customerInfo?.address}</div>
                  {o.customerMessage && <div className="customer-message">💬 Customer Message: {o.customerMessage}</div>}
                  <div style={{ marginTop: 8, fontWeight: 900 }}>Total: {money(o.totalAmount)} • Cost: {money(o.totalCost)} • Profit: {money(o.profit)} • Payment: {o.paymentMethod}</div>
                  <div className="order-controls">
                    <label>Order Status <select className="input no-margin" value={o.orderStatus || "pending"} onChange={(e) => updateOrder(o, { orderStatus: e.target.value })}>{orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                    <label>Payment <select className="input no-margin" value={o.paymentStatus || "pending"} onChange={(e) => updateOrder(o, { paymentStatus: e.target.value })}>{paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>
                    <button className="btn btn-light" onClick={() => openInvoice(o._id)}>Invoice / PDF</button>
                  </div>
                  <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                    <div style={{ fontWeight: 950, marginBottom: 6 }}>Items</div>
                    {o.items.map((it, idx) => <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, flexWrap: "wrap", gap: 10 }}><span>{it.title} × {it.qty}</span><span>{money(it.price * it.qty)}</span></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div className="panel">
            <div className="panel-title" style={{ textAlign: "left" }}>Sales Report Download</div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              {["daily", "monthly", "yearly"].map((type) => (
                <div className="card" key={type}><div className="card-body">
                  <div className="card-title">{type[0].toUpperCase() + type.slice(1)}</div>
                  <div className="card-meta"><span>Orders</span><span>{summary[type]?.count || 0}</span></div>
                  <div style={{ fontWeight: 950, fontSize: 18 }}>Sales: {money(summary[type]?.total)}</div>
                  <div style={{ fontWeight: 900 }}>Cost: {money(summary[type]?.cost)}</div>
                  <div style={{ fontWeight: 950, color: "var(--green)", marginBottom: 10 }}>Profit: {money(summary[type]?.profit)}</div>
                  <button className="btn btn-light w-100" onClick={() => downloadCsv(type)}>Download Report CSV</button>
                </div></div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn btn-blue" onClick={refreshAll}>Refresh</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
