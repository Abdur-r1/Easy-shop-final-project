import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { apiGet } from "../api/http.js";

export default function Products() {
  const [category, setCategory] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [stock, setStock] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search.trim()) params.set("search", search.trim());
    if (sort !== "newest") params.set("sort", sort);
    if (stock) params.set("stock", stock);
    const q = params.toString() ? `?${params.toString()}` : "";
    const res = await apiGet(`/products${q}`);
    setItems(Array.isArray(res) ? res : []);
  }

  useEffect(() => { load(); }, [category, sort, stock]);
  useEffect(() => {
    const timer = setTimeout(load, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const title = useMemo(() => {
    if (!category) return "All Products";
    return `${category[0].toUpperCase()}${category.slice(1)} Products`;
  }, [category]);

  return (
    <div className="page">
      <TopBar title="Product Dashboard" />
      <div className="dash">
        <Sidebar active={category} setActive={setCategory} />
        <div className="dash-main">
          <div className="tabs">
            <button className={`tab ${category === "" ? "tab-active" : ""}`} onClick={() => setCategory("")}>Products</button>
            <button className={`tab ${category === "women" ? "tab-active" : ""}`} onClick={() => setCategory("women")}>Women's Products</button>
            <button className={`tab ${category === "men" ? "tab-active" : ""}`} onClick={() => setCategory("men")}>Men Products</button>
            <button className={`tab ${category === "kids" ? "tab-active" : ""}`} onClick={() => setCategory("kids")}>Kids' Products</button>
          </div>

          <div className="panel search-panel">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div className="panel-title" style={{ textAlign: "left", marginBottom: 2 }}>{title}</div>
                <div style={{ color: "var(--muted)", fontWeight: 900 }}>{items.length} product(s) found</div>
              </div>
              <div className="filter-grid">
                <input className="input no-margin" placeholder="Search product..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="input no-margin" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="newest">Newest first</option>
                  <option value="price_low">Price low to high</option>
                  <option value="price_high">Price high to low</option>
                  <option value="rating">Best rating</option>
                  <option value="stock_low">Low stock first</option>
                </select>
                <select className="input no-margin" value={stock} onChange={(e) => setStock(e.target.value)}>
                  <option value="">All stock</option>
                  <option value="available">Available only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid">
            {items?.map((p) => <ProductCard key={p._id} p={p} />)}
          </div>
          {!items.length && <div className="panel" style={{ textAlign: "center", fontWeight: 950 }}>No product found.</div>}
        </div>
      </div>
    </div>
  );
}
