import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar.jsx";
import { apiAuthGet, apiAuthJson, getUser, updateStoredUser } from "../api/http.js";

export default function Profile() {
  const nav = useNavigate();
  const user = getUser();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return nav("/login");
    apiAuthGet("/auth/profile").then((res) => {
      if (res?.email) setForm(res);
    });
  }, []);

  async function save() {
    setMsg("");
    const res = await apiAuthJson("/auth/profile", { name: form.name, phone: form.phone, address: form.address }, "PUT");
    if (res?.email) {
      updateStoredUser(res);
      setForm(res);
      setMsg("Profile updated successfully.");
    } else setMsg(res?.message || "Update failed");
  }

  return (
    <div className="page">
      <TopBar title="My Profile" />
      <div className="container">
        <div className="panel profile-panel">
          <div className="panel-title" style={{ textAlign: "left" }}>Customer Profile</div>
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Email" value={form.email} disabled />
          <input className="input" placeholder="Phone" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea className="input" rows="4" placeholder="Address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <button className="btn btn-blue" onClick={save}>Save Profile</button>
          {msg && <div className="msg" style={{ textAlign: "left" }}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}
