import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../api/http.js";

export default function TopBar({ title = "WELCOME TO OUR EASY SHOP" }) {
  const nav = useNavigate();
  const user = getUser();

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="topbar-title">{title}</div>
        <div className="topbar-actions">
          <Link className="btn btn-light" to="/">Home</Link>
          <Link className="btn btn-light" to="/products">Shop</Link>
          <Link className="btn btn-light" to="/cart">Cart</Link>
          {user && <Link className="btn btn-light" to="/profile">Profile</Link>}
          {user && <Link className="btn btn-light" to="/my-orders">My Orders</Link>}
          {user?.role === "admin" && <Link className="btn btn-light" to="/admin">Admin</Link>}

          {!user ? (
            <Link className="btn btn-accent" to="/login">Login</Link>
          ) : (
            <button
              className="btn btn-accent"
              onClick={() => {
                clearAuth();
                nav("/");
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
