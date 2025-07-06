import React from "react";
import { FaUserCircle, FaEdit, FaLink, FaTrash, FaSignOutAlt } from "react-icons/fa";
import "../admincss/AdminManageShop.css";

export default function AdminManageShop({ onLogout }) {
  return (
    <div className="admin-manage-shop-container">
      <div className="admin-card">
        <div className="admin-search-wrapper">
          <input type="text" placeholder="Search" className="admin-search" />
          <button className="close-btn">×</button>
        </div>

        <div className="admin-button-group">
          <button>
            <FaUserCircle /> View Details <span>›</span>
          </button>
          <button>
            <FaEdit /> Edit Shop Information <span>›</span>
          </button>
          <button>
            <FaLink /> Suspend/Reactivate Access <span>›</span>
          </button>
          <button>
            <FaTrash /> Delete Owner Account <span>›</span>
          </button>
        </div>

        <button className="system-btn">System Settings</button>
        <button className="logout-btn" onClick={onLogout}>
          Log out <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}
