import React, { useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { apiAuthGet, apiAuthJson, getUser } from "../api/http.js";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const nav = useNavigate();
  const user = getUser();
  const [cart, setCart] = useState({ items: [] });
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "" });
  const [customerMessage, setCustomerMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [msg, setMsg] = useState("");
  const [placing, setPlacing] = useState(false);

  async function load() {
    const res = await apiAuthGet("/cart");
    setCart(res || { items: [] });
  }

  useEffect(() => {
    if (!user) nav("/login");
    else {
      setCustomer({ name: user.name || "", phone: user.phone || "", email: user.email || "", address: user.address || "" });
      load();
    }
  }, []);

  const total = useMemo(() => (cart.items || []).reduce((s, it) => s + it.price * it.qty, 0), [cart]);

  async function placeOrder() {
    setMsg("");
    if (!customer.name || !customer.phone || !customer.address) {
      setMsg("Name, Phone, Address required");
      return;
    }
    if (!cart.items || cart.items.length === 0) {
      setMsg("Cart empty");
      return;
    }

    setPlacing(true);
    const res = await apiAuthJson("/orders", { customerInfo: customer, paymentMethod, customerMessage }, "POST");
    setPlacing(false);

    if (res?._id) nav("/my-orders");
    else setMsg(res?.message || "Order failed");
  }

  return (
    <div className="page">
      <TopBar title="Checkout" />
      <div className="container">
        <div className="details" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div className="h2">Customer Details</div>
            <input className="input" placeholder="Full Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            <input className="input" placeholder="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            <input className="input" placeholder="Email (optional)" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            <textarea className="input" rows="4" placeholder="Address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
            <textarea className="input" rows="4" placeholder="Message for admin / seller (optional)" value={customerMessage} onChange={(e) => setCustomerMessage(e.target.value)} />
          </div>

          <div>
            <div className="h2">Payment</div>
            <div className="panel" style={{ padding: 14 }}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Choose Payment Method</div>

              <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, fontWeight: 900 }}>
                <input type="radio" checked={paymentMethod === "COD"} onChange={() => setPaymentMethod("COD")} />
                Cash On Delivery (COD)
              </label>

              <label style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, fontWeight: 900 }}>
                <input type="radio" checked={paymentMethod === "ONLINE_DEMO"} onChange={() => setPaymentMethod("ONLINE_DEMO")} />
                Online Payment (Demo - instant paid)
              </label>

              <div style={{ borderTop: "1px solid var(--border)", marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontWeight: 950, fontSize: 18 }}>Total: ${total}</div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn btn-light" onClick={() => nav("/cart")}>Back to Cart</button>
                <button className="btn btn-blue" onClick={placeOrder} disabled={placing}>
                  {placing ? "Placing..." : "Place Order"}
                </button>
              </div>

              {msg && <div className="msg" style={{ textAlign: "left" }}>{msg}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
