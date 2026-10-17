/**
 * FILE: src/pages/LoginPage.jsx  — handleLogin diff only
 *
 * Replace the existing handleLogin() in your LoginPage.jsx with this version.
 * Everything else (UI, animations, sections) stays 100% unchanged.
 *
 * Changes:
 *  • Reads actual email/password from controlled inputs (add state for these)
 *  • Calls dispatch({ type:"LOGIN", payload:{ email, password, role } })
 *  • Shows error toast if login fails
 *  • Handles register tab with api.auth.register()
 */

// ── Add these state hooks next to existing ones in LoginPage() ─────────────────
//
//   const [email,    setEmail]    = useState("");
//   const [password, setPassword] = useState("");
//   const [name,     setName]     = useState("");   // register only
//   const [phone,    setPhone]    = useState("");   // register only
//   const [authErr,  setAuthErr]  = useState("");
//   const [authLoading, setAuthLoading] = useState(false);
//
// ── Replace InputField usages in JSX ──────────────────────────────────────────
//
//   <InputField label="Email Address" placeholder="you@email.com" icon="✉️"
//     value={email} onChange={e => setEmail(e.target.value)} />
//   <InputField label="Password" placeholder="••••••••" icon="🔒" type="password"
//     value={password} onChange={e => setPassword(e.target.value)} />
//
//   {activeTab === "register" && <>
//     <InputField label="Full Name" placeholder="Arjun Mehta" icon="👤"
//       value={name} onChange={e => setName(e.target.value)} />
//     <InputField label="Phone Number" placeholder="+91 98765 43210" icon="📱"
//       value={phone} onChange={e => setPhone(e.target.value)} />
//   </>}
//
// ── Also update InputField to accept value/onChange ───────────────────────────
//
// function InputField({ label, placeholder, icon, type = "text", value, onChange }) {
//   return (
//     <div style={{ marginBottom: 16 }}>
//       <label ...>{label}</label>
//       <div style={{ position: "relative" }}>
//         <span ...>{icon}</span>
//         <input type={type} placeholder={placeholder} value={value} onChange={onChange}
//           style={{ ... }} ... />
//       </div>
//     </div>
//   );
// }

// ── NEW handleLogin ────────────────────────────────────────────────────────────

import api from "../services/api"; // add this import at top of LoginPage.jsx

// Replace handleLogin with:
const handleLogin = async () => {
  if (!email || !password) {
    setAuthErr("Please enter your email and password.");
    return;
  }
  setAuthErr("");
  setAuthLoading(true);
  try {
    const user = await dispatch({ type: "LOGIN", payload: { email, password, role } });
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  } catch (err) {
    setAuthErr(err.message || "Login failed. Check your credentials.");
  } finally {
    setAuthLoading(false);
  }
};

// ── NEW handleRegister ─────────────────────────────────────────────────────────
const handleRegister = async () => {
  if (!name || !email || !password) {
    setAuthErr("Name, email and password are required.");
    return;
  }
  setAuthErr("");
  setAuthLoading(true);
  try {
    const { token, user } = await api.auth.register({ name, email, phone, password, role });
    // AuthContext stores token automatically on LOGIN, but register returns one too
    const { tokenStore } = await import("../services/api");
    tokenStore.set(token);
    dispatch({ type: "SET_USER", payload: user }); // bypass LOGIN action (already registered)
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
  } catch (err) {
    setAuthErr(err.message || "Registration failed.");
  } finally {
    setAuthLoading(false);
  }
};

// ── In JSX: wire button onClick ───────────────────────────────────────────────
// <button onClick={activeTab === "login" ? handleLogin : handleRegister} disabled={authLoading}>
//   {authLoading ? "Please wait…" : activeTab === "login" ? "Sign In →" : "Create Account →"}
// </button>
//
// Show error (place just before the button):
// {authErr && (
//   <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{authErr}</p>
// )}
