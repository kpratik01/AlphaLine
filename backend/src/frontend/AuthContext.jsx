/**
 * FILE: src/context/AuthContext.jsx
 *
 * Drop-in replacement for any stub AuthContext already in the project.
 * Wraps the app with real JWT-backed auth via the QueueLess backend.
 *
 * ── What changed vs the mock version ─────────────────────────────────────────
 *  • LOGIN action: calls api.auth.login(), stores JWT in localStorage
 *  • LOGOUT action: removes JWT, clears state
 *  • On mount: reads stored token → api.auth.me() to rehydrate session
 *  • dispatch({ type: "LOGIN", payload: { email, password, role } }) ← LoginPage
 *    now expects credentials, not a pre-built user object
 *
 * ── Usage (unchanged in all three dashboards) ─────────────────────────────────
 *   const { state, dispatch } = useAuth();
 *   state.user       → logged-in user object (or null)
 *   state.loading    → true while checking stored session
 *   dispatch({ type: "LOGIN",  payload: { email, password, role } })
 *   dispatch({ type: "LOGOUT" })
 */

import { createContext, useContext, useReducer, useEffect } from "react";
import api, { tokenStore } from "../services/api";

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  user:    null,
  loading: true,  // true until session check completes
  error:   null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function authReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, loading: false, error: null };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "LOGOUT":
      return { ...initialState, loading: false };
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, baseDispatch] = useReducer(authReducer, initialState);

  // Rehydrate from stored JWT on first load
  useEffect(() => {
    const rehydrate = async () => {
      const token = tokenStore.get();
      if (!token) {
        baseDispatch({ type: "SET_LOADING", payload: false });
        return;
      }
      try {
        const { user } = await api.auth.me();
        baseDispatch({ type: "SET_USER", payload: user });
      } catch {
        tokenStore.remove();
        baseDispatch({ type: "SET_LOADING", payload: false });
      }
    };
    rehydrate();
  }, []);

  /**
   * Enhanced dispatch:
   *   LOGIN  → calls backend, stores token, sets user in state
   *   LOGOUT → clears token, resets state
   *   Other  → passed straight to reducer (SET_USER, SET_ERROR, etc.)
   */
  const dispatch = async (action) => {
    if (action.type === "LOGIN") {
      baseDispatch({ type: "SET_LOADING", payload: true });
      try {
        const { email, password, role } = action.payload;
        const { token, user } = await api.auth.login({ email, password, role });
        tokenStore.set(token);
        baseDispatch({ type: "SET_USER", payload: user });
        // Return user so LoginPage can navigate to correct route
        return user;
      } catch (err) {
        baseDispatch({ type: "SET_ERROR", payload: err.message });
        throw err; // re-throw so LoginPage can show the message
      }
    }

    if (action.type === "LOGOUT") {
      tokenStore.remove();
      baseDispatch({ type: "LOGOUT" });
      return;
    }

    baseDispatch(action);
  };

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
