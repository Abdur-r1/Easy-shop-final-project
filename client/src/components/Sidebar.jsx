import React from "react";

export default function Sidebar({ active, setActive }) {
  return (
    <div className="sidebar">
      <div className={`side-item ${active === "" ? "active" : ""}`} onClick={() => setActive("")}>
        ⭐ All Products
      </div>
      <div className={`side-item ${active === "men" ? "active" : ""}`} onClick={() => setActive("men")}>
        👔 Men
      </div>
      <div className={`side-item ${active === "women" ? "active" : ""}`} onClick={() => setActive("women")}>
        👗 Women
      </div>
      <div className={`side-item ${active === "kids" ? "active" : ""}`} onClick={() => setActive("kids")}>
        🧸 Kids
      </div>
    </div>
  );
}
