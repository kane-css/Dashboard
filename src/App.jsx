import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const stored = localStorage.getItem('loggedInUser');
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.role) {
        setIsLoggedIn(true);
        setUserRole(parsed.role);
      }
    } catch (err) {
      console.error('Invalid JSON in loggedInUser:', err);
      localStorage.removeItem('loggedInUser');
    }
  }, []);

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    navigate(role === 'admin' ? '/admin-dashboard' : '/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/signin');
  };

  const renderWithSidebar = (Component) => (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-content">
        <Component onLogout={handleLogout} />
      </div>
    </div>
  );

  const renderWithAdminSidebar = (Component) => (
    <div className="layout-wrapper">
      <AdminSidebar />
      <div className="layout-content">
        <Component onLogout={handleLogout} />
      </div>
    </div>
  );

  return (
    <Routes>
      {}
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUp />} />

      { }
      <Route
        path="/dashboard"
        element={isLoggedIn && userRole === 'owner' // <-- This must check for 'owner'
    ? renderWithSidebar(Dashboard)
    : <Navigate to="/signin" />}
      />
      <Route
        path="/inventory"
        element={isLoggedIn && userRole === 'owner'
          ? renderWithSidebar(Inventory)
          : <Navigate to="/signin" />}
      />
      <Route
        path="/customized"
        element={isLoggedIn && userRole === 'owner'
          ? renderWithSidebar(CustomizedParts)
          : <Navigate to="/signin" />}
      />
      <Route
        path="/profile"
        element={isLoggedIn && userRole === 'owner'
          ? renderWithSidebar(EditProfile)
          : <Navigate to="/signin" />}
      />
      <Route
        path="/settings"
        element={isLoggedIn && userRole === 'owner'
          ? renderWithSidebar(AccountSettings)
          : <Navigate to="/signin" />}
      />

      { }
      <Route
        path="/admin-dashboard"
        element={isLoggedIn && userRole === 'admin'
          ? renderWithAdminSidebar(AdminDashboard)
          : <Navigate to="/signin" />}
      />
      <Route
        path="/admin/manage-shop"
        element={isLoggedIn && userRole === 'admin'
          ? renderWithAdminSidebar(AdminManageShop)
          : <Navigate to="/signin" />}
      />
      <Route
        path="/admin/manage-parts"
        element={isLoggedIn && userRole === 'admin'
          ? renderWithAdminSidebar(AdminManageParts)
          : <Navigate to="/signin" />}
      />
      <Route
        path="/admin/top-customized"
        element={isLoggedIn && userRole === 'admin'
          ? renderWithAdminSidebar(AdminTopCustomized)
          : <Navigate to="/signin" />}
      />
    </Routes>
  );
}
