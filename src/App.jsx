import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

// Owner Components
import SignIn from './components/owner/SignIn';
import SignUp from './components/owner/Signups';
import Dashboard from './components/owner/Dashboard';
import Inventory from './components/owner/Inventory';
import CustomizedParts from './components/owner/CustomizedParts';
import EditProfile from './components/owner/EditProfile';
import AccountSettings from './components/owner/AccountSettings';
import Sidebar from './components/owner/Sidebar';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import AdminManageShop from './components/admin/AdminManageShop';
import AdminManageParts from './components/admin/AdminManageParts';
import AdminTopCustomized from './components/admin/AdminTopCustomized';
import AdminSidebar from './components/admin/AdminSidebar';

export default function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false); // ✅ dark mode state

  // ✅ Sync dark mode with <body>
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  // ✅ Check Supabase session on load
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUserRole(session.user.user_metadata.role || 'owner');
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
      setLoading(false);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          setIsLoggedIn(true);
          setUserRole(session.user.user_metadata.role || 'owner');
        } else {
          setIsLoggedIn(false);
          setUserRole(null);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    navigate(role === 'admin' ? '/admin-dashboard' : '/dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/signin');
  };

  // ✅ Generic wrapper for sidebars (with dark mode)
  const renderWithLayout = (Component, SidebarComponent) => (
    <div className="layout-wrapper">
      <SidebarComponent darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="layout-content">
        <Component onLogout={handleLogout} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Owner routes */}
      <Route path="/dashboard" element={isLoggedIn && userRole === 'owner' ? renderWithLayout(Dashboard, Sidebar) : <Navigate to="/signin" />} />
      <Route path="/inventory" element={isLoggedIn && userRole === 'owner' ? renderWithLayout(Inventory, Sidebar) : <Navigate to="/signin" />} />
      <Route path="/customized" element={isLoggedIn && userRole === 'owner' ? renderWithLayout(CustomizedParts, Sidebar) : <Navigate to="/signin" />} />
      <Route path="/profile" element={isLoggedIn && userRole === 'owner' ? renderWithLayout(EditProfile, Sidebar) : <Navigate to="/signin" />} />
      <Route path="/settings" element={isLoggedIn && userRole === 'owner' ? renderWithLayout(AccountSettings, Sidebar) : <Navigate to="/signin" />} />

      {/* Admin routes */}
      <Route path="/admin-dashboard" element={isLoggedIn && userRole === 'admin' ? renderWithLayout(AdminDashboard, AdminSidebar) : <Navigate to="/signin" />} />
      <Route path="/admin/manage-shop" element={isLoggedIn && userRole === 'admin' ? renderWithLayout(AdminManageShop, AdminSidebar) : <Navigate to="/signin" />} />
      <Route path="/admin/manage-parts" element={isLoggedIn && userRole === 'admin' ? renderWithLayout(AdminManageParts, AdminSidebar) : <Navigate to="/signin" />} />
      <Route path="/admin/top-customized" element={isLoggedIn && userRole === 'admin' ? renderWithLayout(AdminTopCustomized, AdminSidebar) : <Navigate to="/signin" />} />
    </Routes>
  );
}
