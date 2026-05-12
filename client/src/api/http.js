export const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ORIGIN = API.replace(/\/api\/?$/, "");

export function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

export function apiFileUrl(path) {
  return `${API}${path}`;
}

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function setAuth({ token, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function updateStoredUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}


export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export async function apiGet(path) {
  const res = await fetch(`${API}${path}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function apiAuthJson(path, body, method = "POST") {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function apiAuthForm(path, formData, method = "POST") {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData
  });
  return res.json();
}

export async function apiAuthDelete(path) {
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

export async function apiAuthGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}


export async function apiAuthDownload(path, filename = "download.csv") {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function openInvoice(orderId) {
  const res = await fetch(`${API}/orders/${orderId}/invoice`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (!res.ok) throw new Error(await res.text());
  const html = await res.text();
  const win = window.open("", "_blank");
  if (!win) throw new Error("Popup blocked");
  win.document.open();
  win.document.write(html);
  win.document.close();
}
