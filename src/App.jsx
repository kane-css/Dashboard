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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Dark mode persistence
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // ✅ Sync dark mode with <body> + localStorage
  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ✅ Check Supabase session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsLoggedIn(true);
        setUserRole(session.user.user_metadata.role || "owner");
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setIsLoggedIn(true);
          setUserRole(session.user.user_metadata.role || "owner");
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // ✅ Login/logout handlers
  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    navigate(role === "admin" ? "/admin-dashboard" : "/dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/signin");
  };

  // ✅ Layout wrapper — shared for both Admin and Owner
  const renderWithLayout = (PageComponent, SidebarComponent) => (
    <div
      className={`layout-wrapper ${darkMode ? "dark" : ""}`}
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
      <div className="layout-content" style={{ flexGrow: 1 }}>
        <PageComponent onLogout={handleLogout} isDark={darkMode} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Owner routes */}
      <Route
        path="/dashboard"
        element={
          isLoggedIn && userRole === "owner"
            ? renderWithLayout(Dashboard, Sidebar)
            : <Navigate to="/signin" />
        }
      />
      <Route
        path="/inventory"
        element={
          isLoggedIn && userRole === "owner"
            ? renderWithLayout(Inventory, Sidebar)
            : <Navigate to="/signin" />
        }
      />
      <Route
        path="/customized"
        element={
          isLoggedIn && userRole === "owner"
            ? renderWithLayout(CustomizedParts, Sidebar)
            : <Navigate to="/signin" />
        }
      />
      <Route
        path="/settings"
        element={
          isLoggedIn && userRole === "owner"
            ? renderWithLayout(AccountSettings, Sidebar)
            : <Navigate to="/signin" />
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin-dashboard"
        element={
          isLoggedIn && userRole === "admin"
            ? renderWithLayout(AdminDashboard, AdminSidebar)
            : <Navigate to="/signin" />
        }
      />
      <Route
        path="/admin/manage-shop"
        element={
          isLoggedIn && userRole === "admin"
            ? renderWithLayout(AdminManageShop, AdminSidebar)
            : <Navigate to="/signin" />
        }
      />
      <Route
        path="/admin/manage-parts"
        element={
          isLoggedIn && userRole === "admin"
            ? renderWithLayout(AdminManageParts, AdminSidebar)
            : <Navigate to="/signin" />
        }
      />
    </Routes>
  );
}
