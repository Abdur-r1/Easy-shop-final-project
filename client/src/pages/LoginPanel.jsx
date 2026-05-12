import React, { useState } from "react";
import TopBar from "../components/TopBar.jsx";
import { apiPost, setAuth } from "../api/http.js";
import { useNavigate } from "react-router-dom";

function LoginBox({ theme = "red", title }) {
  const nav = useNavigate();
  const isAdmin = title.toLowerCase().includes("admin");
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState("");

  async function submit() {
    setMsg("");
    const path = mode === "login" ? "/auth/login" : "/auth/register";
    const payload = mode === "login" ? { email: form.email, password: form.password } : { name: form.name || "User", email: form.email, password: form.password };
    const res = await apiPost(path, payload);
    if (res?.token) {
      if (isAdmin && res.user.role !== "admin") return setMsg("This is not an admin account. Please use customer login.");
      setAuth({ token: res.token, user: res.user });
      nav(res.user.role === "admin" ? "/admin" : "/products");
    } else setMsg(res?.message || "Error");
  }

  return (
    <div className={`panel panel-${theme}`}>
      <div className="panel-title">{title}</div>
      {isAdmin && <div className="msg" style={{ marginTop: 0, marginBottom: 12 }}>Admin account backend seed route দিয়ে তৈরি করুন। Customer register থেকে admin হবে না।</div>}
      {!isAdmin && mode === "register" && <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
      <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <div className="row">
        <button className={`btn ${theme === "red" ? "btn-red" : "btn-blue"}`} style={{ minWidth: 120 }} onClick={submit}>{mode === "login" ? "Login" : "Register"}</button>
        {!isAdmin && <button className="btn btn-light" style={{ minWidth: 120 }} onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Register" : "Login"}</button>}
      </div>
      {msg && <div className="msg">{msg}</div>}
    </div>
  );
}

export default function LoginPanel() {
  return (
    <div className="page">
      <TopBar title="Admin & Customer Panel" />
      <div className="login-wrap">
        <LoginBox theme="red" title="Admin Login" />
        <LoginBox theme="blue" title="Customer Login" />
      </div>
    </div>
  );
}
