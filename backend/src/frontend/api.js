/**
 * FILE: src/services/api.js
 *
 * Central API client for QueueLess backend.
 * All HTTP calls go through this file — no fetch() in components.
 *
 * Usage:
 *   import api from "./services/api";
 *   const { user, token } = await api.auth.login({ email, password, role });
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Token storage ─────────────────────────────────────────────────────────────
export const tokenStore = {
  get:    ()    => localStorage.getItem("queueless_token"),
  set:    (t)   => localStorage.setItem("queueless_token", t),
  remove: ()    => localStorage.removeItem("queueless_token"),
};

// ── Base fetch wrapper ────────────────────────────────────────────────────────
async function request(method, path, body = null, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    throw err;
  }

  return data;
}

const get    = (path, auth)        => request("GET",    path, null, auth);
const post   = (path, body, auth)  => request("POST",   path, body, auth);
const patch  = (path, body)        => request("PATCH",  path, body);
const del    = (path)              => request("DELETE", path);

// ── API namespaces ────────────────────────────────────────────────────────────
const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register: (data)  => post("/auth/register", data, false),
    login:    (data)  => post("/auth/login",    data, false),
    me:       ()      => get("/auth/me"),
    updateMe: (data)  => patch("/auth/me", data),
  },

  // ── Shops ─────────────────────────────────────────────────────────────────
  shops: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return get(`/shops${qs ? "?" + qs : ""}`);
    },
    get:    (id)    => get(`/shops/${id}`),
    my:     ()      => get("/shops/my"),
    create: (data)  => post("/shops", data),
    update: (id, data) => patch(`/shops/${id}`, data),
    delete: (id)    => del(`/shops/${id}`),
  },

  // ── Queue ─────────────────────────────────────────────────────────────────
  queue: {
    get:        (shopId)        => get(`/queue/${shopId}`),
    myActive:   ()              => get("/queue/my"),
    join:       (shopId)        => post(`/queue/${shopId}/join`),
    callNext:   (shopId)        => post(`/queue/${shopId}/next`),
    markDone:   (entryId)       => patch(`/queue/entry/${entryId}/done`),
    cancel:     (entryId)       => patch(`/queue/entry/${entryId}/cancel`),
    remove:     (entryId)       => del(`/queue/entry/${entryId}`),
    pause:      (shopId)        => post(`/queue/${shopId}/pause`),
    verify:     (shopId, token) => post("/queue/verify", { shopId, token }),
    analytics:  (shopId)        => get(`/queue/${shopId}/analytics`),
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: {
    list:       ()    => get("/notifications"),
    markRead:   (id)  => patch(`/notifications/${id}/read`),
    markAllRead: ()   => patch("/notifications/read-all"),
  },
};

export default api;
