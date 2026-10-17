/**
 * FILE: src/pages/AdminDashboard.jsx
 * DESIGN: Gen-Z Luminous White Gradient Merchant & Queue Control Panel
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import api from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  /* NAV */
  .ad-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding: 0 2rem; height: 70px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  }
  .ad-brand {
    display: flex; align-items: center; gap: 12px; font-weight: 300; font-size: 1.3rem; letter-spacing: 3.5px;
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(135deg, #0f172a, #475569);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ad-brand-icon {
    width: 36px; height: 36px; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
  }
  .ad-nav-r { display: flex; align-items: center; gap: 12px; }
  .live-pill {
    display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #059669; font-weight: 800;
    background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 30px; padding: 6px 14px; text-transform: uppercase; letter-spacing: 1px;
  }
  .live-d { width: 7px; height: 7px; border-radius: 50%; background: #059669; animation: pulseGlow 1.8s infinite; }
  .ad-shop-tag {
    font-size: 0.82rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1);
    padding: 6px 16px; border-radius: 30px; border: 1px solid rgba(124, 58, 237, 0.25);
    font-weight: 800; font-family: 'Outfit', sans-serif;
  }
  .ad-avatar {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex; align-items: center; justify-content: center; color: #fff;
    font-size: 0.85rem; font-weight: 900; cursor: pointer;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); font-family: 'Outfit', sans-serif;
  }
  .ad-navbtn {
    padding: 8px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 20px; font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800;
    color: #dc2626; cursor: pointer; transition: all 0.25s ease;
  }
  .ad-navbtn:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); transform: translateY(-1px); }

  /* SHELL */
  .ad-shell { display: grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 70px); }

  /* SIDEBAR */
  .ad-side {
    background: rgba(255, 255, 255, 0.7); border-right: 1px solid rgba(226, 232, 240, 0.8);
    padding: 1.5rem 0; display: flex; flex-direction: column; backdrop-filter: blur(16px);
  }
  .ad-s-user { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; margin-bottom: 16px; }
  .ad-s-uname { color: #0f172a; font-weight: 900; font-size: 1rem; font-family: 'Outfit', sans-serif; }
  .ad-s-urole { font-size: 0.78rem; color: #64748b; margin-top: 2px; font-weight: 600; }
  .ad-s-lbl {
    font-size: 0.72rem; font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.12em; padding: 12px 20px 6px; display: block;
  }
  .ad-s-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 20px; cursor: pointer;
    color: #475569; font-size: 0.92rem; font-weight: 700; font-family: 'Outfit', sans-serif;
    transition: all 0.25s ease; border-left: 3px solid transparent;
  }
  .ad-s-item:hover { color: #0f172a; background: rgba(255, 255, 255, 0.9); transform: translateX(3px); }
  .ad-s-item.on {
    color: #0284c7; border-left-color: #0284c7;
    background: #ffffff; box-shadow: 0 4px 16px rgba(2, 132, 199, 0.1);
  }
  .ad-qstatus {
    margin: auto 1.25rem 1.25rem; background: #ffffff;
    border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }
  .ad-qslbl { font-size: 0.7rem; color: #0284c7; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .ad-qsval { color: #0f172a; font-weight: 900; font-size: 1rem; margin-bottom: 4px; font-family: 'Outfit', sans-serif; }
  .ad-qssub { color: #64748b; font-size: 0.8rem; font-weight: 600; }

  /* MAIN */
  .ad-main { padding: 2.25rem; overflow-y: auto; position: relative; z-index: 2; }
  .pg-title {
    font-size: 1.7rem; font-weight: 900; margin-bottom: 6px; font-family: 'Outfit', sans-serif;
    color: #0f172a;
  }
  .pg-sub { color: #64748b; font-size: 0.95rem; margin-bottom: 2rem; font-weight: 600; }
  .pg-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }

  /* KPI CARDS */
  .ad-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 2rem; }
  .ad-kpi {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 20px; padding: 1.4rem; transition: all 0.3s ease; cursor: default;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .ad-kpi:hover { border-color: rgba(124, 58, 237, 0.4); transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
  .ad-kpi-h { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .ad-kpi-lbl { font-size: 0.78rem; color: #64748b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
  .ad-kpi-ico { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
  .ad-kpi-val { font-size: 1.9rem; font-weight: 900; font-family: 'Outfit', sans-serif; }

  /* CONTROL BAR */
  .ad-ctrl {
    display: flex; gap: 12px; align-items: center;
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px;
    padding: 16px 20px; margin-bottom: 2rem; flex-wrap: wrap;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .ad-btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px; border-radius: 30px;
    font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 800; cursor: pointer;
    transition: all 0.25s ease; border: none; outline: none;
  }
  .ad-btn.accent {
    background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35);
  }
  .ad-btn.accent:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 28px rgba(219, 39, 119, 0.45); }
  .ad-btn.outline { border: 1px solid #e2e8f0; color: #0f172a; background: #ffffff; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04); }
  .ad-btn.outline:hover { background: #f8fafc; transform: translateY(-1px); }
  .ad-btn.warn { border: 1px solid rgba(245, 158, 11, 0.35); color: #d97706; background: rgba(245, 158, 11, 0.12); }
  .ad-btn.warn:hover { background: rgba(245, 158, 11, 0.2); transform: translateY(-1px); }
  .ad-btn.purple {
    background: linear-gradient(135deg, #0284c7, #2563eb); color: #fff;
    box-shadow: 0 4px 20px rgba(2, 132, 199, 0.35);
  }
  .ad-btn.purple:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 28px rgba(2, 132, 199, 0.45); }
  .ad-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

  .sec-row { display: flex; align-items: center; justify-content: space-between; font-size: 1.2rem; font-weight: 900; margin-bottom: 1.2rem; color: #0f172a; font-family: 'Outfit', sans-serif; }

  /* TABLE */
  .ad-twrap { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04); }
  .ad-table { width: 100%; border-collapse: collapse; }
  .ad-table th {
    padding: 14px 18px; text-align: left; font-size: 0.75rem; font-weight: 800;
    color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .ad-table td {
    padding: 16px 18px; border-bottom: 1px solid #e2e8f0;
    font-size: 0.92rem; color: #0f172a; font-weight: 600;
  }
  .ad-table tr:last-child td { border-bottom: none; }
  .ad-table tr:hover td { background: rgba(124, 58, 237, 0.04); }
  .tok-b {
    display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.88rem; font-weight: 900;
    padding: 4px 12px; border-radius: 10px; background: rgba(124, 58, 237, 0.12); color: #7c3aed;
    border: 1px solid rgba(124, 58, 237, 0.25);
  }
  .ad-acts { display: flex; gap: 8px; }
  .ad-ico {
    width: 34px; height: 34px; border: 1px solid #e2e8f0; border-radius: 10px;
    background: #ffffff; display: flex; align-items: center; justify-content: center;
    font-size: 0.9rem; cursor: pointer; transition: all 0.2s; color: #64748b;
  }
  .ad-ico:hover { background: #f8fafc; color: #0f172a; transform: translateY(-1px); }
  .ad-ico.ok:hover { background: rgba(16, 185, 129, 0.15); color: #059669; border-color: rgba(16, 185, 129, 0.3); }
  .ad-ico.no:hover { background: rgba(239, 68, 68, 0.15); color: #dc2626; border-color: rgba(239, 68, 68, 0.3); }

  /* ANALYTICS */
  .ad-agrid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 2rem; }
  .ad-acard {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; padding: 1.5rem;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .ad-acard-title { font-weight: 900; color: #0f172a; font-size: 1.1rem; font-family: 'Outfit', sans-serif; margin-bottom: 4px; }
  .ad-acard-sub { font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem; font-weight: 600; }
  .ad-barchart { display: flex; align-items: flex-end; gap: 10px; height: 140px; margin-top: 8px; }
  .ad-bc { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ad-bar {
    width: 100%; border-radius: 8px 8px 0 0;
    background: linear-gradient(180deg, #7c3aed, rgba(124, 58, 237, 0.3));
    opacity: 0.9; transition: all 0.25s ease; min-height: 6px;
  }
  .ad-bar:hover { opacity: 1; filter: brightness(1.1); }
  .ad-bl { font-size: 0.75rem; color: #64748b; font-weight: 700; }
  .ad-bv { font-size: 0.75rem; color: #7c3aed; font-weight: 900; margin-bottom: 2px; }
  .ad-srow { margin-bottom: 16px; }
  .ad-srow .hd { display: flex; justify-content: space-between; font-size: 0.88rem; margin-bottom: 8px; font-family: 'Outfit', sans-serif; }
  .ad-srow .hd span { color: #64748b; font-weight: 700; }
  .ad-srow .hd strong { color: #0f172a; font-weight: 900; }
  .ad-prog { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
  .ad-pfill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

  /* SHOPS CARDS */
  .ad-shops { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
  .ad-shop {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 20px; padding: 1.5rem; position: relative; overflow: hidden; transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .ad-shop:hover { box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); transform: translateY(-4px); border-color: rgba(124, 58, 237, 0.3); }
  .ad-sh-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .ad-sh-n { font-weight: 900; font-size: 1.1rem; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ad-sh-c { font-size: 0.8rem; color: #0284c7; margin-top: 3px; font-weight: 700; }
  .ad-sh-m { display: flex; gap: 16px; margin: 12px 0; }
  .ad-sh-mi { font-size: 0.85rem; color: #64748b; font-weight: 600; }
  .ad-sh-mi strong { color: #0f172a; font-weight: 800; }
  .ad-sh-btns { display: flex; gap: 10px; margin-top: 16px; }
  .ad-shbtn {
    flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 25px;
    background: #ffffff; font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800;
    color: #64748b; cursor: pointer; transition: all 0.25s ease;
  }
  .ad-shbtn:hover { background: #f8fafc; color: #0f172a; }
  .ad-shbtn.p { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; border-color: transparent; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); }
  .ad-shbtn.p:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(219, 39, 119, 0.4); }

  /* OVERLAY & MODAL */
  .ad-overlay {
    position: fixed; inset: 0; z-index: 300; background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .ad-modal {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px;
    padding: 2.25rem; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.15);
  }
  .ad-mtitle { font-size: 1.4rem; font-weight: 900; color: #0f172a; margin-bottom: 6px; font-family: 'Outfit', sans-serif; }
  .ad-msub { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; font-weight: 600; }
  .ad-mfooter { display: flex; gap: 12px; margin-top: 1.5rem; }
  .ad-mbtn {
    flex: 1; padding: 12px; border-radius: 30px; font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 800;
    cursor: pointer; border: 1px solid #e2e8f0; color: #0f172a;
    background: #ffffff; transition: all 0.25s ease;
  }
  .ad-mbtn:hover { background: #f8fafc; }
  .ad-mbtn.p { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; border-color: transparent; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); }
  .ad-mbtn.p:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(219, 39, 119, 0.4); }

  .ad-minput, .ad-finput, .ad-fselect {
    width: 100%; padding: 12px 18px;
    background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 14px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.92rem;
    outline: none; color: #0f172a; transition: all 0.25s ease; font-weight: 600;
  }
  .ad-minput:focus, .ad-finput:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
  .ad-fgroup { margin-bottom: 1.25rem; }
  .ad-flabel { display: block; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }

  /* VERIFY RESULT */
  .verify-result { margin-top: 16px; padding: 16px; border-radius: 16px; font-size: 0.9rem; font-weight: 700; }
  .verify-result.ok { background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #059669; }
  .verify-result.fail { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #dc2626; }
  .verified-user { margin-top: 10px; padding: 14px; background: #f8fafc; border-radius: 12px; font-size: 0.85rem; color: #64748b; }
  .verified-user div { margin-bottom: 6px; }
  .verified-user strong { color: #0f172a; }

  .ad-shop-select {
    padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 20px; font-family: 'Outfit', sans-serif; font-size: 0.88rem; font-weight: 800;
    color: #0f172a; outline: none; cursor: pointer; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
  }

  /* Filters */
  .ud-filters { display: flex; gap: 10px; margin-bottom: 1.75rem; flex-wrap: wrap; }
  .ud-fpill {
    padding: 8px 20px; border: 1px solid #e2e8f0; border-radius: 30px;
    font-size: 0.85rem; font-weight: 800; color: #64748b; cursor: pointer;
    background: #ffffff; font-family: 'Outfit', sans-serif; transition: all 0.25s ease; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
  }
  .ud-fpill:hover { border-color: #cbd5e1; color: #0f172a; }
  .ud-fpill.on { border-color: transparent; color: #fff; background: linear-gradient(135deg, #7c3aed, #db2777); box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); }

  /* TOAST & LOADING */
  .ad-toast {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
    background: #ffffff; border: 1px solid #e2e8f0;
    border-left: 4px solid #059669; color: #0f172a; padding: 16px 22px; border-radius: 16px;
    font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12); font-family: 'Outfit', sans-serif;
  }
  .ad-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b; font-size: 0.95rem; gap: 12px; font-weight: 700; }
  .ad-spinner { width: 24px; height: 24px; border: 3px solid rgba(124, 58, 237, 0.2); border-top-color: #db2777; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .ad-empty { text-align: center; padding: 4rem; color: #94a3b8; font-weight: 700; }
  .ad-empty .ico { font-size: 2.8rem; margin-bottom: 1rem; opacity: 0.6; }

  @media(max-width: 900px) {
    .ad-shell { grid-template-columns: 1fr; }
    .ad-side { display: none; }
    .ad-kpis { grid-template-columns: repeat(2, 1fr); }
    .ad-agrid { grid-template-columns: 1fr; }
    .ad-shops { grid-template-columns: 1fr; }
  }
`;

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return <div className="ad-toast"><span style={{ color: "#059669" }}>✓</span>{msg}</div>;
}

function formatTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function AdminDashboard() {
  const { state, dispatch } = useAuth();
  const navigate = useNavigate();
  const user = state?.user || {};

  const [section, setSection] = useState("queue");
  const [shops, setShops] = useState([]);
  const [activeShop, setActiveShop] = useState(null);
  const [queue, setQueue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifyTok, setVerifyTok] = useState("");
  const [verifyRes, setVerifyRes] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [newShop, setNewShop] = useState({ name: "", category: "Banking", address: "", avgWait: "" });
  const [creating, setCreating] = useState(false);
  const [socket, setSocket] = useState(null);
  const [queueFilter, setQueueFilter] = useState("all");
  const [deleteShopModal, setDeleteShopModal] = useState(null);
  const [adminProfileForm, setAdminProfileForm] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const activeShopRef = useRef(activeShop);
  activeShopRef.current = activeShop;

  const notify = (msg) => setToast(msg);

  const openEditProfile = () => {
    setAdminProfileForm({
      name: user.name || "",
      phone: user.phone || "",
    });
    setModal("editProfile");
  };

  const handleSaveAdminProfile = async (e) => {
    if (e) e.preventDefault();
    if (!adminProfileForm.name || adminProfileForm.name.trim().length < 2) {
      notify("Name must be at least 2 characters");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.auth.updateMe(adminProfileForm);
      dispatch({ type: "SET_USER", payload: res.user });
      notify("Profile updated successfully! ✨");
      setModal(null);
    } catch (err) {
      notify(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const loadShops = useCallback(async () => {
    try {
      const res = await api.shops.my();
      const list = res.shops || [];
      setShops(list);
      if (!activeShopRef.current && list.length > 0) setActiveShop(list[0]);
    } catch (e) { notify(e.message || "Failed to load shops"); }
  }, []);

  const loadQueue = useCallback(async (shopId) => {
    if (!shopId) return;
    try {
      const res = await api.queue.get(shopId);
      setQueue(res.queue || []);
    } catch (e) { notify(e.message || "Failed to load queue"); }
  }, []);

  const loadAnalytics = useCallback(async (shopId) => {
    if (!shopId) return;
    try {
      const res = await api.queue.analytics(shopId);
      setAnalytics(res.analytics);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const init = async () => { setLoading(true); await loadShops(); setLoading(false); };
    init();
  }, [loadShops]);

  useEffect(() => {
    if (activeShop?._id) {
      loadQueue(activeShop._id);
      loadAnalytics(activeShop._id);
    }
  }, [activeShop, loadQueue, loadAnalytics]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    setSocket(s);

    s.on("queue:joined", () => {
      const cur = activeShopRef.current;
      if (cur?._id) { loadQueue(cur._id); loadAnalytics(cur._id); }
      loadShops();
    });
    s.on("queue:updated", (d) => {
      if (d.queue) setQueue(d.queue);
      const cur = activeShopRef.current;
      if (cur?._id) loadAnalytics(cur._id);
      loadShops();
    });
    s.on("queue:entryUpdated", () => {
      const cur = activeShopRef.current;
      if (cur?._id) { loadQueue(cur._id); loadAnalytics(cur._id); }
      loadShops();
    });
    s.on("queue:entryRemoved", () => {
      const cur = activeShopRef.current;
      if (cur?._id) { loadQueue(cur._id); loadAnalytics(cur._id); }
      loadShops();
    });
    s.on("shop:created", () => loadShops());
    s.on("shop:updated", () => loadShops());
    s.on("shop:statusChanged", () => loadShops());

    return () => s.disconnect();
  }, [loadQueue, loadShops, loadAnalytics]);

  useEffect(() => {
    if (socket && activeShop?._id) {
      socket.emit("joinShopRoom", activeShop._id);
    }
  }, [socket, activeShop?._id]);

  const callNext = async () => {
    if (!activeShop?._id) return;
    try {
      await api.queue.callNext(activeShop._id);
      await loadQueue(activeShop._id);
      await loadShops();
      await loadAnalytics(activeShop._id);
      notify("Next customer called!");
    } catch (e) { notify(e.message || "Failed"); }
  };

  const markDone = async (entryId) => {
    try {
      await api.queue.markDone(entryId);
      if (activeShop?._id) await loadQueue(activeShop._id);
      await loadShops();
      if (activeShop?._id) await loadAnalytics(activeShop._id);
      notify("Customer marked as completed ✓");
    } catch (e) { notify(e.message || "Failed"); }
  };

  const removeEntry = async (entryId) => {
    try {
      await api.queue.remove(entryId);
      if (activeShop?._id) await loadQueue(activeShop._id);
      await loadShops();
      if (activeShop?._id) await loadAnalytics(activeShop._id);
      notify("Customer entry removed");
    } catch (e) { notify(e.message || "Failed"); }
  };

  const acceptEntry = async (entryId) => {
    try {
      const res = await api.queue.accept(entryId);
      if (activeShop?._id) {
        await loadQueue(activeShop._id);
        await loadAnalytics(activeShop._id);
      }
      await loadShops();
      notify(res.message || "Queue request accepted!");
    } catch (e) { notify(e.message || "Failed to accept request"); }
  };

  const rejectEntry = async (entryId) => {
    try {
      await api.queue.reject(entryId);
      if (activeShop?._id) {
        await loadQueue(activeShop._id);
        await loadAnalytics(activeShop._id);
      }
      await loadShops();
      notify("Customer queue request rejected");
    } catch (e) { notify(e.message || "Failed to reject request"); }
  };

  const handleDeleteShop = async (shop) => {
    try {
      await api.shops.delete(shop._id);
      notify(`Shop "${shop.name}" deleted successfully`);
      setDeleteShopModal(null);
      const res = await api.shops.my();
      const list = res.shops || [];
      setShops(list);
      if (activeShop?._id === shop._id) {
        setActiveShop(list.length > 0 ? list[0] : null);
      }
    } catch (e) { notify(e.message || "Failed to delete shop"); }
  };

  const togglePause = async () => {
    if (!activeShop?._id) return;
    try { const res = await api.queue.pause(activeShop._id); await loadShops(); notify(res.status === "paused" ? "Queue paused" : "Queue resumed"); }
    catch (e) { notify(e.message || "Failed"); }
  };

  const verifyToken = async () => {
    if (!verifyTok.trim() || !activeShop?._id) return;
    setVerifying(true); setVerifyRes(null);
    try {
      const res = await api.queue.verify(activeShop._id, verifyTok.trim());
      setVerifyRes(res);
      if (res.valid) {
        await loadQueue(activeShop._id);
        await loadShops();
        await loadAnalytics(activeShop._id);
        notify(res.message || `Token ${verifyTok.toUpperCase()} verified ✓`);
      } else {
        notify("Invalid token. Request not verified.");
      }
    } catch (e) {
      setVerifyRes({ valid: false, message: "Invalid token. Request not verified." });
      notify("Invalid token. Request not verified.");
    }
    setVerifying(false);
  };

  const createShop = async () => {
    if (!newShop.name || !newShop.address) { notify("Fill in all required fields"); return; }
    setCreating(true);
    try {
      await api.shops.create({ name: newShop.name, category: newShop.category, address: newShop.address, avgWait: parseInt(newShop.avgWait) || 10 });
      await loadShops();
      setModal(null);
      setNewShop({ name: "", category: "Banking", address: "", avgWait: "" });
      setSection("shops");
      notify(`Shop "${newShop.name}" created successfully`);
    } catch (e) { notify(e.message || "Failed to create shop"); }
    setCreating(false);
  };

  const serveCustomer = async (token) => {
    try {
      const res = await api.queue.verify(activeShop._id, token);
      if (res.valid) {
        await loadQueue(activeShop._id);
        await loadShops();
        await loadAnalytics(activeShop._id);
        notify(res.message || `Token ${token.toUpperCase()} is now being served.`);
      } else {
        notify(res.message || "Failed to serve customer.");
      }
    } catch (e) {
      notify(e.message || "Failed to serve customer.");
    }
  };

  const pendingRequests = queue.filter(c => ["pending", "PENDING"].includes(c.status));
  const acceptedWaiting = queue.filter(c => ["ACCEPTED", "accepted", "waiting"].includes(c.status));
  const waiting = acceptedWaiting;
  const serving = queue.filter(c => c.status === "serving");
  const paused = activeShop?.status !== "active";
  const initials = user.name?.split(" ").map(w => w[0]).slice(0, 2).join("") || "AU";

  const filteredQueue = queue.filter(c => {
    if (queueFilter === "pending") return ["pending", "PENDING"].includes(c.status);
    if (queueFilter === "accepted" || queueFilter === "waiting") return ["ACCEPTED", "accepted", "waiting"].includes(c.status);
    if (queueFilter === "serving") return c.status === "serving";
    return ["pending", "PENDING", "ACCEPTED", "accepted", "waiting", "serving"].includes(c.status);
  });

  const kpis = [
    { lbl: "Served Today", val: activeShop?.servedToday ?? analytics?.served ?? 0, ico: "✅", bg: "rgba(16,185,129,0.15)", col: "#059669" },
    { lbl: "Avg Wait Time", val: analytics?.avgActualWait ? `${analytics.avgActualWait}m` : `${activeShop?.avgWait ?? 0}m`, ico: "⏱", bg: "rgba(2,132,199,0.15)", col: "#0284c7" },
    { lbl: "Pending Requests", val: pendingRequests.length, ico: "⏳", bg: "rgba(245,158,11,0.15)", col: "#d97706" },
    { lbl: "Accepted In Line", val: acceptedWaiting.length, ico: "👥", bg: "rgba(124,58,237,0.15)", col: "#7c3aed" },
    { lbl: "Serving", val: serving.length, ico: "⚡", bg: "rgba(236,72,153,0.15)", col: "#db2777" },
  ];

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const barData = analytics?.weeklyVolume || [0, 0, 0, 0, 0, 0, 0];
  const maxBar = Math.max(...barData, 1);

  const NAV = [
    { sec: "queue", label: "Queue Management", ico: "📋" },
    { sec: "shops", label: "My Shops", ico: "🏪" },
    { sec: "analytics", label: "Analytics", ico: "📊" },
    { sec: "settings", label: "Settings", ico: "⚙️" },
  ];

  /* Render Analytics */
  const renderAnalytics = () => (
    <div>
      <div className="pg-title">Analytics & Reports</div>
      <div className="pg-sub">{activeShop?.name || "Select a shop"} · Real-time performance metrics</div>
      <div className="ad-kpis">
        {kpis.map(k => (
          <div key={k.lbl} className="ad-kpi">
            <div className="ad-kpi-h">
              <div className="ad-kpi-lbl">{k.lbl}</div>
              <div className="ad-kpi-ico" style={{ background: k.bg }}>{k.ico}</div>
            </div>
            <div className="ad-kpi-val" style={{ color: k.col }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="ad-agrid">
        <div className="ad-acard">
          <div className="ad-acard-title">Weekly Traffic Volume</div>
          <div className="ad-acard-sub">Queue engagements across last 7 days</div>
          <div className="ad-barchart">
            {barData.map((v, i) => (
              <div key={i} className="ad-bc">
                <div className="ad-bv">{v}</div>
                <div className="ad-bar" style={{ height: `${(v / maxBar) * 110}px` }} />
                <div className="ad-bl">{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="ad-acard">
          <div className="ad-acard-title">Customer Distribution</div>
          <div className="ad-acard-sub">Breakdown of queue resolutions</div>
          {[
            { lbl: "Completed", n: analytics?.served ?? 0, col: "#059669", pct: analytics?.served ? Math.round((analytics.served / (analytics.served + analytics.waiting + analytics.noshow + 1)) * 100) : 0 },
            { lbl: "Waiting", n: analytics?.waiting ?? 0, col: "#0284c7", pct: analytics?.waiting ? Math.round((analytics.waiting / (analytics.served + analytics.waiting + analytics.noshow + 1)) * 100) : 0 },
            { lbl: "Serving", n: analytics?.serving ?? serving.length, col: "#db2777", pct: (analytics?.serving || serving.length) ? Math.round(((analytics?.serving || serving.length) / ((analytics?.served || 0) + (analytics?.waiting || 0) + (analytics?.serving || serving.length) + 1)) * 100) : 0 },
          ].map(row => (
            <div key={row.lbl} className="ad-srow">
              <div className="hd"><span>{row.lbl}</span><strong>{row.n}</strong></div>
              <div className="ad-prog"><div className="ad-pfill" style={{ width: `${row.pct}%`, background: row.col }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* Render Shops */
  const renderShops = () => (
    <div>
      <div className="pg-h">
        <div>
          <div className="pg-title">Service Counters</div>
          <div className="pg-sub">Manage your active locations and service points</div>
        </div>
        <button className="ad-btn purple" onClick={() => setModal("newshop")}>+ Add New Shop</button>
      </div>
      {loading && <div className="ad-loading"><div className="ad-spinner" />Loading counters...</div>}
      {!loading && shops.length === 0 && (
        <div className="ad-empty"><div className="ico">🏪</div><p>No shops created yet</p></div>
      )}
      <div className="ad-shops">
        {shops.map(shop => (
          <div key={shop._id} className="ad-shop">
            <div className="ad-sh-h">
              <div>
                <div className="ad-sh-n">{shop.name}</div>
                <div className="ad-sh-c">{shop.category}</div>
              </div>
              <span className={`badge ${shop.status === "active" ? "badge-emerald" : "badge-amber"}`}>{shop.status}</span>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "12px" }}>📍 {shop.address}</div>
            <div className="ad-sh-m">
              <span className="ad-sh-mi">👥 <strong>{shop.queueLength}</strong> waiting</span>
              <span className="ad-sh-mi">⏱ <strong>{shop.avgWait}m avg</strong></span>
            </div>
            <div className="ad-sh-btns" style={{ display: "flex", gap: "10px" }}>
              <button className="ad-shbtn p" style={{ flex: 1 }} onClick={() => { setActiveShop(shop); setSection("queue"); }}>Open Control Panel →</button>
              <button className="ad-shbtn danger" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "14px", padding: "10px 16px", cursor: "pointer", fontWeight: 700 }} onClick={() => setDeleteShopModal(shop)}>🗑️ Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* Render Settings */
  const renderSettings = () => (
    <div>
      <div className="pg-title">Store & Admin Settings</div>
      <div className="pg-sub">Manage service controls and account preferences</div>
      <div className="ad-acard">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#7c3aed,#db2777)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.5rem", fontWeight: 900, boxShadow: "0 8px 24px rgba(124,58,237,0.3)", fontFamily: "'Outfit',sans-serif" }}>
              {initials}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1.2rem", color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>{user.name}</div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 2, fontWeight: 600 }}>Merchant Admin · {user.email}</div>
              {user.phone && <div style={{ fontSize: "0.8rem", color: "#7c3aed", marginTop: 2, fontWeight: 700 }}>📞 {user.phone}</div>}
            </div>
          </div>
          <button className="ad-btn purple" style={{ padding: "8px 18px", fontSize: "0.85rem" }} onClick={openEditProfile}>✏️ Edit Profile</button>
        </div>
        {[
          ["Real-Time Audio Alert", "Play chime when customer joins queue"],
          ["Auto-Advance Queue", "Automatically call next customer when marked done"],
          ["Operating Schedule", "Configured 09:00 AM – 08:00 PM"],
          ["Token Prefix Format", "Q-001, Q-002, Q-003..."],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", fontFamily: "'Outfit',sans-serif" }}>{k}</div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>{v}</div>
            </div>
            <button className="ad-btn outline" style={{ padding: "6px 16px", fontSize: "0.8rem" }}
              onClick={() => notify(`${k} settings saved`)}>Update</button>
          </div>
        ))}
        <div style={{ marginTop: "1.75rem", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button className="ad-btn purple" style={{ padding: "10px 20px" }} onClick={openEditProfile}>✏️ Edit Profile</button>
          <button className="ad-navbtn" style={{ padding: "10px 24px" }} onClick={handleSignOut}>Sign Out Admin</button>
        </div>
      </div>
    </div>
  );

  /* Render Queue Management */
  const renderQueue = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
        <div>
          <div className="pg-title">Queue Control Console</div>
          <div style={{ color: "#64748b", fontSize: "0.92rem", fontWeight: 600 }}>
            {activeShop?.name || "No shop selected"} · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>
        {shops.length > 1 && (
          <select className="ad-shop-select"
            value={activeShop?._id || ""}
            onChange={e => { const s = shops.find(x => x._id === e.target.value); if (s) setActiveShop(s); }}>
            {shops.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        )}
      </div>

      <div className="ad-kpis">
        {kpis.map(k => (
          <div key={k.lbl} className="ad-kpi" style={{ cursor: "pointer" }} onClick={() => {
            if (k.lbl === "Pending Requests") setQueueFilter("pending");
            else if (k.lbl === "Accepted In Line") setQueueFilter("accepted");
            else if (k.lbl === "Serving") setQueueFilter("serving");
            else setQueueFilter("all");
          }}>
            <div className="ad-kpi-h">
              <div className="ad-kpi-lbl">{k.lbl}</div>
              <div className="ad-kpi-ico" style={{ background: k.bg }}>{k.ico}</div>
            </div>
            <div className="ad-kpi-val" style={{ color: k.col }}>{k.val}</div>
          </div>
        ))}
      </div>

      <div className="ad-ctrl">
        <button className="ad-btn accent" onClick={callNext} disabled={!activeShop || acceptedWaiting.length === 0}>
          ▶ Call Next Customer
        </button>
        <button className={`ad-btn ${paused ? "accent" : "warn"}`} onClick={togglePause} disabled={!activeShop}>
          {paused ? "▶ Resume Queue" : "⏸ Pause Queue"}
        </button>
        <button className="ad-btn outline" onClick={() => { setVerifyTok(""); setVerifyRes(null); setModal("verify"); }}>
          🔍 Verify QR Code
        </button>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {paused && <span className="badge badge-amber">Queue Paused</span>}
          <div className="live-pill"><div className="live-d" />Socket Sync</div>
        </div>
      </div>

      <div className="ud-filters" style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
        <button className={`ud-fpill ${queueFilter === "all" ? "on" : ""}`} onClick={() => setQueueFilter("all")}>
          All Active ({filteredQueue.length})
        </button>
        <button className={`ud-fpill ${queueFilter === "pending" ? "on" : ""}`} onClick={() => setQueueFilter("pending")}>
          Pending ({pendingRequests.length})
        </button>
        <button className={`ud-fpill ${queueFilter === "accepted" ? "on" : ""}`} onClick={() => setQueueFilter("accepted")}>
          Accepted ({acceptedWaiting.length})
        </button>
        <button className={`ud-fpill ${queueFilter === "serving" ? "on" : ""}`} onClick={() => setQueueFilter("serving")}>
          Serving ({serving.length})
        </button>
      </div>

      <div className="sec-row">
        Active Queue Line
        <span className="badge badge-cyan">{filteredQueue.length} shown</span>
      </div>

      {loading
        ? <div className="ad-loading"><div className="ad-spinner" />Syncing queue list...</div>
        : (
          <div className="ad-twrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>#</th><th>Token</th><th>Customer Name</th><th>Phone</th>
                  <th>Joined</th><th>Est. Wait</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map((c, i) => (
                  <tr key={c._id}>
                    <td style={{ color: "#94a3b8", width: 40, fontWeight: 700 }}>{i + 1}</td>
                    <td><span className="tok-b">{c.token}</span></td>
                    <td style={{ fontWeight: 800, color: "#0f172a" }}>{c.user?.name || c.name || "—"}</td>
                    <td style={{ color: "#64748b", fontWeight: 600 }}>{c.user?.phone || c.phone || "—"}</td>
                    <td style={{ color: "#64748b", fontWeight: 600 }}>{formatTime(c.joinedAt)}</td>
                    <td>{c.status === "completed" ? "—" : `~${c.estimatedWait ?? 0} m`}</td>
                    <td>
                      <span className={`badge ${c.status === "serving" ? "badge-emerald" : ["pending", "PENDING"].includes(c.status) ? "badge-amber" : c.status === "completed" ? "badge-cyan" : "badge-violet"}`}>
                        {c.status === "serving" ? "🟢 Serving" : ["pending", "PENDING"].includes(c.status) ? "⏳ Pending" : c.status === "completed" ? "✓ Done" : "✅ Accepted"}
                      </span>
                    </td>
                    <td>
                      <div className="ad-acts">
                        {c.status === "serving" ? (
                          <button className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem", borderRadius: "10px", background: "linear-gradient(135deg, var(--accent-emerald), #10b981)", boxShadow: "none" }} onClick={() => markDone(c._id)}>
                            Task Completed ✓
                          </button>
                        ) : ["pending", "PENDING"].includes(c.status) ? (
                          <>
                            <button className="ad-btn accent" style={{ padding: "5px 12px", fontSize: "0.78rem", borderRadius: "10px" }} title="Accept Request" onClick={() => acceptEntry(c._id)}>
                              Accept Request ✓
                            </button>
                            <button className="ad-ico no" title="Reject Request" onClick={() => rejectEntry(c._id)}>✕</button>
                          </>
                        ) : (
                          <>
                            <button className="ad-ico ok" title="Serve customer" onClick={() => serveCustomer(c.token)}>🟢</button>
                            <button className="ad-ico" title="Verify token"
                              onClick={() => { setVerifyTok(c.token); setModal("verify"); }}>🔍</button>
                            <button className="ad-ico no" title="Reject Request" onClick={() => rejectEntry(c._id)}>✕</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredQueue.length === 0 && (
                  <tr><td colSpan={8}>
                    <div className="ad-empty"><div className="ico">🎉</div><p>No customers in this filtered list</p></div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );

  const renderSection = () => {
    if (section === "analytics") return renderAnalytics();
    if (section === "shops") return renderShops();
    if (section === "settings") return renderSettings();
    return renderQueue();
  };

  return (
    <>
      <style>{css}</style>
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      <div>
        {/* NAV */}
        <nav className="ad-nav">
          <div className="ad-brand">
            <div className="ad-brand-icon">⚡</div>
            ALPHALine <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>/ Merchant Admin</span>
          </div>
          <div className="ad-nav-r">
            <div className="live-pill"><div className="live-d" />Live</div>
            {activeShop && <span className="ad-shop-tag">🏦 {activeShop.name}</span>}
            <div className="ad-avatar">{initials}</div>
            <button className="ad-navbtn" onClick={handleSignOut}>Sign Out</button>
          </div>
        </nav>

        {/* BODY */}
        <div className="ad-shell">
          <aside className="ad-side">
            <div className="ad-s-user" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="ad-s-uname">{user.name}</div>
                <div className="ad-s-urole">Store Operator</div>
              </div>
              <button onClick={openEditProfile} title="Edit Profile" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", padding: "4px 8px", color: "#7c3aed" }}>✏️ Edit</button>
            </div>
            <span className="ad-s-lbl">Queue</span>
            {NAV.slice(0, 2).map(n => (
              <div key={n.sec} className={`ad-s-item ${section === n.sec ? "on" : ""}`} onClick={() => setSection(n.sec)}>
                {n.ico} {n.label}
              </div>
            ))}
            <span className="ad-s-lbl">Analytics</span>
            <div className={`ad-s-item ${section === "analytics" ? "on" : ""}`} onClick={() => setSection("analytics")}>
              📊 Analytics
            </div>
            <span className="ad-s-lbl">System</span>
            <div className={`ad-s-item ${section === "settings" ? "on" : ""}`} onClick={() => setSection("settings")}>
              ⚙️ Settings
            </div>
            <div className="ad-qstatus">
              <div className="ad-qslbl">Queue Status</div>
              <div className="ad-qsval">{paused ? "⏸ Paused" : "🟢 Accepting"}</div>
              <div className="ad-qssub">{(acceptedWaiting || []).length} in line · {(serving || []).length} serving</div>
            </div>
          </aside>
          <main className="ad-main">{renderSection()}</main>
        </div>

        {/* VERIFY MODAL */}
        {modal === "verify" && (
          <div className="ad-overlay" onClick={() => { setModal(null); setVerifyRes(null); }}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>
              <div className="ad-mtitle">🔍 Verify Customer Token</div>
              <div className="ad-msub">Enter customer token to confirm line position</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input className="ad-minput" style={{ flex: 1 }}
                  placeholder="e.g. 102, 147, 231"
                  value={verifyTok}
                  onChange={e => { setVerifyTok(e.target.value.toUpperCase()); setVerifyRes(null); }}
                  onKeyDown={e => e.key === "Enter" && verifyToken()}
                />
                <button className="ad-btn purple" style={{ flexShrink: 0 }}
                  onClick={verifyToken} disabled={verifying || !verifyTok.trim()}>
                  {verifying ? "..." : "Verify"}
                </button>
              </div>
              {verifyRes && (
                <div className={`verify-result ${verifyRes.valid ? "ok" : "fail"}`}>
                  {verifyRes.valid ? (
                    <>
                      <div style={{ fontWeight: 800, marginBottom: 8 }}>✅ Valid Customer Token</div>
                      <div className="verified-user">
                        <div><strong>Name:</strong> {verifyRes.entry?.name}</div>
                        <div><strong>Phone:</strong> {verifyRes.entry?.phone || "—"}</div>
                        <div><strong>Status:</strong> <span style={{ textTransform: "capitalize" }}>{verifyRes.entry?.status}</span></div>
                        <div><strong>Position:</strong> #{verifyRes.entry?.position}</div>
                      </div>
                    </>
                  ) : (
                    <div>❌ {verifyRes.message || "Invalid token. Request not verified."}</div>
                  )}
                </div>
              )}
              <div className="ad-mfooter">
                <button className="ad-mbtn" onClick={() => { setModal(null); setVerifyRes(null); }}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* NEW SHOP MODAL */}
        {modal === "newshop" && (
          <div className="ad-overlay" onClick={() => setModal(null)}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>
              <div className="ad-mtitle">🏪 Create Service Counter</div>
              <div className="ad-msub">Add a new shop location to your account</div>
              <div className="ad-fgroup">
                <label className="ad-flabel">Shop Name *</label>
                <input className="ad-finput" placeholder="e.g. Metro Bank – Central Branch"
                  value={newShop.name} onChange={e => setNewShop({ ...newShop, name: e.target.value })} />
              </div>
              <div className="ad-fgroup">
                <label className="ad-flabel">Category</label>
                <select className="ad-fselect" value={newShop.category}
                  onChange={e => setNewShop({ ...newShop, category: e.target.value })}>
                  <option>Banking</option><option>Healthcare</option>
                  <option>Government</option><option>Other</option>
                </select>
              </div>
              <div className="ad-fgroup">
                <label className="ad-flabel">Address *</label>
                <input className="ad-finput" placeholder="Downtown Financial District"
                  value={newShop.address} onChange={e => setNewShop({ ...newShop, address: e.target.value })} />
              </div>
              <div className="ad-fgroup">
                <label className="ad-flabel">Avg Service Wait (minutes)</label>
                <input className="ad-finput" type="number" placeholder="10" min="1"
                  value={newShop.avgWait} onChange={e => setNewShop({ ...newShop, avgWait: e.target.value })} />
              </div>
              <div className="ad-mfooter">
                <button className="ad-mbtn" onClick={() => setModal(null)}>Cancel</button>
                <button className="ad-mbtn p" onClick={createShop} disabled={creating}>
                  {creating ? "Creating..." : "Create Counter"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Shop Confirmation Modal */}
        {deleteShopModal && (
          <div className="ad-overlay" onClick={() => setDeleteShopModal(null)}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>
              <div className="ad-mtitle" style={{ color: "var(--danger)" }}>Delete Shop? 🛑</div>
              <div className="ad-msub" style={{ marginTop: "1rem", lineHeight: "1.6" }}>
                Are you sure you want to delete <strong>"{deleteShopModal.name}"</strong>? This action cannot be undone and will cancel all active queue requests for this shop.
              </div>
              <div className="ad-mfooter">
                <button className="ad-mbtn" onClick={() => setDeleteShopModal(null)}>Cancel</button>
                <button className="ad-mbtn p" style={{ background: "linear-gradient(135deg, var(--danger), #ef4444)" }} onClick={() => handleDeleteShop(deleteShopModal)}>Confirm Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT PROFILE MODAL */}
        {modal === "editProfile" && (
          <div className="ad-overlay" onClick={() => setModal(null)}>
            <div className="ad-modal" onClick={e => e.stopPropagation()}>
              <div className="ad-mtitle">✏️ Edit Profile</div>
              <div className="ad-msub">Update your merchant operator details</div>
              <form onSubmit={handleSaveAdminProfile}>
                <div className="ad-fgroup">
                  <label className="ad-flabel">Full Name *</label>
                  <input
                    className="ad-finput"
                    placeholder="Enter your full name"
                    value={adminProfileForm.name}
                    onChange={e => setAdminProfileForm({ ...adminProfileForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="ad-fgroup">
                  <label className="ad-flabel">Phone Number</label>
                  <input
                    className="ad-finput"
                    placeholder="+91 98765 43210"
                    value={adminProfileForm.phone}
                    onChange={e => setAdminProfileForm({ ...adminProfileForm, phone: e.target.value })}
                  />
                </div>
                <div className="ad-fgroup">
                  <label className="ad-flabel">Email Address</label>
                  <input
                    className="ad-finput"
                    value={user.email || ""}
                    disabled
                    style={{ background: "#f8fafc", color: "#94a3b8", cursor: "not-allowed" }}
                  />
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>Email is associated with your account and cannot be changed.</div>
                </div>
                <div className="ad-mfooter">
                  <button type="button" className="ad-mbtn" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="ad-mbtn p" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      </div>
    </>
  );
}
