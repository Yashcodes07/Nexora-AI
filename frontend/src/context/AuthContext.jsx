import { createContext, useContext, useEffect, useState } from "react";
import {
  authenticatedRequest,
  clearTokens,
  getTokens,
  loginUser,
  registerUser,
  saveTokens,
} from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getTokens()) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authenticatedRequest("/api/users/me");
        if (active) setUser(currentUser);
      } catch {
        clearTokens();
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  async function login(credentials, remember = true) {
    const tokens = await loginUser(credentials);
    saveTokens(tokens, remember);
    try {
      const currentUser = await authenticatedRequest("/api/users/me");
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearTokens();
      throw error;
    }
  }

  async function signup(input) {
    await registerUser(input);
    return login({ email: input.email, password: input.password }, true);
  }

  async function saveLearningPreferences(preferences) {
    const updatedUser = await authenticatedRequest("/api/users/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
    setUser(updatedUser);
    return updatedUser;
  }

  async function updateAccount(changes) {
    const updatedUser = await authenticatedRequest("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    setUser(updatedUser);
    return updatedUser;
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, saveLearningPreferences, updateAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
