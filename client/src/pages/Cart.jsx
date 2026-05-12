import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { apiAuthDelete, apiAuthGet, apiAuthJson, getUser, assetUrl } from "../api/http.js";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const nav = useNavigate();
  const user = getUser();
  const [cart, setCart] = useState({ items: [] });

  async function load() {
    const res = await apiAuthGet("/cart");
    setCart(res || { items: [] });
  }

  useEffect(() => {
    if (!user) nav("/login");
    else load();
  }, []);

  const total = useMemo(() => (cart.items || []).reduce((s, it) => s + it.price * it.qty, 0), [cart]);

  async function setQty(productId, qty) {
    const res = await apiAuthJson("/cart/qty", { productId, qty }, "PUT");
    setCart(res || { items: [] });
  }

  async function removeItem(productId) {
    const res = await apiAuthDelete(`/cart/item/${productId}`);
    setCart(res || { items: [] });
  }

  async function clearCart() {
    const res = await apiAuthDelete("/cart/clear");
    setCart(res || { items: [] });
  }

  return (
    <div className="page">
      <TopBar title="Your Cart" />
      <div className="container">
        {(!cart.items || cart.items.length === 0) ? (
          <div className="panel">
            <div className="panel-title" style={{ marginBottom: 8 }}>Cart is empty</div>
            <button className="btn btn-blue" onClick={() => nav("/products")}>Go Shopping</button>
          </div>
        ) : (
          <div className="panel">
            <div className="panel-title" style={{ textAlign: "left" }}>Cart Items</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {cart.items.map((it) => (
                <div className="admin-row" key={it.productId}>
                  <div className="admin-thumb">
                    {it.imageUrl ? (
                      <img src={assetUrl(it.imageUrl)} alt={it.title} />
                    ) : (
                      <div className="img-placeholder small">No</div>
                    )}
                  </div>

                  <div className="admin-info">
                    <div className="admin-title">{it.title}</div>
                    <div className="admin-sub">${it.price} × {it.qty} = ${it.price * it.qty}</div>
                    <div className="admin-bar"></div>
                  </div>

                  <div className="admin-actions">
                    <button className="btn btn-light" onClick={() => setQty(it.productId, it.qty - 1)}>-</button>
                    <button className="btn btn-light" onClick={() => setQty(it.productId, it.qty + 1)}>+</button>
                    <button className="btn btn-red" onClick={() => removeItem(it.productId)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 950, fontSize: 18 }}>Total: ${total}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-light" onClick={clearCart}>Clear</button>
                <button className="btn btn-blue" onClick={() => nav("/checkout")}>Checkout</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
