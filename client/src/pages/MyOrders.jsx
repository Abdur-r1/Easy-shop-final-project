import React, { useEffect, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { apiAuthGet, getUser, openInvoice } from "../api/http.js";
import { useNavigate } from "react-router-dom";

export default function MyOrders() {
  const nav = useNavigate();
  const user = getUser();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return nav("/login");
    apiAuthGet("/orders/my").then((res) => setOrders(res || []));
  }, []);

  return (
    <div className="page">
      <TopBar title="My Orders" />
      <div className="container">
        {orders.length === 0 ? (
          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 8 }}>No orders yet</div>
            <button className="btn btn-blue" onClick={() => nav("/products")}>Shop Now</button>
          </div>
        ) : (
          <div className="admin-list">
            {orders.map((o) => (
              <div className="panel" key={o._id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 950 }}>Order: {o._id}</div>
                  <div style={{ fontWeight: 900, color: "var(--muted)" }}>{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ marginTop: 10, fontWeight: 900 }}>
                  Total: ${o.totalAmount} • Payment: {o.paymentMethod} • Payment Status: {o.paymentStatus}
                </div>
                <div className="status-line">Order Status: <span>{o.orderStatus || "pending"}</span></div>
                {o.customerMessage && <div className="customer-message">Your message: {o.customerMessage}</div>}
                <button className="btn btn-light" style={{ marginTop: 10 }} onClick={() => openInvoice(o._id)}>Invoice / Save PDF</button>
                <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <div style={{ fontWeight: 950, marginBottom: 8 }}>Items</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {o.items.map((it, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, flexWrap: "wrap", gap: 10 }}>
                        <span>{it.title} × {it.qty}</span>
                        <span>${it.price * it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
