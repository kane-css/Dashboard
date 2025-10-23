import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

// Owner Components
import ResetPassword from "./components/auth/ResetPassword";
import SignIn from "./components/owner/SignIn";
import SignUp from "./components/owner/Signups";
import Dashboard from "./components/owner/Dashboard";
import Inventory from "./components/owner/Inventory";
import CustomizedParts from "./components/owner/CustomizedParts";
import AccountSettings from "./components/owner/AccountSettings";
import Sidebar from "./components/owner/Sidebar";

// Admin Components
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminManageShop from "./components/admin/AdminManageShop";
import AdminManageParts from "./components/admin/AdminManageParts";
import AdminSidebar from "./components/admin/AdminSidebar";

export default function App() {
  const navigate = useNavigate();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [session, setSession] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // ✅ Persist dark mode state
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ✅ Initialize Supabase session
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setSession(data.session);
        setSessionChecked(true);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // ✅ Handle automatic navigation (no flickering)
  useEffect(() => {
    if (!sessionChecked) return;

    const currentPath = window.location.hash.replace("#", ""); // Important for HashRouter
    const isAuthPage = ["/", "/signin", "/signup", "/resetpassword"].includes(currentPath);

    if (session) {
      const role = session.user.user_metadata.role || "owner";
      const target = role === "admin" ? "/admin-dashboard" : "/dashboard";

      // Redirect only if currently on signin/signup/reset pages
      if (isAuthPage && currentPath !== target) {
        navigate(target, { replace: true });
      }
    } else {
      // Redirect to signin if logged out and not on signup/reset
      if (!["/signup", "/resetpassword", "/signin", "/"].includes(currentPath)) {
        navigate("/signin", { replace: true });
      }
    }
  }, [session, sessionChecked, navigate]);

  // ✅ Logout function
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate("/signin", { replace: true });
  };

  // ✅ Loading screen while checking session
  if (!sessionChecked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: darkMode ? "#121212" : "#fff",
          color: darkMode ? "#fff" : "#000",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  // ✅ Layout wrapper for Sidebar + Page
  const renderWithLayout = (Page, SidebarComponent) => (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: darkMode ? "#121212" : "#f5f5f5",
        color: darkMode ? "#fff" : "#000",
        transition: "all 0.3s ease",
      }}
    >
      <SidebarComponent
        isDark={darkMode}
        toggleDarkMode={() => setDarkMode((prev) => !prev)}
      />
      <div style={{ flexGrow: 1 }}>
        <Page onLogout={handleLogout} isDark={darkMode} />
      </div>
    </div>
  );

  const role = session?.user?.user_metadata?.role || "owner";

  // ✅ Define all routes
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/resetpassword" element={<ResetPassword />} />

      {/* Owner Routes */}
      <Route
        path="/dashboard"
        element={
          session && role === "owner"
            ? renderWithLayout(Dashboard, Sidebar)
            : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="/inventory"
        element={
          session && role === "owner"
            ? renderWithLayout(Inventory, Sidebar)
            : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="/customized"
        element={
          session && role === "owner"
            ? renderWithLayout(CustomizedParts, Sidebar)
            : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="/settings"
        element={
          session && role === "owner"
            ? renderWithLayout(AccountSettings, Sidebar)
            : <Navigate to="/signin" replace />
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin-dashboard"
        element={
          session && role === "admin"
            ? renderWithLayout(AdminDashboard, AdminSidebar)
            : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="/admin/manage-shop"
        element={
          session && role === "admin"
            ? renderWithLayout(AdminManageShop, AdminSidebar)
            : <Navigate to="/signin" replace />
        }
      />
      <Route
        path="/admin/manage-parts"
        element={
          session && role === "admin"
            ? renderWithLayout(AdminManageParts, AdminSidebar)
            : <Navigate to="/signin" replace />
        }
      />
    </Routes>
  );
}
