import React, { useState, useEffect } from "react";
import { FaSignOutAlt } from "react-icons/fa";
import "../admincss/AdminManageShop.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Swal from "sweetalert2";

export default function AdminManageShop() {
  const navigate = useNavigate();
  const [showArchives, setShowArchives] = useState(false);
  const [archivedParts, setArchivedParts] = useState([]);

  
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

  
  const fetchArchivedParts = async () => {
    const { data, error } = await supabase
      .from("inventory_parts")
      .select("*")
      .eq("is_archived", true);
    if (error) {
      Swal.fire("Error", "Failed to fetch archived items.", "error");
    } else {
      setArchivedParts(data);
    }
  };

  
  useEffect(() => {
    if (showArchives) fetchArchivedParts();
  }, [showArchives]);

  // ✅ Unarchive Function
  const handleUnarchive = async (id) => {
    const confirm = await Swal.fire({
      title: "Unarchive this item?",
      text: "This item will be moved back to active inventory.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#22c55e",
      cancelButtonColor: "#6b7280",
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("inventory_parts")
      .update({ is_archived: false })
      .eq("id", id);

    if (error) {
      Swal.fire("Error", "Failed to unarchive item.", "error");
    } else {
      Swal.fire("Success", "Item unarchived successfully!", "success");
      setArchivedParts((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="admin-manage-shop-container">
      <div className="admin-card">
        <div className="admin-button-group">
          {/* Archive Button */}
          <button
  className="archive-btn"
  style={{
    background: "#000000ff",
    color: "#fff",
    marginRight: "10px",
    padding: "10px 15px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "500",
  }}
  onClick={() => setShowArchives(true)}
>
  Archives
</button>

        </div>

        <button className="logout-btn" onClick={handleLogout}>
          <span>Log out</span>
          <FaSignOutAlt />
        </button>
      </div>

      {/* Archives Modal */}
      {showArchives && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Archived Parts</h2>
            <button
              className="close-modal"
              onClick={() => setShowArchives(false)}
            >
              ✖
            </button>

            <div className="archive-list">
              {archivedParts.length === 0 ? (
                <p>No archived parts found.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Category</th>
                      <th>Unit</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archivedParts.map((item) => (
                      <tr key={item.id}>
                        <td>{item.brand}</td>
                        <td>{item.model}</td>
                        <td>{item.category}</td>
                        <td>{item.unit}</td>
                        <td>
                          <button
                            style={{
                              background: "#22c55e",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              cursor: "pointer",
                            }}
                            onClick={() => handleUnarchive(item.id)}
                          >
                            Unarchive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
