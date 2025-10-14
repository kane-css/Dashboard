import React, { useEffect } from "react";
import {
  FaTachometerAlt,
  FaBoxes,
  FaCrown,
  FaUser,
  FaCog,
  FaMoon,
  FaSun,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../ownercss/Sidebar.css";

export default function OwnerSidebar({ isDark, toggleDarkMode }) {
  const navigate = useNavigate();

  // ✅ Add/remove "dark" class on <body>
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div className={`owner-sidebar ${isDark ? "dark" : ""}`}>
      {/* ✅ Top Section */}
      <div className="profile-section">
        <FaUser className="profile-icon" />
        <h2 className="owner-logo">Owner</h2>
      </div>

      {/* ✅ Nav Sections */}
      <nav className="owner-nav">
        <button onClick={() => navigate("/dashboard")}>
          <FaTachometerAlt className="nav-icon" /> <span>Dashboard Overview</span>
        </button>
        <button onClick={() => navigate("/inventory")}>
          <FaBoxes className="nav-icon" /> <span>View Inventory & Edit</span>
        </button>
        <button onClick={() => navigate("/customized")}>
          <FaCrown className="nav-icon" /> <span>Top Customized Parts</span>
        </button>
        <button onClick={() => navigate("/settings")}>
          <FaCog className="nav-icon" /> <span>Account Settings</span>
        </button>
      </nav>

      {/* ✅ Dark Mode Button */}
      <div className="dark-toggle-wrapper">
        <button className="dark-toggle" onClick={toggleDarkMode}>
          {isDark ? <FaSun /> : <FaMoon />}
        </button>
      </div>
    </div>
  );
}
