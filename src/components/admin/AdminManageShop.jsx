import React from "react";
import {
  FaUserCircle,
  FaEdit,
  FaLink,
  FaTrash,
  FaSignOutAlt,
} from "react-icons/fa";
import "../admincss/AdminManageShop.css";

// STEP 1: Import tools
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2

// STEP 2: Component
export default function AdminManageShop() {
  const navigate = useNavigate();

  // STEP 3: Logout handler with confirmation
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#000",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, log out",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase.auth.signOut();

        if (error) {
          Swal.fire("Error", error.message, "error");
        } else {
          navigate("/signin");
        }
      }
    });
  };

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

        <button className="logout-btn" onClick={handleLogout}>
          Log out <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}
