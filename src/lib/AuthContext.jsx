// src/lib/AuthContext.jsx
// XURA Authentication & Permissions Context
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [permissions, setPerms]   = useState({});
  const [loading, setLoading]     = useState(true);

  // ── fetch profile + permissions ────────────────────────────
  async function loadProfile(userId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("*, clubs(*)")
      .eq("id", userId)
      .single();

    if (!prof) { setProfile(null); setPerms({}); return; }

    // Load role default permissions
    const { data: rolePerm } = await supabase
      .from("role_permissions")
      .select("permissions")
      .eq("role", prof.role)
      .single();

    // Merge role defaults with any profile-level overrides
    const merged = {
      ...(rolePerm?.permissions || {}),
      ...(prof.permissions || {}),
    };

    setProfile(prof);
    setPerms(merged);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setPerms({}); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Permission helpers ─────────────────────────────────────
  function can(module, action = "read") {
    if (!permissions[module]) return false;
    return permissions[module][action] === true;
  }

  function hasRole(...roles) {
    return roles.includes(profile?.role);
  }

  // ── Auth actions ───────────────────────────────────────────
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPerms({});
  }

  async function signUp(email, password, meta = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    return { data, error };
  }

  const value = {
    user,
    profile,
    permissions,
    loading,
    can,
    hasRole,
    signIn,
    signOut,
    signUp,
    refreshProfile: () => user && loadProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;
