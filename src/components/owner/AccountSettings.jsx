import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../ownercss/AccountSettings.css";
import { supabase } from "../../supabase";

export default function AccountSettings() {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [archives, setArchives] = useState([]);
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    contact: "",
    location: "",
  });
  const navigate = useNavigate();

  // 🔹 Fetch users for "Manage User Access"
  useEffect(() => {
    const fetchUsers = async () => {
      const {
        data: { user: ownerUser },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", ownerUser.id);

      if (error) console.error("Error fetching users:", error);
      else setUsers(data);
    };

    if (showManageModal) fetchUsers();
  }, [showManageModal]);

  // 🔹 Fetch archived products
  useEffect(() => {
    const fetchArchives = async () => {
      const { data, error } = await supabase
        .from("inventory_parts")
        .select("*")
        .eq("is_archived", true);

      if (error) console.error("Error fetching archives:", error);
      else setArchives(data);
    };

    if (showArchiveModal) fetchArchives();
  }, [showArchiveModal]);

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileUpdate = () => {
    Swal.fire({
      icon: "success",
      title: "Profile Updated!",
      text: "Shop profile information has been updated successfully.",
      confirmButtonColor: "#000",
    });
    setShowEditModal(false);
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", userId);

    if (error) Swal.fire("Error", error.message, "error");
    else {
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    }
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) Swal.fire("Error", error.message, "error");
    else setUsers(users.filter((user) => user.id !== userId));
  };

  const approveAsAdmin = async (userId) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", userId);

    if (error) Swal.fire("Error", error.message, "error");
    else {
      Swal.fire("Approved!", "User has been approved as Admin.", "success");
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: "admin" } : user
        )
      );
    }
  };

  const approveAsOwner = async (userId) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "owner" })
      .eq("id", userId);

    if (error) Swal.fire("Error", error.message, "error");
    else {
      Swal.fire("Approved!", "User has been approved as Owner.", "success");
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, role: "owner" } : user
        )
      );
    }
  };

  const denyAccount = async (userId) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "denied" })
      .eq("id", userId);

    if (error) Swal.fire("Error", error.message, "error");
    else {
      Swal.fire("Denied!", "User account has been denied.", "info");
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, status: "denied" } : user
        )
      );
    }
  };

  // ✅ Dark mode support for Log Out SweetAlert
  const handleLogoutConfirm = () => {
    const isDarkMode = document.body.classList.contains("dark");

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDarkMode ? "#4CAF50" : "#000",
      cancelButtonColor: isDarkMode ? "#888" : "#aaa",
      confirmButtonText: "Yes, log out",
      background: isDarkMode ? "#1e1e1e" : "#fff",
      color: isDarkMode ? "#f1f1f1" : "#111",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        navigate("/signin");
      }
    });
  };

  // 🔹 Restore Archived Product
  const handleRestore = async (id) => {
    const isDarkMode = document.body.classList.contains("dark");

    const confirm = await Swal.fire({
      title: "Restore Product?",
      text: "This will move the product back to active inventory.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
      background: isDarkMode ? "#1e1e1e" : "#ffffff",
      color: isDarkMode ? "#f1f1f1" : "#111111",
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("inventory_parts")
      .update({ is_archived: false })
      .eq("id", id);

    if (error) {
      Swal.fire("Error", "Failed to restore product.", "error");
    } else {
      setArchives(archives.filter((a) => a.id !== id));
      Swal.fire("Restored!", "Product has been restored successfully.", "success");
    }
  };

  return (
    <div className="account-settings">
      <h1>Settings</h1>

      <div className="settings-buttons">
        <button
          className="btn-manage"
          onClick={() => setShowManageModal(true)}
        >
          Manage User Access
        </button>
        <button
          className="btn-edit-profile"
          onClick={() => setShowEditModal(true)}
        >
          Edit Shop Profile
        </button>
        <button
          className="btn-archives"
          onClick={() => setShowArchiveModal(true)}
        >
          View Archives
        </button>
        <button className="btn-logout" onClick={handleLogoutConfirm}>
          Log Out
        </button>
      </div>

      {/* 🔹 Manage Users Modal */}
      {showManageModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Manage User Access</h2>
            <div className="manage-user-access">
              <ul>
                {users.map((user) => (
                  <li key={user.id}>
                    <div className="user-info">
                      <strong>{user.username}</strong> — <span>{user.role}</span>{" "}
                      —{" "}
                      <span className={`status-badge ${user.status}`}>
                        {user.status}
                      </span>
                    </div>
                    <div className="actions">
                      <button
                        className="btn-admin"
                        onClick={() => approveAsAdmin(user.id)}
                      >
                        Approve as Admin
                      </button>
                      <button
                        className="btn-owner"
                        onClick={() => approveAsOwner(user.id)}
                      >
                        Approve as Owner
                      </button>
                      <button
                        className="btn-deny"
                        onClick={() => denyAccount(user.id)}
                      >
                        Deny
                      </button>
                      <button
                        className="btn-status"
                        onClick={() => toggleStatus(user.id, user.status)}
                      >
                        {user.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="close-button"
              onClick={() => setShowManageModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box edit-modal">
            <h2>Edit Shop Profile</h2>
            <input
              type="text"
              name="shopName"
              placeholder="Shop Name"
              value={formData.shopName}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="ownerName"
              placeholder="Owner Name"
              value={formData.ownerName}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="contact"
              placeholder="Contact"
              value={formData.contact}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleInputChange}
            />
            <button className="btn-update" onClick={handleProfileUpdate}>
              Update Profile
            </button>
            <button
              className="close-button"
              onClick={() => setShowEditModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Archive Modal */}
      {showArchiveModal && (
        <div className="modal-overlay">
          <div className="modal-box archive-modal">
            <h2>Archived Products</h2>
            {archives.length === 0 ? (
              <p style={{ textAlign: "center" }}>No archived products found.</p>
            ) : (
              <table className="archive-table">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Price</th>
                    <th>Unit</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {archives.map((a) => (
                    <tr key={a.id}>
                      <td>{a.brand}</td>
                      <td>{a.model}</td>
                      <td>₱{a.price}</td>
                      <td>{a.unit}</td>
                      <td>
                        <button
                          className="btn-restore"
                          style={{
                            backgroundColor: "#22c55e",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "6px",
                          }}
                          onClick={() => handleRestore(a.id)}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              className="close-button"
              onClick={() => setShowArchiveModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
