"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

const LOCAL_DEFAULT_USER = {
  id: "pa_admin_user",
  email: "pa",
  full_name: "PA",
  role: "admin",
  avatar_url: "/avatar_pa_thumb.jpg",
  is_active: true,
};

export function useAuth() {
  const [user, setUser] = useState(LOCAL_DEFAULT_USER);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Active by default with PA profile
  const [isLoading, setIsLoading] = useState(false);

  // Initialize auth from localStorage on mount if set
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("sam3_auth_token");
      const savedUser = localStorage.getItem("sam3_auth_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setUser({
          ...parsed,
          avatar_url: parsed.avatar_url || "/avatar_pa_thumb.jpg",
        });
        setIsAuthenticated(true);
      }
    } catch {
      // Default to PA
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiClient.login(email, password);
    const userData = {
      ...res.user,
      avatar_url: "/avatar_pa_thumb.jpg",
    };
    setToken(res.access_token);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("sam3_auth_token", res.access_token);
    localStorage.setItem("sam3_auth_user", JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (email, password, fullName, role) => {
    const res = await apiClient.register(email, password, fullName, role);
    const userData = {
      ...res.user,
      avatar_url: "/avatar_pa_thumb.jpg",
    };
    setToken(res.access_token);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem("sam3_auth_token", res.access_token);
    localStorage.setItem("sam3_auth_user", JSON.stringify(userData));
    return userData;
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
      full_name: roleName === "admin" ? "PA (Admin)" : roleName === "architect" ? "PA (Architect)" : "PA (Viewer)",
      avatar_url: "/avatar_pa_thumb.jpg",
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
