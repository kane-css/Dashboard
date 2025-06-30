import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/Signup';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import CustomizedParts from './components/CustomizedParts';
import EditProfile from './components/EditProfile';
import AccountSettings from './components/AccountSettings';
import Sidebar from './components/Sidebar';
import './index.css';

export default function App() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('loggedInUser'));

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    setIsLoggedIn(false);
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


  return (
    <Routes>
      <Route path="/" element={<Navigate to="/signin" />} />
      <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
      <Route path="/signup" element={<SignUp />} />

      <Route
        path="/dashboard"
        element={isLoggedIn ? renderWithSidebar(Dashboard) : <Navigate to="/signin" />}
      />
      <Route
        path="/inventory"
        element={isLoggedIn ? renderWithSidebar(Inventory) : <Navigate to="/signin" />}
      />
      <Route
        path="/customized"
        element={isLoggedIn ? renderWithSidebar(CustomizedParts) : <Navigate to="/signin" />}
      />
      <Route
        path="/profile"
        element={isLoggedIn ? renderWithSidebar(EditProfile) : <Navigate to="/signin" />}
      />
      <Route
        path="/settings"
        element={isLoggedIn ? renderWithSidebar(AccountSettings) : <Navigate to="/signin" />}
      />
    </Routes>
  );
}
