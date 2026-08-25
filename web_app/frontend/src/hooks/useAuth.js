"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

const LOCAL_DEFAULT_USER = {
  id: "default_local_user",
  email: "architect@local.studio",
  full_name: "Local Architect",
  role: "admin",
  is_active: true,
};

export function useAuth() {
  const [user, setUser] = useState(LOCAL_DEFAULT_USER);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("sam3_auth_token");
      const savedUser = localStorage.getItem("sam3_auth_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    } catch {
      // Fallback to local default user
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiClient.login(email, password);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthenticated(true);
    localStorage.setItem("sam3_auth_token", res.access_token);
    localStorage.setItem("sam3_auth_user", JSON.stringify(res.user));
    return res.user;
  }, []);

  const register = useCallback(async (email, password, fullName, role) => {
    const res = await apiClient.register(email, password, fullName, role);
    setToken(res.access_token);
    setUser(res.user);
    setIsAuthenticated(true);
    localStorage.setItem("sam3_auth_token", res.access_token);
    localStorage.setItem("sam3_auth_user", JSON.stringify(res.user));
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(LOCAL_DEFAULT_USER);
    setIsAuthenticated(false);
    localStorage.removeItem("sam3_auth_token");
    localStorage.removeItem("sam3_auth_user");
  }, []);

  // Quick switch role for testing demo permissions (Admin vs Architect vs Client)
  const switchDemoRole = useCallback((roleName) => {
    setUser((prev) => ({
      ...prev,
      role: roleName,
      full_name: roleName === "admin" ? "Lead Architect (Admin)" : roleName === "architect" ? "Interior Designer" : "Client (Viewer)",
    }));
  }, []);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    switchDemoRole,
  };
}
