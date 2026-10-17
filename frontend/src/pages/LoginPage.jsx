/**
 * FILE: src/pages/LoginPage.jsx
 * DESIGN: Gen-Z Luminous White Gradient & Glassmorphic Landing & Auth Suite
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { tokenStore } from "../services/api";

const queueData = [
  { id: 1, name: "Arjun Mehta", token: "Q-001", position: 1, wait: "Now serving", status: "active" },
  { id: 2, name: "Priya Sharma", token: "Q-002", position: 2, wait: "~5 min", status: "waiting" },
  { id: 3, name: "Rohan Das", token: "Q-003", position: 3, wait: "~10 min", status: "waiting" },
  { id: 4, name: "Sneha Patel", token: "Q-004", position: 4, wait: "~15 min", status: "waiting" },
  { id: 5, name: "Vikram Nair", token: "Q-005", position: 5, wait: "~20 min", status: "waiting" },
  { id: 6, name: "Ananya Roy", token: "Q-006", position: 6, wait: "~25 min", status: "waiting" },
];

const features = [
  { icon: "⚡", title: "Real-time Updates", desc: "Instant queue sync powered by Socket.io. Zero manual page refreshing required." },
  { icon: "🤖", title: "Queue Automation", desc: "Smart token distribution, auto-estimated wait calculations, and seamless calling." },
  { icon: "🛡️", title: "Owner Dashboard", desc: "Full management suite for shop owners to control customer flow effortlessly." },
  { icon: "📱", title: "QR Verification", desc: "Unique QR token generated instantly for touchless check-ins." },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  /* ─── FRONT PAGE GLOBAL THIN FONT OVERRIDE ─── */
  .lp-page, .lp-page *, .lp-page button, .lp-page input, .lp-page label, .lp-page h1, .lp-page h2, .lp-page h3, .lp-page h4, .lp-page span, .lp-page p, .lp-page div, .lp-page a {
    font-weight: 300 !important;
  }

  /* ─── NAV ─── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    padding: 0 2.5rem; height: 72px;
    display: flex; align-items: center; justify-content: space-between;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .lp-nav-left { flex: 1; display: flex; align-items: center; }
  .lp-nav-center { display: flex; gap: 8px; align-items: center; justify-content: center; }
  .lp-nav-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; }
  .lp-nav.scrolled {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  }
  .lp-brand { display: flex; align-items: center; gap: 12px; }
  .lp-brand-icon {
    width: 38px; height: 38px; border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; color: #fff; font-weight: 300;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
    font-family: 'Outfit', sans-serif;
  }
  .lp-brand-name {
    font-family: 'Outfit', sans-serif;
    font-weight: 300; font-size: 1.4rem; color: #0f172a; letter-spacing: 3.5px;
    background: linear-gradient(135deg, #0f172a, #475569);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .lp-nav-links { display: flex; gap: 8px; align-items: center; }
  .lp-nav-btn {
    background: transparent; border: 1px solid transparent;
    color: #475569; padding: 8px 22px; border-radius: 30px;
    cursor: pointer; font-size: 0.92rem; font-weight: 300;
    font-family: 'Outfit', sans-serif; transition: all 0.25s ease;
  }
  .lp-nav-btn:hover { color: #0f172a; border-color: rgba(226, 232, 240, 0.8); background: rgba(255, 255, 255, 0.8); }
  .lp-nav-btn.active { color: #7c3aed; border-color: rgba(124, 58, 237, 0.3); background: rgba(124, 58, 237, 0.1); }

  /* ─── HERO SECTION ─── */
  .lp-hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
    position: relative;
    overflow: hidden;
    padding: 100px 0 60px;
  }

  .lp-hero-left {
    padding: 0 3rem 0 5rem;
    position: relative; z-index: 2;
  }
  .lp-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.75rem; font-weight: 300; letter-spacing: 2px;
    text-transform: uppercase; color: #0284c7;
    background: rgba(2, 132, 199, 0.1);
    border: 1px solid rgba(2, 132, 199, 0.25);
    padding: 6px 16px; border-radius: 30px;
    margin-bottom: 24px;
  }
  .lp-h1 {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(44px, 5.2vw, 76px);
    font-weight: 300;
    line-height: 1.05;
    letter-spacing: -1px;
    color: #0f172a;
    margin-bottom: 24px;
  }
  .lp-h1 span {
    background: linear-gradient(135deg, #7c3aed, #db2777, #0284c7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .lp-hero-desc {
    color: #475569;
    font-size: 1.1rem;
    line-height: 1.7;
    max-width: 450px;
    font-weight: 300;
    margin-bottom: 40px;
  }
  .lp-hero-stats {
    display: flex; gap: 32px;
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.9);
    padding: 18px 28px; border-radius: 20px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    width: fit-content;
  }
  .lp-stat-num {
    font-family: 'Outfit', sans-serif;
    font-size: 1.8rem; font-weight: 300; color: #0f172a;
    line-height: 1;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .lp-stat-lbl {
    font-size: 0.78rem; color: #64748b;
    font-weight: 300; margin-top: 4px; letter-spacing: 0.02em;
  }
  .lp-stat-divider { width: 1px; background: #e2e8f0; align-self: stretch; }

  /* Right — form card */
  .lp-hero-right {
    display: flex; align-items: center; justify-content: center;
    padding: 0 5rem 0 2rem;
    position: relative; z-index: 2;
  }
  .lp-card {
    width: 100%; max-width: 440px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 24px;
    padding: 2.5rem 2.25rem;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08), inset 0 1px 0 #ffffff;
    position: relative;
  }
  .lp-card-title {
    font-family: 'Outfit', sans-serif;
    font-size: 1.6rem; font-weight: 300; color: #0f172a;
    margin-bottom: 6px;
  }
  .lp-card-sub {
    font-size: 0.88rem; color: #64748b;
    font-weight: 300; margin-bottom: 28px;
  }

  /* Tabs */
  .lp-tabs {
    display: flex; background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 30px; padding: 4px; margin-bottom: 24px;
  }
  .lp-tab {
    flex: 1; padding: 10px 0; border-radius: 25px; border: none; cursor: pointer;
    font-size: 0.88rem; font-weight: 300; font-family: 'Outfit', sans-serif;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); background: transparent;
    color: #64748b; letter-spacing: 0.02em;
  }
  .lp-tab.active {
    background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
  }

  /* Role */
  .lp-role-label {
    font-size: 0.72rem; font-weight: 300; letter-spacing: 1.5px;
    text-transform: uppercase; color: #64748b;
    display: block; margin-bottom: 10px;
  }
  .lp-role-btns { display: flex; gap: 10px; margin-bottom: 22px; }
  .lp-role-btn {
    flex: 1; padding: 11px; border-radius: 14px; cursor: pointer;
    font-size: 0.9rem; font-weight: 300; font-family: 'Outfit', sans-serif;
    transition: all 0.25s ease; border: 1px solid #e2e8f0;
    background: #ffffff; color: #64748b;
  }
  .lp-role-btn.active {
    background: rgba(124, 58, 237, 0.1); border-color: rgba(124, 58, 237, 0.4);
    color: #7c3aed; box-shadow: 0 2px 10px rgba(124, 58, 237, 0.15);
  }

  /* Fields */
  .lp-field-wrap { margin-bottom: 16px; }
  .lp-field-label {
    display: block; font-size: 0.72rem; font-weight: 300;
    letter-spacing: 1px; text-transform: uppercase;
    color: #64748b; margin-bottom: 8px;
  }
  .lp-field-inner { position: relative; }
  .lp-field-icon {
    position: absolute; left: 14px; top: 50%;
    transform: translateY(-50%); font-size: 16px; pointer-events: none;
    opacity: 0.6;
  }
  .lp-field {
    width: 100%; padding: 13px 14px 13px 42px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px; color: #0f172a;
    font-size: 0.92rem; font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; transition: all 0.25s; box-sizing: border-box;
    font-weight: 300; shadow: var(--shadow-sm);
  }
  .lp-field:focus {
    border-color: #7c3aed;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }
  .lp-field::placeholder { color: #94a3b8; }

  /* Error */
  .lp-error {
    color: #dc2626; font-size: 0.85rem; font-weight: 300;
    text-align: center; margin-bottom: 16px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px; padding: 10px 14px;
  }

  /* Submit */
  .lp-submit {
    width: 100%; padding: 14px 0; border-radius: 30px; border: none;
    cursor: pointer; margin-top: 8px;
    background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff;
    font-size: 0.95rem; font-weight: 300;
    font-family: 'Outfit', sans-serif;
    letter-spacing: 0.5px; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.35);
  }
  .lp-submit:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 12px 32px rgba(219, 39, 119, 0.45);
  }
  .lp-submit:active:not(:disabled) { transform: translateY(0); }
  .lp-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .lp-switch-text {
    text-align: center; margin-top: 18px;
    font-size: 0.85rem; color: #64748b; font-weight: 300;
  }
  .lp-switch-link {
    color: #7c3aed; cursor: pointer; font-weight: 300;
    text-decoration: underline; text-underline-offset: 3px; transition: color 0.2s;
  }
  .lp-switch-link:hover { color: #db2777; }

  /* Scroll hint */
  .lp-scroll-hint {
    position: absolute; bottom: 28px; left: 50%;
    transform: translateX(-50%);
    z-index: 2; cursor: pointer;
  }
  .lp-scroll-mouse {
    width: 28px; height: 44px; border: 2px solid #cbd5e1;
    border-radius: 14px; display: flex; align-items: flex-start;
    justify-content: center; padding: 7px;
    transition: all 0.3s ease; background: #ffffff;
  }
  .lp-scroll-mouse:hover { border-color: #7c3aed; box-shadow: 0 0 15px rgba(124, 58, 237, 0.3); }
  .lp-scroll-dot {
    width: 4px; height: 8px; background: #7c3aed;
    border-radius: 2px; animation: scrollDot 1.6s ease-in-out infinite;
  }
  @keyframes scrollDot { 0%{transform:translateY(0);opacity:1} 100%{transform:translateY(14px);opacity:0} }

  /* ─── TICKER STRIP ─── */
  .lp-ticker {
    background: linear-gradient(90deg, #7c3aed, #db2777); color: #fff; overflow: hidden;
    padding: 14px 0; position: relative; z-index: 2;
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.25);
  }
  .lp-ticker-track {
    display: flex; gap: 0; width: max-content;
    animation: marquee 20s linear infinite;
  }
  .lp-ticker-item {
    display: flex; align-items: center; gap: 12px; padding: 0 32px;
    font-size: 0.82rem; font-weight: 300; letter-spacing: 1.5px;
    text-transform: uppercase; white-space: nowrap; font-family: 'Outfit', sans-serif;
  }
  .lp-ticker-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: 0.8; }
  @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }

  /* ─── QUEUE SECTION ─── */
  .lp-queue-section {
    min-height: 100vh; padding: 100px 5rem 80px;
    position: relative; overflow: hidden;
  }
  .lp-section-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 2; }
  .lp-section-header { margin-bottom: 56px; }
  .lp-live-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 0.75rem; font-weight: 300; letter-spacing: 1.5px;
    text-transform: uppercase; color: #059669;
    background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 30px; padding: 6px 16px; margin-bottom: 16px;
  }
  .lp-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #059669; animation: pulseGlow 1.8s infinite;
  }
  .lp-sec-title {
    font-family: 'Outfit', sans-serif;
    font-size: clamp(32px, 4vw, 52px); font-weight: 300;
    letter-spacing: -1px; color: #0f172a;
    line-height: 1.1; margin-bottom: 12px;
  }
  .lp-sec-sub { color: #64748b; font-size: 1rem; font-weight: 300; }

  /* Stats row */
  .lp-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 48px; }
  .lp-stat-card {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; padding: 22px 24px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    transition: all 0.3s ease; cursor: default;
  }
  .lp-stat-card:hover { transform: translateY(-4px); border-color: rgba(124, 58, 237, 0.4); box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12); }
  .lp-stat-ico { font-size: 1.4rem; margin-bottom: 10px; }
  .lp-stat-val { font-family: 'Outfit', sans-serif; font-size: 1.8rem; font-weight: 300; color: #0f172a; margin-bottom: 2px; }
  .lp-stat-lbl2 { font-size: 0.8rem; color: #64748b; font-weight: 300; }

  /* Queue cards */
  .lp-queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 20px; }
  .lp-qcard {
    padding: 22px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
    position: relative; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .lp-qcard:hover { transform: translateY(-4px); border-color: rgba(124, 58, 237, 0.35); box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12); }
  .lp-qcard.active { border-color: rgba(16, 185, 129, 0.5); background: rgba(255, 255, 255, 0.95); box-shadow: 0 0 25px rgba(16, 185, 129, 0.2); }
  .lp-qcard-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
  .lp-qcard-avatar {
    width: 42px; height: 42px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; font-weight: 300; color: #fff;
    background: linear-gradient(135deg, #7c3aed, #db2777);
    font-family: 'Outfit', sans-serif;
  }
  .lp-qcard-name { font-size: 0.95rem; font-weight: 300; color: #0f172a; margin-bottom: 2px; }
  .lp-qcard-token { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #0284c7; font-weight: 300; }
  .lp-qcard-data { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .lp-qcard-stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; }
  .lp-qcard-stat-lbl { font-size: 0.68rem; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 300; }
  .lp-qcard-stat-val { font-size: 1.05rem; font-weight: 300; color: #0f172a; font-family: 'Outfit', sans-serif; }

  /* ─── ABOUT SECTION ─── */
  .lp-about-section {
    min-height: 100vh; padding: 100px 5rem 80px;
    position: relative; overflow: hidden;
  }
  .lp-about-inner { max-width: 1040px; margin: 0 auto; position: relative; z-index: 2; }

  .lp-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 64px; }
  .lp-step {
    padding: 24px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px; position: relative;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); transition: all 0.3s ease;
  }
  .lp-step:hover { transform: translateY(-4px); border-color: rgba(219, 39, 119, 0.4); box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12); }
  .lp-step-num {
    font-family: 'JetBrains Mono', monospace; font-size: 0.78rem;
    font-weight: 300; color: #db2777;
    letter-spacing: 1px; margin-bottom: 14px;
  }
  .lp-step-title { font-size: 1rem; font-weight: 300; color: #0f172a; margin-bottom: 8px; font-family: 'Outfit', sans-serif; }
  .lp-step-desc { font-size: 0.88rem; color: #64748b; line-height: 1.6; font-weight: 300; }

  .lp-features-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 20px; margin-bottom: 64px;
  }
  .lp-feat-card {
    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 20px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); padding: 30px; transition: all 0.3s ease;
  }
  .lp-feat-card:hover { transform: translateY(-4px); border-color: rgba(2, 132, 199, 0.4); box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12); }
  .lp-feat-icon { font-size: 1.8rem; margin-bottom: 16px; }
  .lp-feat-title { font-size: 1.15rem; font-weight: 300; color: #0f172a; margin-bottom: 8px; font-family: 'Outfit', sans-serif; }
  .lp-feat-desc { font-size: 0.92rem; color: #64748b; line-height: 1.65; font-weight: 300; }

  .lp-tech-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 64px; }
  .lp-tech-pill {
    border-radius: 30px; padding: 8px 20px;
    font-size: 0.85rem; font-weight: 300; letter-spacing: 0.5px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #7c3aed; transition: all 0.25s ease; cursor: default;
    font-family: 'JetBrains Mono', monospace; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  }
  .lp-tech-pill:hover { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; border-color: transparent; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3); }

  /* Footer */
  .lp-footer {
    background: rgba(255, 255, 255, 0.9); border-top: 1px solid #e2e8f0;
    padding: 32px 5rem; display: flex; align-items: center; justify-content: space-between;
    position: relative; z-index: 10;
  }
  .lp-footer-txt { font-size: 0.88rem; color: #64748b; font-weight: 300; }

  @media(max-width: 960px) {
    .lp-hero { grid-template-columns: 1fr; padding-bottom: 40px; }
    .lp-hero-left { padding: 0 2rem; text-align: center; margin-bottom: 3rem; }
    .lp-hero-desc { margin: 0 auto 36px; }
    .lp-hero-stats { margin: 0 auto; justify-content: center; }
    .lp-hero-right { padding: 0 1.5rem; }
    .lp-queue-section, .lp-about-section { padding: 80px 1.5rem; }
    .lp-stats-row { grid-template-columns: 1fr 1fr; }
    .lp-steps { grid-template-columns: 1fr 1fr; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-footer { flex-direction: column; gap: 12px; text-align: center; padding: 24px 1.5rem; }
  }
`;

function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function AnimateIn({ children, delay = 0, direction = "up", className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const tr = { up: "translateY(32px)", left: "translateX(-32px)", right: "translateX(32px)" };
  return (
    <div ref={ref} className={className} style={{
      transition: `opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : (tr[direction] || tr.up),
    }}>
      {children}
    </div>
  );
}

export default function LoginPage() {
  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [role, setRole] = useState("user");
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("login");
  const [liveCount, setLiveCount] = useState(6);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const loginRef = useRef(null);
  const queueRef = useRef(null);
  const aboutRef = useRef(null);

  useEffect(() => { setAuthErr(""); }, [activeTab, role]);

  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 40);
      const secs = [
        { id: "login", ref: loginRef },
        { id: "queue", ref: queueRef },
        { id: "about", ref: aboutRef },
      ];
      for (const s of secs) {
        if (s.ref.current) {
          const r = s.ref.current.getBoundingClientRect();
          if (r.top <= 120 && r.bottom > 120) { setActiveSection(s.id); break; }
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLiveCount(c => c === 6 ? 7 : c === 7 ? 5 : 6), 4000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth" });

  const handleLogin = async () => {
    if (!email || !password) { setAuthErr("Please enter your email and password."); return; }
    setAuthErr(""); setAuthLoading(true);
    try {
      const user = await dispatch({ type: "LOGIN", payload: { email, password, role } });
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setAuthErr(err.message || "Login failed. Check your credentials.");
    } finally { setAuthLoading(false); }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) { setAuthErr("Name, email and password are required."); return; }
    setAuthErr(""); setAuthLoading(true);
    try {
      const { token, user } = await api.auth.register({ name, email, phone, password, role });
      tokenStore.set(token);
      dispatch({ type: "SET_USER", payload: user });
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setAuthErr(err.message || "Registration failed.");
    } finally { setAuthLoading(false); }
  };

  const navLinks = [
    { label: "Sign In", id: "login", ref: loginRef },
    { label: "Live Feed", id: "queue", ref: queueRef },
    { label: "About", id: "about", ref: aboutRef },
  ];

  const tickerItems = [
    "Smart Queue Management", "Zero Wait Times", "Real-Time Tracking",
    "QR Token System", "500+ Shops Onboarded", "Socket.io Powered",
  ];

  return (
    <div className="lp-page">
      <style>{css}</style>

      {/* Ambient Orbs */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* ── NAV ── */}
      <nav className={`lp-nav ${navScrolled ? "scrolled" : ""}`}>
        <div className="lp-nav-left">
          <div className="lp-brand">
            <div className="lp-brand-icon">Q</div>
            <span className="lp-brand-name">ALPHALine</span>
          </div>
        </div>
        <div className="lp-nav-center">
          {navLinks.map(l => (
            <button key={l.id} className={`lp-nav-btn ${activeSection === l.id ? "active" : ""}`}
              onClick={() => scrollTo(l.ref)}>{l.label}</button>
          ))}
        </div>
        <div className="lp-nav-right">
          <button className="btn btn-primary" style={{ padding: "9px 22px", fontSize: "0.88rem" }} onClick={() => scrollTo(loginRef)}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section ref={loginRef} className="lp-hero">
        {/* Left copy */}
        <div className="lp-hero-left">
          <AnimateIn direction="up" delay={0}>
            <div className="lp-eyebrow">
              ⚡ Next-Gen Queue System
            </div>
            <h1 className="lp-h1">
              Skip lines.<br /><span>Elevate your vibe.</span>
            </h1>
            <p className="lp-hero-desc">
              Join shop queues digitally from your phone. Receive live position updates, instant notifications, and walk in right when it's your turn.
            </p>
            <div className="lp-hero-stats">
              <div>
                <div className="lp-stat-num">500+</div>
                <div className="lp-stat-lbl">Active Shops</div>
              </div>
              <div className="lp-stat-divider" />
              <div>
                <div className="lp-stat-num">12k+</div>
                <div className="lp-stat-lbl">Queues Served</div>
              </div>
              <div className="lp-stat-divider" />
              <div>
                <div className="lp-stat-num">4.9★</div>
                <div className="lp-stat-lbl">User Rating</div>
              </div>
            </div>
          </AnimateIn>
        </div>

        {/* Right form card */}
        <div className="lp-hero-right">
          <AnimateIn direction="up" delay={120}>
            <div className="lp-card">
              <div className="lp-card-title">
                {activeTab === "login" ? "Welcome Back " : "Create Account ✨"}
              </div>
              <div className="lp-card-sub">
                {activeTab === "login"
                  ? "Sign in to view your active queues and tickets"
                  : "Join ALPHALine in under 30 seconds"}
              </div>

              {/* Tabs */}
              <div className="lp-tabs">
                {["login", "register"].map(t => (
                  <button key={t} className={`lp-tab ${activeTab === t ? "active" : ""}`}
                    onClick={() => setActiveTab(t)}>
                    {t === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>

              {/* Role selector */}
              <label className="lp-role-label">Select Account Type</label>
              <div className="lp-role-btns">
                {["user", "admin"].map(r => (
                  <button key={r} className={`lp-role-btn ${role === r ? "active" : ""}`}
                    onClick={() => setRole(r)}>
                    {r === "user" ? "👤 Customer" : "🛡️ Shop Owner"}
                  </button>
                ))}
              </div>

              {/* Input fields */}
              {activeTab === "register" && (
                <div className="lp-field-wrap">
                  <label className="lp-field-label">Full Name</label>
                  <div className="lp-field-inner">
                    <span className="lp-field-icon">👤</span>
                    <input className="lp-field" type="text" placeholder="Arjun Mehta"
                      value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="lp-field-wrap">
                <label className="lp-field-label">Email Address</label>
                <div className="lp-field-inner">
                  <span className="lp-field-icon">✉️</span>
                  <input className="lp-field" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {activeTab === "register" && (
                <div className="lp-field-wrap">
                  <label className="lp-field-label">Phone Number</label>
                  <div className="lp-field-inner">
                    <span className="lp-field-icon">📱</span>
                    <input className="lp-field" type="tel" placeholder="+91 98765 43210"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="lp-field-wrap">
                <label className="lp-field-label">Password</label>
                <div className="lp-field-inner">
                  <span className="lp-field-icon">🔒</span>
                  <input className="lp-field" type="password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (activeTab === "login" ? handleLogin() : handleRegister())} />
                </div>
              </div>

              {authErr && <div className="lp-error">{authErr}</div>}

              <button className="lp-submit" disabled={authLoading}
                onClick={activeTab === "login" ? handleLogin : handleRegister}>
                {authLoading
                  ? "Processing..."
                  : activeTab === "login" ? "Sign In →" : "Create Account →"}
              </button>

              {activeTab === "login" && (
                <p className="lp-switch-text">
                  New to ALPHALine?{" "}
                  <span className="lp-switch-link" onClick={() => setActiveTab("register")}>Create an account</span>
                </p>
              )}
            </div>
          </AnimateIn>
        </div>

        {/* Scroll hint */}
        <div className="lp-scroll-hint" onClick={() => scrollTo(queueRef)}>
          <div className="lp-scroll-mouse">
            <div className="lp-scroll-dot" />
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="lp-ticker">
        <div className="lp-ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <div key={i} className="lp-ticker-item">
              {t}<span className="lp-ticker-dot" />
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE QUEUE ── */}
      <section ref={queueRef} className="lp-queue-section">
        <div className="lp-section-inner">
          <AnimateIn direction="up">
            <div className="lp-section-header">
              <div className="lp-live-badge">
                <span className="lp-live-dot" />
                Live Socket Feed
              </div>
              <h2 className="lp-sec-title">Real-Time Queue Feed</h2>
              <p className="lp-sec-sub">{liveCount} customers currently in live queues · Avg response time ~5 min</p>
            </div>
          </AnimateIn>

          <AnimateIn direction="up" delay={80}>
            <div className="lp-stats-row">
              {[
                { ico: "👥", val: liveCount, lbl: "Active In Line" },
                { ico: "⏱️", val: "5 min", lbl: "Average Wait" },
                { ico: "✅", val: "142", lbl: "Served Today" },
                { ico: "⚡", val: "Optimal", lbl: "Queue Velocity" },
              ].map((s, i) => (
                <div key={i} className="lp-stat-card">
                  <div className="lp-stat-ico">{s.ico}</div>
                  <div className="lp-stat-val">{s.val}</div>
                  <div className="lp-stat-lbl2">{s.lbl}</div>
                </div>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn direction="up" delay={140}>
            <div className="lp-queue-grid">
              {queueData.map(u => {
                const isActive = u.status === "active";
                return (
                  <div key={u.id} className={`lp-qcard ${isActive ? "active" : ""}`}>
                    <div className="lp-qcard-head">
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div className="lp-qcard-avatar">
                          {u.name[0]}
                        </div>
                        <div>
                          <div className="lp-qcard-name">{u.name}</div>
                          <div className="lp-qcard-token">{u.token}</div>
                        </div>
                      </div>
                      <span className={`badge ${isActive ? "badge-emerald" : "badge-violet"}`}>
                        {isActive ? "Now Serving" : "In Line"}
                      </span>
                    </div>
                    <div className="lp-qcard-data">
                      <div className="lp-qcard-stat">
                        <div className="lp-qcard-stat-lbl">Position</div>
                        <div className="lp-qcard-stat-val">#{u.position}</div>
                      </div>
                      <div className="lp-qcard-stat">
                        <div className="lp-qcard-stat-lbl">Wait Time</div>
                        <div className="lp-qcard-stat-val" style={{ color: isActive ? "#059669" : "#0f172a" }}>{u.wait}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section ref={aboutRef} className="lp-about-section">
        <div className="lp-about-inner">
          <AnimateIn direction="up">
            <div className="lp-section-header">
              <div className="lp-eyebrow">System Architecture</div>
              <h2 className="lp-sec-title">How ALPHALine Works</h2>
              <p className="lp-sec-sub">Seamless digital queue management engineered for customers and merchants.</p>
            </div>
          </AnimateIn>

          <AnimateIn direction="up" delay={80}>
            <div className="lp-steps">
              {[
                { step: "STEP 01", title: "Browse & Join", desc: "Explore participating shops and join the line digitally from anywhere." },
                { step: "STEP 02", title: "Get Live QR", desc: "Instant QR ticket generated with live position and wait estimate." },
                { step: "STEP 03", title: "Socket Updates", desc: "Receive instant push alerts and socket calls when your turn nears." },
                { step: "STEP 04", title: "Touchless Entry", desc: "Scan QR code at the counter and walk straight in with zero delay." },
              ].map((s, i) => (
                <div key={i} className="lp-step">
                  <div className="lp-step-num">{s.step}</div>
                  <div className="lp-step-title">{s.title}</div>
                  <div className="lp-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn direction="up" delay={120}>
            <div className="lp-features-grid">
              {features.map((f, i) => (
                <div key={i} className="lp-feat-card">
                  <div className="lp-feat-icon">{f.icon}</div>
                  <h4 className="lp-feat-title">{f.title}</h4>
                  <p className="lp-feat-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn direction="up" delay={160}>
            <div className="lp-tech-row">
              {["React 19", "Vite", "Node.js", "MongoDB Atlas", "Socket.io", "JWT Security", "Express.js"].map((t, i) => (
                <div key={i} className="lp-tech-pill">{t}</div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <span className="lp-footer-txt">© 2025 ALPHALine · Next-Gen Queue Management System</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 300 }}>ALPHALine</span>
        </div>
      </footer>
    </div>
  );
}
