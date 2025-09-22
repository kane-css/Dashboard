import React, { useEffect } from "react";
import { FaTachometerAlt, FaStore, FaCogs, FaCrown, FaMoon, FaSun, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../admincss/AdminSidebar.css";

export default function AdminSidebar({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  // ✅ Add/remove "dark" class on <body>
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className={`admin-sidebar ${darkMode ? "dark" : ""}`}>
      {/* ✅ Top Section (icon + title) */}
      <div className="profile-section">
        <FaUser className="profile-icon" />
        <h2 className="admin-logo">Admin</h2>
      </div>

      {/* ✅ Nav Section */}
      <nav className="admin-nav">
        <button onClick={() => navigate("/admin-dashboard")}>
          <FaTachometerAlt className="nav-icon" /> <span>Overview</span>
        </button>
        <button onClick={() => navigate("/admin/manage-shop")}>
          <FaStore className="nav-icon" /> <span>Manage Shop</span>
        </button>
        <button onClick={() => navigate("/admin/manage-parts")}>
          <FaCogs className="nav-icon" /> <span>Manage Parts</span>
        </button>
        <button onClick={() => navigate("/admin/top-customized")}>
          <FaCrown className="nav-icon" /> <span>Top Customized</span>
        </button>
      </nav>

      {/* ✅ Dark Mode Button (aligned like Owner) */}
      <div className="dark-toggle-wrapper">
        <button
          className="dark-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </div>
  );
}
