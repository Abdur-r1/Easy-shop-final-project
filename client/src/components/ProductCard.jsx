import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiAuthJson, getUser, assetUrl } from "../api/http.js";

export default function ProductCard({ p }) {
  const nav = useNavigate();
  const user = getUser();
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const outOfStock = Number(p.stock || 0) <= 0;

  async function addToCart() {
    if (!user) return nav("/login");
    setMsg("");
    setAdding(true);
    const res = await apiAuthJson("/cart/add", { productId: p._id, qty: 1 }, "POST");
    setAdding(false);
    if (res?.message) return setMsg(res.message);
    nav("/cart");
  }

  return (
    <div className="card">
      <div className="card-img">
        {p.imageUrl ? (
          <img src={assetUrl(p.imageUrl)} alt={p.title} />
        ) : (
          <div className="img-placeholder">No Image</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{p.title}</div>
        <div className="card-meta">
          <span>⭐ {Number(p.rating || 4.5).toFixed(1)}</span>
          <span>${p.price}</span>
        </div>
        <div className={outOfStock ? "stock-text danger" : "stock-text"}>
          {outOfStock ? "Out of stock" : `Stock: ${p.stock}`}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Link className="btn btn-light" to={`/products/${p._id}`}>
            Details
          </Link>
          <button className="btn btn-blue" onClick={addToCart} disabled={adding || outOfStock}>
            {outOfStock ? "Sold Out" : adding ? "Adding..." : "Add to Cart"}
          </button>
        </div>
        {msg && <div className="msg" style={{ textAlign: "left" }}>{msg}</div>}
      </div>
    </div>
  );
}
