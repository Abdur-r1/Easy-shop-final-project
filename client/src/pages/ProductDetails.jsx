import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";
import { apiGet, apiAuthJson, getUser, assetUrl } from "../api/http.js";

export default function ProductDetails() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const user = getUser();

  useEffect(() => { apiGet(`/products/${id}`).then(setP); }, [id]);

  const gallery = useMemo(() => {
    const imgs = p?.images?.length ? p.images.map((img) => img.url) : (p?.imageUrl ? [p.imageUrl] : []);
    return imgs.filter(Boolean);
  }, [p]);
  const imgSrc = gallery[activeImg] ? assetUrl(gallery[activeImg]) : "";
  const outOfStock = Number(p?.stock || 0) <= 0;

  async function downloadImage() {
    if (!imgSrc) return;
    const res = await fetch(imgSrc);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ext = gallery[activeImg]?.split(".").pop() || "jpg";
    a.href = url;
    a.download = `${p.title}-${activeImg + 1}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!p) {
    return <div className="page"><TopBar title="Product Details" /><div className="container">Loading...</div></div>;
  }

  return (
    <div className="page">
      <TopBar title="Product Details" />
      <div className="container">
        <div className="details">
          <div className="details-left">
            {imgSrc ? <img className="details-img" src={imgSrc} alt={p.title} /> : <div className="details-img ph">No Image</div>}
            {gallery.length > 1 && (
              <div className="thumb-row">
                {gallery.map((url, idx) => (
                  <button key={idx} className={`thumb-btn ${idx === activeImg ? "thumb-active" : ""}`} onClick={() => setActiveImg(idx)}>
                    <img src={assetUrl(url)} alt={`${p.title} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="details-right">
            <div className="h2">{p.title}</div>
            <div className="line">Price: <b>${p.price}</b></div>
            <div className="line">Stock: <b className={outOfStock ? "danger-text" : ""}>{outOfStock ? "Out of stock" : p.stock}</b></div>
            <div className="line">Rating: <b>{Number(p.rating || 4.5).toFixed(1)}</b> ⭐⭐⭐⭐</div>
            <div className="line">Description: {p.description || "—"}</div>

            <div className="line">
              Quantity:
              <input className="qty" type="number" min="1" max={p.stock || 1} value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>

            <button className="btn btn-blue" disabled={outOfStock} onClick={async () => {
              if (!user) return (window.location.href = "/login");
              setMsg("");
              const res = await apiAuthJson("/cart/add", { productId: p._id, qty: Number(qty) || 1 }, "POST");
              if (res?.message) return setMsg(res.message);
              window.location.href = "/cart";
            }}>
              {outOfStock ? "Sold Out" : "Add to Cart"}
            </button>{" "}
            <button className="btn btn-red" onClick={downloadImage}>Download Image</button>
            {msg && <div className="msg" style={{ textAlign: "left" }}>{msg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
