/**
 * FILE: src/App.jsx
 * Protected routes — unauthenticated users are redirected to login.
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Protected route — redirects to / if not authenticated
function Protected({ element, role }) {
  const { state } = useAuth();
  if (state.loading) {
    return (
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        height: "100vh", background: "#080912", color: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{
          textAlign: "center",
          padding: "32px 48px",
          background: "rgba(15, 16, 33, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "24px",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.6)"
        }}>
          <div style={{
            width: 48, height: 48,
            border: "4px solid rgba(139, 92, 246, 0.15)",
            borderTop: "4px solid #ffffffff",
            borderRight: "4px solid #7439ffff",
            borderRadius: "50%",
            animation: "spin 0.9s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite",
            margin: "0 auto 20px"
          }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#f8fafc", letterSpacing: 0.5 }}>Syncing Session...</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Connecting to ALPHALine server</div>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }
  if (!state.isAuthenticated) return <Navigate to="/" replace />;
  if (role && state.role !== role) return <Navigate to="/" replace />;
  return element;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Protected element={<UserDashboard />} role="user" />} />
        <Route path="/admin" element={<Protected element={<AdminDashboard />} role="admin" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
