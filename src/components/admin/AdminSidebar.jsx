import React from "react";
import { FaTachometerAlt, FaStore, FaCogs, FaCrown, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../admincss/AdminSidebar.css";


export default function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <div className="admin-sidebar">
      <div className="admin-logo">Modifikasi Admin</div>

      <nav className="admin-nav">
        <button onClick={() => navigate("/admin-dashboard")}>
          <FaTachometerAlt /> Overview
        </button>
        <button onClick={() => navigate("/admin/manage-shop")}>
          <FaStore /> Manage Shop
        </button>
        <button onClick={() => navigate("/admin/manage-parts")}>
          <FaCogs /> Manage Parts
        </button>
        <button onClick={() => navigate("/admin/top-customized")}>
          <FaCrown /> Top Customized
        </button>
      </nav>

      
    </div>
  );
}
