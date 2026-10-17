/**
 * FILE: src/pages/UserDashboard.jsx
 * DESIGN: Gen-Z Luminous White Gradient Customer Dashboard
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth }     from "../context/AuthContext";
import { io }          from "socket.io-client";
import api             from "../services/api";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";
const generateQR = (tok) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=QUEUELESS-${tok}`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  /* NAV */
  .ud-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    padding: 0 2rem; height: 70px; display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  }
  .ud-brand {
    display: flex; align-items: center; gap: 12px; font-weight: 300; font-size: 1.3rem; letter-spacing: 3.5px;
    font-family: 'Outfit', sans-serif;
    background: linear-gradient(135deg, #0f172a, #475569);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ud-brand-icon {
    width: 36px; height: 36px; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
  }
  .ud-nav-r { display: flex; align-items: center; gap: 12px; }
  .ud-live-pill {
    display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #059669; font-weight: 800;
    background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 30px; padding: 6px 14px; text-transform: uppercase; letter-spacing: 1px;
  }
  .ud-live-d { width: 7px; height: 7px; border-radius: 50%; background: #059669; animation: pulseGlow 1.8s infinite; }
  .ud-nbadge {
    position: relative; cursor: pointer; width: 40px; height: 40px; border-radius: 12px;
    background: #ffffff; border: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .ud-nbadge:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-2px); }
  .ud-bdot {
    position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; border-radius: 50%;
    background: #db2777; border: 2px solid #ffffff;
  }
  .ud-avatar {
    width: 40px; height: 40px; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex; align-items: center; justify-content: center; color: #fff;
    font-size: 0.85rem; font-weight: 900; cursor: pointer;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); transition: all 0.25s ease;
    font-family: 'Outfit', sans-serif;
  }
  .ud-avatar:hover { transform: scale(1.05); box-shadow: 0 8px 24px rgba(219, 39, 119, 0.4); }
  .ud-navbtn {
    padding: 8px 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 20px; font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800;
    color: #dc2626; cursor: pointer; transition: all 0.25s ease;
  }
  .ud-navbtn:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); transform: translateY(-1px); }

  /* SHELL */
  .ud-shell { display: grid; grid-template-columns: 270px 1fr; min-height: calc(100vh - 70px); }

  /* SIDEBAR */
  .ud-side {
    background: rgba(255, 255, 255, 0.7); border-right: 1px solid rgba(226, 232, 240, 0.8);
    padding: 1.75rem 0; display: flex; flex-direction: column; backdrop-filter: blur(16px);
  }
  .ud-s-sec { padding: 0 1.25rem; margin-bottom: 2rem; }
  .ud-s-lbl {
    font-size: 0.72rem; font-weight: 800; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; padding: 0 8px;
  }
  .ud-s-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px;
    cursor: pointer; transition: all 0.25s ease; color: #475569;
    font-size: 0.92rem; font-weight: 700; margin-bottom: 4px; font-family: 'Outfit', sans-serif;
  }
  .ud-s-item:hover { background: rgba(255, 255, 255, 0.9); color: #0f172a; transform: translateX(3px); }
  .ud-s-item.on {
    background: #ffffff;
    border: 1px solid rgba(124, 58, 237, 0.25); color: #7c3aed; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.12);
  }
  .ud-s-icon { font-size: 1.1rem; width: 24px; text-align: center; }
  
  .ud-qmini {
    margin: auto 1.25rem 1.25rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 16px; padding: 16px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
  }
  .ud-qmini-lbl { font-size: 0.7rem; color: #059669; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
  .ud-qmini-tok { font-family: 'JetBrains Mono', monospace; font-size: 1.2rem; font-weight: 900; color: #0f172a; }
  .ud-qmini-shop { font-size: 0.82rem; color: #64748b; margin-top: 2px; font-weight: 600; }

  /* MAIN */
  .ud-main { padding: 2.25rem; overflow-y: auto; position: relative; z-index: 2; }
  .pg-title {
    font-size: 1.7rem; font-weight: 900; margin-bottom: 6px; font-family: 'Outfit', sans-serif;
    color: #0f172a;
  }
  .pg-sub { color: #64748b; font-size: 0.95rem; margin-bottom: 2.25rem; font-weight: 600; }

  /* STAT CARDS */
  .ud-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 2.25rem; }
  .ud-scard {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 20px; padding: 1.4rem; transition: all 0.3s ease; cursor: default;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .ud-scard:hover { border-color: rgba(124, 58, 237, 0.4); transform: translateY(-4px); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
  .ud-sicon {
    width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
    font-size: 1.25rem; margin-bottom: 12px;
  }
  .ud-sval { font-size: 1.8rem; font-weight: 900; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-slbl { font-size: 0.8rem; color: #64748b; margin-top: 4px; font-weight: 700; }

  /* ACTIVE QUEUE CARD */
  .ud-qcard {
    background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(20px);
    border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 24px; padding: 1.75rem;
    margin-bottom: 2.5rem; position: relative; overflow: hidden;
    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.08), 0 0 30px rgba(124, 58, 237, 0.12);
  }
  .ud-qcard::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #7c3aed, #db2777, #0284c7);
  }
  .ud-qh { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .ud-qtitle { font-size: 0.75rem; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; }
  .ud-qshop { font-size: 1.25rem; font-weight: 900; margin-top: 4px; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-qtoken {
    font-family: 'JetBrains Mono', monospace; font-size: 2.4rem; font-weight: 900;
    color: #0284c7; letter-spacing: 0.08em;
  }
  .ud-qgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 1.5rem; }
  .ud-qstat-lbl { font-size: 0.72rem; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; }
  .ud-qstat-val { font-size: 1.25rem; font-weight: 900; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-pbar { height: 6px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 12px; }
  .ud-pfill { height: 100%; background: linear-gradient(90deg, #7c3aed, #db2777, #0284c7); border-radius: 4px; transition: width 0.8s ease; }
  .ud-pulse-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: #64748b; margin-top: 10px; font-weight: 600; }
  .ud-pdot { width: 8px; height: 8px; border-radius: 50%; background: #059669; animation: pulseGlow 1.8s infinite; }
  .ud-qbtns { display: flex; gap: 12px; margin-top: 1.5rem; }
  .ud-qbtn {
    flex: 1; padding: 12px; border-radius: 30px; font-family: 'Outfit', sans-serif;
    font-size: 0.9rem; font-weight: 800; cursor: pointer; transition: all 0.25s ease; border: none;
  }
  .ud-qbtn.ghost { background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; }
  .ud-qbtn.ghost:hover { background: #e2e8f0; transform: translateY(-2px); }
  .ud-qbtn.cancel { background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
  .ud-qbtn.cancel:hover { background: rgba(239, 68, 68, 0.2); transform: translateY(-2px); }

  /* SEARCH & SHOP CARDS */
  .sec-row { display: flex; align-items: center; justify-content: space-between; font-size: 1.2rem; font-weight: 900; margin-bottom: 1.2rem; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-search {
    display: flex; align-items: center; gap: 12px;
    background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 16px; padding: 12px 18px; margin-bottom: 1.5rem;
    transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .ud-search:focus-within { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
  .ud-search input { border: none; outline: none; flex: 1; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.95rem; background: transparent; color: #0f172a; font-weight: 600; }
  .ud-search input::placeholder { color: #94a3b8; }
  .ud-sico { color: #94a3b8; font-size: 1.1rem; }
  
  .ud-filters { display: flex; gap: 10px; margin-bottom: 1.75rem; flex-wrap: wrap; }
  .ud-fpill {
    padding: 8px 20px; border: 1px solid #e2e8f0; border-radius: 30px;
    font-size: 0.85rem; font-weight: 800; color: #64748b; cursor: pointer;
    background: #ffffff; font-family: 'Outfit', sans-serif; transition: all 0.25s ease; box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
  }
  .ud-fpill:hover { border-color: #cbd5e1; color: #0f172a; }
  .ud-fpill.on { border-color: transparent; color: #fff; background: linear-gradient(135deg, #7c3aed, #db2777); box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); }

  .ud-shops { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
  .ud-shop {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 20px; padding: 1.5rem; cursor: pointer; transition: all 0.3s ease; position: relative; overflow: hidden;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  }
  .ud-shop:hover { box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); transform: translateY(-4px); border-color: rgba(124, 58, 237, 0.3); }
  .ud-shop-h { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .ud-shop-n { font-weight: 900; font-size: 1.1rem; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-shop-c { font-size: 0.8rem; color: #0284c7; margin-top: 3px; font-weight: 700; }
  .ud-shop-addr { font-size: 0.85rem; color: #64748b; margin-bottom: 14px; font-weight: 500; }
  .ud-shop-m { display: flex; gap: 16px; margin: 12px 0; }
  .ud-shop-mi { font-size: 0.85rem; color: #64748b; font-weight: 600; }
  .ud-shop-mi strong { color: #0f172a; font-weight: 800; }
  .ud-shop-btns { display: flex; gap: 10px; margin-top: 16px; }
  .ud-sbtn {
    flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 25px;
    background: #ffffff; font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800;
    color: #64748b; cursor: pointer; transition: all 0.25s ease;
  }
  .ud-sbtn:hover { background: #f8fafc; color: #0f172a; }
  .ud-sbtn.p { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; border-color: transparent; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); }
  .ud-sbtn.p:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(219, 39, 119, 0.4); }
  .ud-sbtn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

  /* NOTIFICATIONS */
  .ud-notifs { display: flex; flex-direction: column; gap: 12px; }
  .ud-notif {
    display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px;
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 16px; transition: all 0.25s ease; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .ud-notif:hover { border-color: rgba(124, 58, 237, 0.3); transform: translateX(3px); }
  .ud-notif.unread { border-left: 4px solid #7c3aed; }
  .ud-nicon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
  .ud-ntitle { font-size: 0.95rem; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-ntime { font-size: 0.78rem; color: #94a3b8; margin-top: 4px; font-weight: 600; }

  /* PROFILE */
  .ud-prof { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 24px; padding: 2rem; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
  .ud-pavatar {
    width: 80px; height: 80px; border-radius: 24px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.8rem; font-weight: 900;
    margin-bottom: 1.25rem; box-shadow: 0 8px 28px rgba(124, 58, 237, 0.3); font-family: 'Outfit', sans-serif;
  }
  .ud-pname { font-size: 1.3rem; font-weight: 900; color: #0f172a; font-family: 'Outfit', sans-serif; }
  .ud-prole { font-size: 0.85rem; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 10px; font-weight: 700; }
  .ud-pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 1.75rem; }
  .ud-pfield .k { font-size: 0.72rem; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; }
  .ud-pfield .v { font-size: 0.95rem; font-weight: 800; color: #0f172a; }

  /* FORM INPUTS */
  .ud-fgroup { margin-bottom: 1.15rem; text-align: left; }
  .ud-flabel { font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 6px; display: block; text-transform: uppercase; letter-spacing: 0.08em; }
  .ud-finput {
    width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 14px;
    font-size: 0.92rem; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a; outline: none; transition: all 0.25s ease; background: #f8fafc; box-sizing: border-box;
  }
  .ud-finput:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
  .ud-chk-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: left; }
  .ud-chk-row label { font-size: 0.88rem; font-weight: 700; color: #334155; cursor: pointer; }

  /* MODAL */
  .ud-overlay {
    position: fixed; inset: 0; z-index: 300; background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .ud-modal {
    background: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px;
    padding: 2.25rem; width: 100%; max-width: 450px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.15);
    text-align: center;
  }
  .ud-mtitle { font-size: 1.4rem; font-weight: 900; color: #0f172a; margin-bottom: 6px; font-family: 'Outfit', sans-serif; }
  .ud-msub { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; font-weight: 600; }
  .ud-qr-box {
    text-align: center; padding: 1.75rem; background: #f8fafc; border-radius: 20px;
    margin-bottom: 1.5rem; border: 1px solid #e2e8f0;
  }
  .ud-mtoken { font-family: 'JetBrains Mono', monospace; font-size: 2.2rem; font-weight: 900; color: #0284c7; letter-spacing: 0.12em; }
  .ud-msub2 { font-size: 0.8rem; color: #64748b; margin-top: 8px; font-weight: 600; }
  .ud-mfooter { display: flex; gap: 12px; margin-top: 1.5rem; }
  .ud-mbtn {
    flex: 1; padding: 12px; border-radius: 30px; font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 800;
    cursor: pointer; border: 1px solid #e2e8f0; color: #0f172a;
    background: #ffffff; transition: all 0.25s ease;
  }
  .ud-mbtn:hover { background: #f8fafc; }
  .ud-mbtn.p { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; border-color: transparent; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3); }
  .ud-mbtn.p:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(219, 39, 119, 0.4); }

  /* TOAST & LOADING */
  .ud-toast {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 999;
    background: #ffffff; border: 1px solid #e2e8f0;
    border-left: 4px solid #059669; color: #0f172a; padding: 16px 22px; border-radius: 16px;
    font-size: 0.9rem; font-weight: 800; display: flex; align-items: center; gap: 12px;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12); font-family: 'Outfit', sans-serif;
  }
  .ud-loading { display: flex; align-items: center; justify-content: center; padding: 4rem; color: #64748b; font-size: 0.95rem; gap: 12px; font-weight: 700; }
  .ud-spinner { width: 24px; height: 24px; border: 3px solid rgba(124, 58, 237, 0.2); border-top-color: #db2777; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .ud-empty { text-align: center; padding: 4rem; color: #94a3b8; font-weight: 700; }
  .ud-empty .ico { font-size: 2.8rem; margin-bottom: 1rem; opacity: 0.6; }

  @media(max-width: 900px) {
    .ud-shell { grid-template-columns: 1fr; }
    .ud-side { display: none; }
    .ud-stats { grid-template-columns: repeat(2, 1fr); }
  }
`;

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="ud-toast">
      <span style={{ color:"#059669" }}>✓</span>{msg}
    </div>
  );
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
}

export default function UserDashboard() {
  const { state, dispatch } = useAuth();
  const navigate            = useNavigate();
  const user = state?.user || {};

  const [view,          setView]          = useState("shops");
  const [shops,         setShops]         = useState([]);
  const [myQueues,      setMyQueues]      = useState([]);
  const [cancelledList, setCancelledList] = useState([]);
  const [notifs,        setNotifs]        = useState([]);
  const [modal,         setModal]         = useState(null);
  const [toast,         setToast]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [filter,        setFilter]        = useState("All");
  const [loading,       setLoading]       = useState(true);
  const [socket,        setSocket]        = useState(null);
  const [now,           setNow]           = useState(Date.now());
  const [profileForm,   setProfileForm]   = useState({
    name: "",
    phone: "",
    smsNotifications: true,
    emailAlerts: true,
    pushNotifications: false,
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const notify = (msg) => setToast(msg);

  const openEditProfile = () => {
    setProfileForm({
      name: user.name || "",
      phone: user.phone || "",
      smsNotifications: user.smsNotifications ?? true,
      emailAlerts: user.emailAlerts ?? true,
      pushNotifications: user.pushNotifications ?? false,
    });
    setModal({ type: "editProfile" });
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!profileForm.name || profileForm.name.trim().length < 2) {
      notify("Name must be at least 2 characters");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.auth.updateMe(profileForm);
      dispatch({ type: "SET_USER", payload: res.user });
      notify("Profile updated successfully! ✨");
      setModal(null);
    } catch (err) {
      notify(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Live 1-second clock for acceptance countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getAcceptanceRemainingSeconds = useCallback((entry) => {
    if (!entry || !["ACCEPTED", "accepted"].includes(entry.status)) return 0;
    const acceptedTime = entry.acceptedAt
      ? new Date(entry.acceptedAt).getTime()
      : (entry.updatedAt ? new Date(entry.updatedAt).getTime() : new Date(entry.createdAt).getTime());
    const elapsed = Math.floor((now - acceptedTime) / 1000);
    const rem = 60 - elapsed;
    return rem > 0 ? rem : 0;
  }, [now]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
    navigate("/");
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [shopsRes, queueRes, notifRes] = await Promise.all([
        api.shops.list(),
        api.queue.myActive(),
        api.notifications.list(),
      ]);
      setShops(shopsRes.shops || []);
      const activeEntries = queueRes.entries || (queueRes.entry ? [queueRes.entry] : []);
      setMyQueues(activeEntries);
      setNotifs(notifRes.notifications || []);
    } catch (e) {
      notify(e.message || "Failed to load data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });
    setSocket(s);
    s.on("queue:yourTurn", ({ token: tok, shop }) => {
      notify(`🔔 Your turn! Token ${tok} is now serving at ${shop}`);
      loadData();
    });
    s.on("queue:accepted", ({ message }) => {
      notify(message || "Your queue request has been accepted by the shop owner.");
      loadData();
    });
    s.on("queue:updated",    () => loadData());
    s.on("queue:completed",  () => { loadData(); });
    s.on("queue:cancelled",  ({ entryId, token: tok }) => {
      if (tok || entryId) {
        setCancelledList(prev => {
          if (prev.some(p => p._id === entryId || (tok && p.token === tok))) return prev;
          return [{ _id: entryId, token: tok || "—", shopName: "Shop", status: "cancelled" }, ...prev];
        });
      }
      loadData();
    });
    s.on("queue:rejected",   ({ message }) => {
      notify(message || "Your queue request was rejected by the shop owner.");
      loadData();
    });
    s.on("shop:created",       () => loadData());
    s.on("shop:updated",       () => loadData());
    s.on("shop:deleted",       () => { loadData(); });
    s.on("shop:statusChanged", () => loadData());
    s.on("notification:new", ({ title }) => { notify(title); loadData(); });
    return () => s.disconnect();
  }, [loadData]);

  useEffect(() => {
    if (socket && myQueues.length > 0) {
      myQueues.forEach(q => {
        const sId = q.shop?._id || q.shop;
        if (sId) socket.emit("joinShopRoom", sId);
      });
    }
  }, [socket, myQueues]);

  const isShopActiveQueue = (sId) => {
    const activeStatuses = ["pending", "PENDING", "accepted", "ACCEPTED", "waiting", "serving"];
    return myQueues.some(q => {
      const qShopId = q.shop?._id ? String(q.shop._id) : String(q.shop || "");
      return qShopId === String(sId) && activeStatuses.includes(q.status);
    });
  };

  const joinQueue = async (shop) => {
    if (isShopActiveQueue(shop._id)) {
      notify("You are already in queue for this shop");
      return;
    }
    try {
      const res = await api.queue.join(shop._id);
      socket?.emit("joinShopRoom", shop._id);
      await loadData();
      setModal({ type:"token", shop, entry:res.entry, wait:res.estimatedWait });
      notify(`Joined queue at ${shop.name}`);
    } catch (e) { notify(e.message || "Failed to join queue"); }
  };

  const cancelQueue = async (entry) => {
    if (!entry?._id) return;
    if (["ACCEPTED", "accepted"].includes(entry.status)) {
      const rem = getAcceptanceRemainingSeconds(entry);
      if (rem <= 0) {
        notify("Cancellation window expired (allowed within 1 minute of acceptance).");
        return;
      }
    } else if (entry.status === "serving") {
      notify("Your turn is currently being served and cannot be cancelled.");
      return;
    }
    try {
      await api.queue.cancel(entry._id);
      setCancelledList(prev => [
        {
          _id: entry._id,
          token: entry.token,
          shopName: entry.shop?.name || "Shop",
          status: "cancelled",
          cancelledAt: new Date(),
        },
        ...prev.filter(p => p._id !== entry._id)
      ]);
      await loadData();
      notify(`Queue booking for ${entry.shop?.name || "shop"} cancelled`);
    } catch (e) {
      notify(e.message || "Failed to cancel");
      loadData();
    }
  };

  const CATS = ["All", "Banking", "Healthcare", "Government", "Other"];
  const filtered = shops.filter(s =>
    (filter === "All" || s.category === filter) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase()))
  );

  const unread = notifs.filter(n => n.unread).length;
  const initials = user.name?.split(" ").map(w => w[0]).slice(0,2).join("") || "RS";

  /* Sidebar */
  const Sidebar = () => (
    <aside className="ud-side">
      <div className="ud-s-sec">
        <div className="ud-s-lbl">Navigation</div>
        {[
          { key:"shops",         ico:"🏪", label:"Browse Shops" },
          { key:"notifications", ico:"🔔", label:"Notifications", badge: unread },
        ].map(item => (
          <div key={item.key} className={`ud-s-item ${view === item.key ? "on" : ""}`} onClick={() => setView(item.key)}>
            <span className="ud-s-icon">{item.ico}</span>
            {item.label}
            {item.badge > 0 && <span className="badge badge-pink" style={{ marginLeft:"auto" }}>{item.badge}</span>}
          </div>
        ))}
      </div>
      <div className="ud-s-sec">
        <div className="ud-s-lbl">Account</div>
        <div className={`ud-s-item ${view === "profile" ? "on" : ""}`} onClick={() => setView("profile")}>
          <span className="ud-s-icon">👤</span>Profile & Settings
        </div>
      </div>
      {myQueues.length > 0 && (
        <div className="ud-qmini">
          <div className="ud-qmini-lbl">Active Requests ({myQueues.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            {myQueues.slice(0, 3).map(q => (
              <div key={q._id} style={{ borderBottom: "1px solid rgba(16,185,129,0.2)", paddingBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="ud-qmini-tok" style={{ fontSize: "1rem" }}>{q.token}</span>
                  <span style={{
                    fontSize: "0.7rem",
                    color: ["ACCEPTED", "accepted"].includes(q.status) ? "#059669" : ["pending", "PENDING"].includes(q.status) ? "#d97706" : "#0284c7",
                    fontWeight: 800
                  }}>
                    {["ACCEPTED", "accepted"].includes(q.status) ? "Accepted" : ["pending", "PENDING"].includes(q.status) ? "Pending" : q.status}
                  </span>
                </div>
                <div className="ud-qmini-shop" style={{ fontSize: "0.78rem" }}>{q.shop?.name || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );

  /* Render Notifications */
  const renderNotifications = () => (
    <div>
      <div className="pg-title">Notifications</div>
      <div className="pg-sub">{unread} unread alerts from live queues</div>
      {notifs.length === 0 && (
        <div className="ud-empty"><div className="ico">🔔</div><p>No notifications yet</p></div>
      )}
      <div className="ud-notifs">
        {notifs.map(n => (
          <div key={n._id} className={`ud-notif ${n.unread ? "unread" : ""}`}>
            <div className="ud-nicon" style={{ background: n.bg || "rgba(124,58,237,0.12)", color: "#7c3aed" }}>{n.icon || "🔔"}</div>
            <div style={{ flex:1 }}>
              <div className="ud-ntitle">{n.title}</div>
              <div className="ud-ntime">{formatTime(n.createdAt)}</div>
            </div>
            {n.unread && <span className="badge badge-cyan">New</span>}
          </div>
        ))}
      </div>
    </div>
  );

  /* Render Profile */
  const renderProfile = () => (
    <div>
      <div className="pg-title">Profile Settings</div>
      <div className="pg-sub">Manage your account and preferences</div>
      <div className="ud-prof">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="ud-pavatar">{initials}</div>
            <div className="ud-pname">{user.name}</div>
            <div className="ud-prole">👤 Verified Customer <span className="badge badge-emerald">Active</span></div>
          </div>
          <button
            className="ud-sbtn p"
            style={{ padding: "8px 20px", width: "auto", flex: "none", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: 8 }}
            onClick={openEditProfile}
          >
            ✏️ Edit Profile
          </button>
        </div>
        <div className="ud-pgrid">
          {[
            ["Email",          user.email],
            ["Phone",          user.phone || "—"],
            ["Member Since",   user.memberSince ? new Date(user.memberSince).toLocaleDateString("en-IN", { month:"short", year:"numeric" }) : "—"],
            ["SMS Alerts",     user.smsNotifications ? "Enabled ✓" : "Disabled ✕"],
            ["Email Alerts",   user.emailAlerts ? "Enabled ✓" : "Disabled ✕"],
            ["Push Alerts",    user.pushNotifications ? "Enabled ✓" : "Disabled ✕"],
            ["Queues Joined",  user.queuesJoined  ?? 0],
            ["Wait Saved",     `${user.totalWaitSaved ?? 0} min`],
            ["Completed",      user.queuesCompleted ?? 0],
          ].map(([k, v]) => (
            <div key={k} className="ud-pfield">
              <div className="k">{k}</div>
              <div className="v">{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:"2rem", paddingTop:"1.25rem", borderTop:"1px solid #e2e8f0", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="ud-navbtn" style={{ padding:"10px 24px" }} onClick={handleSignOut}>Sign Out Account</button>
          <button className="ud-sbtn" style={{ padding: "10px 24px", width: "auto" }} onClick={openEditProfile}>✏️ Update Account Details</button>
        </div>
      </div>
    </div>
  );

  /* Render Shops & Dashboard */
  const renderShops = () => (
    <div>
      <div className="pg-title">Welcome back, {user.name?.split(" ")[0] || "User"} ✨</div>
      <div className="pg-sub">Explore active shops and join digital queues</div>

      <div className="ud-stats">
        {[
          { ico:"🎟", lbl:"Queues Joined", val:user.queuesJoined    ?? 0, bg:"rgba(124,58,237,0.12)" },
          { ico:"⏱",  lbl:"Wait Saved",   val:`${user.totalWaitSaved ?? 0}m`, bg:"rgba(2,132,199,0.12)" },
          { ico:"✅", lbl:"Completed",     val:user.queuesCompleted ?? 0, bg:"rgba(16,185,129,0.12)" },
          { ico:"❌", lbl:"Cancelled",     val:user.queuesCancelled ?? 0, bg:"rgba(245,158,11,0.12)" },
        ].map(s => (
          <div key={s.lbl} className="ud-scard">
            <div className="ud-sicon" style={{ background:s.bg }}>{s.ico}</div>
            <div className="ud-sval">{s.val}</div>
            <div className="ud-slbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Active & Cancelled Requests */}
      {(myQueues.length > 0 || cancelledList.length > 0) && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div className="sec-row" style={{ marginBottom: "1.2rem" }}>
            Active Shop Requests
            <span className="badge badge-cyan">{myQueues.length} Active</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {myQueues.map((q) => {
              const isPending = ["pending", "PENDING"].includes(q.status);
              const isAccepted = ["ACCEPTED", "accepted", "waiting"].includes(q.status);
              const isServing = q.status === "serving";
              const remSeconds = getAcceptanceRemainingSeconds(q);
              const isCancelable = isPending || (isAccepted && remSeconds > 0);
              const progressVal = Math.min(100, Math.max(0, 100 - ((q.estimatedWait || 0) / 30) * 100));

              return (
                <div key={q._id} className="ud-qcard" style={{ marginBottom: 0 }}>
                  <div className="ud-qh">
                    <div>
                      <div className="ud-qtitle" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        Shop Request
                        {isPending && (
                          <span className="badge badge-amber">⏳ Pending Approval</span>
                        )}
                        {isAccepted && (
                          <span className="badge badge-emerald">✅ Request Accepted</span>
                        )}
                        {isServing && (
                          <span className="badge badge-cyan">⚡ Now Serving</span>
                        )}
                        {isAccepted && remSeconds > 0 && (
                          <span className="badge badge-pink" style={{ fontSize: "0.75rem", fontWeight: 800 }}>
                            ⏱ Cancelable for {remSeconds}s
                          </span>
                        )}
                        {isAccepted && remSeconds <= 0 && (
                          <span className="badge" style={{ background: "rgba(100,116,139,0.15)", color: "#475569", fontSize: "0.72rem" }}>
                            🔒 Acceptance Locked
                          </span>
                        )}
                      </div>
                      <div className="ud-qshop">{q.shop?.name || "—"}</div>
                      {q.shop?.address && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 2 }}>
                          📍 {q.shop.address}
                        </div>
                      )}
                    </div>
                    <div className="ud-qtoken">{q.token}</div>
                  </div>

                  <div className="ud-qgrid">
                    <div>
                      <div className="ud-qstat-lbl">Position</div>
                      <div className="ud-qstat-val">#{q.position}</div>
                    </div>
                    <div>
                      <div className="ud-qstat-lbl">Est. Wait</div>
                      <div className="ud-qstat-val">{q.estimatedWait} min</div>
                    </div>
                    <div>
                      <div className="ud-qstat-lbl">Joined At</div>
                      <div className="ud-qstat-val" style={{ fontSize: "0.95rem" }}>
                        {formatTime(q.joinedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="ud-pulse-row">
                    <div className="ud-pdot" />
                    {isPending
                      ? "Awaiting shop owner acceptance..."
                      : isServing
                      ? "Your turn is now active! Please proceed to the counter."
                      : isAccepted && remSeconds > 0
                      ? `Accepted by shop. Can cancel within 1 minute (${remSeconds}s remaining)`
                      : isAccepted
                      ? "Accepted by shop. In line for service."
                      : "Live sync enabled via Socket.io"}
                  </div>

                  <div className="ud-pbar">
                    <div className="ud-pfill" style={{ width: `${progressVal}%` }} />
                  </div>

                  <div className="ud-qbtns">
                    <button
                      className="ud-qbtn ghost"
                      onClick={() => setModal({ type: "token", shop: q.shop, entry: q, wait: q.estimatedWait })}
                    >
                      📱 View QR Token
                    </button>
                    {isCancelable ? (
                      <button
                        className="ud-qbtn cancel"
                        onClick={() => setModal({ type: "cancelConfirmation", entry: q })}
                      >
                        Cancel Request {isAccepted && remSeconds > 0 ? `(${remSeconds}s)` : ""}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {/* Cancelled Requests: show only token number and status information */}
            {cancelledList.map((c) => (
              <div
                key={c._id || c.token}
                className="ud-qcard"
                style={{
                  marginBottom: 0,
                  background: "rgba(248, 250, 252, 0.9)",
                  border: "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: "0 4px 16px rgba(15, 23, 42, 0.03)",
                }}
              >
                <div className="ud-qh" style={{ marginBottom: 0 }}>
                  <div>
                    <div className="ud-qtitle" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="badge" style={{ background: "rgba(239, 68, 68, 0.12)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                        ❌ Request Cancelled
                      </span>
                    </div>
                    <div className="ud-qshop" style={{ color: "#475569", fontSize: "1.1rem" }}>
                      {c.shopName || "Shop"}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: 4, fontWeight: 700 }}>
                      Status: Cancelled
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Token Number
                    </div>
                    <div className="ud-qtoken" style={{ color: "#94a3b8", fontSize: "1.8rem" }}>
                      {c.token}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="sec-row">
        Available Shops
        <span className="badge badge-emerald">{shops.filter(s => s.status === "active").length} Open Now</span>
      </div>

      <div className="ud-search">
        <span className="ud-sico">🔍</span>
        <input placeholder="Search shops by name or category…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <span style={{ cursor:"pointer", color:"#94a3b8" }} onClick={() => setSearch("")}>✕</span>}
      </div>

      <div className="ud-filters">
        {CATS.map(c => (
          <button key={c} className={`ud-fpill ${filter === c ? "on" : ""}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>

      {loading
        ? <div className="ud-loading"><div className="ud-spinner" />Fetching live shops...</div>
        : filtered.length === 0
          ? <div className="ud-empty"><div className="ico">🔍</div><p>No shops found</p></div>
          : (
            <div className="ud-shops">
              {filtered.map(shop => (
                <div key={shop._id} className="ud-shop">
                  <div className="ud-shop-h">
                    <div>
                      <div className="ud-shop-n">{shop.name}</div>
                      <div className="ud-shop-c">{shop.category} · ⭐ {shop.rating?.toFixed(1) || "4.0"}</div>
                    </div>
                    <span className={`badge ${shop.status === "active" ? "badge-emerald" : "badge-amber"}`}>
                      {shop.status === "active" ? "Open" : "Paused"}
                    </span>
                  </div>
                  <div className="ud-shop-addr">📍 {shop.address}</div>
                  <div className="ud-shop-m">
                    <span className="ud-shop-mi">👥 <strong>{shop.queueLength}</strong> in line</span>
                    <span className="ud-shop-mi">⏱ ~<strong>{shop.avgWait}m wait</strong></span>
                  </div>
                  <div className="ud-shop-btns">
                    <button className="ud-sbtn p"
                      disabled={shop.status !== "active" || isShopActiveQueue(shop._id)}
                      onClick={() => joinQueue(shop)}>
                      {isShopActiveQueue(shop._id) ? "Already Queued" : "Join Queue →"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      <div>
        <nav className="ud-nav">
          <div className="ud-brand">
            <div className="ud-brand-icon">⚡</div>
            ALPHALine <span style={{ fontSize:"0.8rem", color:"#64748b", fontWeight:600 }}>/ Customer</span>
          </div>
          <div className="ud-nav-r">
            <div className="ud-live-pill"><div className="ud-live-d" />Live</div>
            <div className="ud-nbadge" onClick={() => setView("notifications")}>
              🔔 {unread > 0 && <div className="ud-bdot" />}
            </div>
            <div className="ud-avatar" onClick={() => setView("profile")}>{initials}</div>
            <button className="ud-navbtn" onClick={handleSignOut}>Sign Out</button>
          </div>
        </nav>

        <div className="ud-shell">
          <Sidebar />
          <main className="ud-main">
            {view === "notifications" && renderNotifications()}
            {view === "profile"       && renderProfile()}
            {view === "shops"         && renderShops()}
          </main>
        </div>

        {/* Token Modal */}
        {modal?.type === "token" && (
          <div className="ud-overlay" onClick={() => setModal(null)}>
            <div className="ud-modal" onClick={e => e.stopPropagation()}>
              <div className="ud-mtitle">Your Digital QR Token 🎟</div>
              <div className="ud-msub">{modal.shop?.name}</div>
              <div className="ud-qr-box">
                <div className="ud-mtoken">{modal.entry?.token}</div>
                <div className="ud-msub2">Show this code or scan QR at the counter</div>
                <div style={{ marginTop:"1.25rem" }}>
                  <img src={generateQR(modal.entry?.token)} alt="QR Code"
                    style={{ width:160, height:160, borderRadius:14, border:"1px solid #e2e8f0", background:"#fff", padding:8 }} />
                </div>
              </div>
              <div className="ud-mfooter">
                <button className="ud-mbtn" onClick={() => setModal(null)}>Close</button>
                <button className="ud-mbtn p" onClick={() => { notify("Token copied!"); setModal(null); }}>Copy Code</button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {modal?.type === "cancelConfirmation" && (
          <div className="ud-overlay" onClick={() => setModal(null)}>
            <div className="ud-modal" onClick={e => e.stopPropagation()}>
              <div className="ud-mtitle" style={{ color: "#dc2626" }}>Cancel Request? 🛑</div>
              <div className="ud-msub" style={{ marginTop: "1rem", lineHeight: "1.6" }}>
                {["ACCEPTED", "accepted"].includes(modal.entry?.status)
                  ? "Are you sure you want to cancel this accepted request? You can cancel within 1 minute of acceptance."
                  : `Are you sure you want to cancel your queue request for "${modal.entry?.shop?.name || "this shop"}"?`}
              </div>
              <div className="ud-mfooter">
                <button className="ud-mbtn" onClick={() => setModal(null)}>Keep Request</button>
                <button
                  className="ud-mbtn p"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}
                  onClick={() => {
                    const entryToCancel = modal.entry;
                    setModal(null);
                    cancelQueue(entryToCancel);
                  }}
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal */}
        {modal?.type === "editProfile" && (
          <div className="ud-overlay" onClick={() => setModal(null)}>
            <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <div className="ud-mtitle">Edit Profile ✏️</div>
                  <div className="ud-msub" style={{ marginBottom: 0 }}>Update your account details and preferences</div>
                </div>
                <button
                  style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94a3b8" }}
                  onClick={() => setModal(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProfile} style={{ marginTop: "1rem" }}>
                <div className="ud-fgroup">
                  <label className="ud-flabel">Full Name *</label>
                  <input
                    className="ud-finput"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Your Full Name"
                    required
                  />
                </div>

                <div className="ud-fgroup">
                  <label className="ud-flabel">Phone Number</label>
                  <input
                    className="ud-finput"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="ud-fgroup">
                  <label className="ud-flabel">Email Address (Read-Only)</label>
                  <input
                    className="ud-finput"
                    value={user.email || ""}
                    disabled
                    style={{ opacity: 0.65, cursor: "not-allowed", background: "#f1f5f9" }}
                  />
                </div>

                <div style={{ margin: "1.2rem 0 0.5rem" }}>
                  <label className="ud-flabel" style={{ marginBottom: 8 }}>Notifications & Alerts</label>
                  <div className="ud-chk-row">
                    <label htmlFor="smsNotifs">📱 SMS Status Alerts</label>
                    <input
                      id="smsNotifs"
                      type="checkbox"
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#7c3aed" }}
                      checked={profileForm.smsNotifications}
                      onChange={e => setProfileForm({ ...profileForm, smsNotifications: e.target.checked })}
                    />
                  </div>
                  <div className="ud-chk-row">
                    <label htmlFor="emailNotifs">📧 Email Queue Notifications</label>
                    <input
                      id="emailNotifs"
                      type="checkbox"
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#7c3aed" }}
                      checked={profileForm.emailAlerts}
                      onChange={e => setProfileForm({ ...profileForm, emailAlerts: e.target.checked })}
                    />
                  </div>
                  <div className="ud-chk-row" style={{ borderBottom: "none" }}>
                    <label htmlFor="pushNotifs">🔔 Live Push Notifications</label>
                    <input
                      id="pushNotifs"
                      type="checkbox"
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#7c3aed" }}
                      checked={profileForm.pushNotifications}
                      onChange={e => setProfileForm({ ...profileForm, pushNotifications: e.target.checked })}
                    />
                  </div>
                </div>

                <div className="ud-mfooter" style={{ marginTop: "1.5rem" }}>
                  <button type="button" className="ud-mbtn" onClick={() => setModal(null)} disabled={savingProfile}>
                    Cancel
                  </button>
                  <button type="submit" className="ud-mbtn p" disabled={savingProfile}>
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
