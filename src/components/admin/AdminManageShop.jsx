import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import "../admincss/AdminManageShop.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Swal from "sweetalert2";

export default function AdminManageShop() {
  const navigate = useNavigate();

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
        <div className="admin-button-group">
          {/* Add your other buttons here */}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <span>Log out</span>
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}
