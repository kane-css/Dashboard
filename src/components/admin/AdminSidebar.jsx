import React, { useEffect } from "react";
import {
  FaTachometerAlt,
  FaStore,
  FaCogs,
  FaMoon,
  FaSun,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../admincss/AdminSidebar.css";

export default function AdminSidebar({ isDark, toggleDarkMode }) {
  const navigate = useNavigate();

  
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className={`admin-sidebar ${isDark ? "dark" : ""}`}>
      {/*  Profile section */}
      <div className="profile-section">
        <FaUser className="profile-icon" />
        <h2 className="admin-logo">Admin</h2>
      </div>

      {/*  Navigation section */}
      <nav className="admin-nav">
        <button onClick={() => navigate("/admin-dashboard")}>
          <FaTachometerAlt className="nav-icon" /> <span>Overview</span>
        </button>

        <button onClick={() => navigate("/admin/manage-parts")}>
          <FaCogs className="nav-icon" /> <span>Manage Parts</span>
        </button>

        <button onClick={() => navigate("/admin/manage-shop")}>
          <FaStore className="nav-icon" /> <span>Manage Shop</span>
        </button>
      </nav>

      {/*  Dark mode toggle */}
      <div className="dark-toggle-wrapper">
        <button className="dark-toggle" onClick={toggleDarkMode}>
          {isDark ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </div>
  );
}
