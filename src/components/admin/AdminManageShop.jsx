import React from "react";
import { FaUserCircle, FaEdit, FaLink, FaTrash, FaSignOutAlt } from "react-icons/fa";
import "../admincss/AdminManageShop.css";

// STEP 1: Import the necessary tools from React Router and Supabase
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase"; // Make sure this path is correct

// STEP 2: Remove the 'onLogout' prop from the function definition
export default function AdminManageShop() {
  // STEP 3: Get the navigate function from the hook
  const navigate = useNavigate();

  // STEP 4: Create a new, self-contained logout handler function
  const handleLogout = async () => {
    // Call Supabase directly to sign the user out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error.message);
      // You could show a Swal.fire alert here if you want
    } else {
      // After a successful logout, navigate the user back to the sign-in page.
      // The master listener in App.jsx will also detect this, but navigating here
      // gives the user instant feedback.
      navigate("/signin");
    }
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

        {/* STEP 5: Point the button's onClick to your new handleLogout function */}
        <button className="logout-btn" onClick={handleLogout}>
          Log out <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
}