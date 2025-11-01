import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../ownercss/AccountSettings.css";
import { supabase } from "../../supabase";
import qrImage from '../../assets/Modifikasi.png';


export default function AccountSettings() {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [archives, setArchives] = useState([]);
  const navigate = useNavigate();

  // Fetch users for "Manage User Access"
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

  // Fetch archived products
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

  // Restore Archived Product
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
        <button className="btn-manage" onClick={() => setShowManageModal(true)}>
          Manage User Access
        </button>

        <button className="btn-archives" onClick={() => setShowArchiveModal(true)}>
          View Archives
        </button>

        {/* 🔹 New QR Code Button */}
        <button className="btn-archives" onClick={() => setShowQRModal(true)}>
          Download App QR Code
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
                      <strong>{user.username}</strong> — <span>{user.role}</span> —{" "}
                      <span className={`status-badge ${user.status}`}>{user.status}</span>
                    </div>
                    <div className="actions">
                      <button className="btn-admin" onClick={() => approveAsAdmin(user.id)}>
                        Approve as Admin
                      </button>
                      <button className="btn-owner" onClick={() => approveAsOwner(user.id)}>
                        Approve as Owner
                      </button>
                      <button className="btn-deny" onClick={() => denyAccount(user.id)}>
                        Deny
                      </button>
                      <button className="btn-status" onClick={() => toggleStatus(user.id, user.status)}>
                        {user.status === "active" ? "Suspend" : "Reactivate"}
                      </button>
                      <button className="btn-delete" onClick={() => deleteUser(user.id)}>
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <button className="close-button" onClick={() => setShowManageModal(false)}>
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
            <button className="close-button" onClick={() => setShowArchiveModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="modal-overlay">
          <div className="modal-box qr-modal">
            <h2>Download App QR Code</h2>
            <div style={{ textAlign: "center", marginTop: "20px" }}>
             <img src={qrImage} alt="App QR Code" className="qr-image" />

              
              <p style={{ marginTop: "10px", fontSize: "14px" }}>
                Scan this QR code to download the Modifikasi App.
              </p>
            </div>
            <button className="close-button" onClick={() => setShowQRModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
