import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../ownercss/AccountSettings.css';

export default function AccountSettings({ onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    setUsers(storedUsers);
  }, []);

  const toggleStatus = (username) => {
    const updated = users.map(user =>
      user.username === username
        ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' }
        : user
    );
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
  };

  const deleteUser = (username) => {
    const updated = users.filter(user => user.username !== username);
    setUsers(updated);
    localStorage.setItem('users', JSON.stringify(updated));
  };

  const handleLogoutConfirm = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#000',
      cancelButtonColor: '#aaa',
      confirmButtonText: 'Yes, log out'
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
      }
    });
  };

  return (
    <div className="account-settings">
      <h1>Account Settings</h1>

      <div className="settings-buttons">
        <button>View Details</button>
        <button onClick={() => setShowModal(true)}>Suspend / Reactivate Access</button>
      </div>

      <div className="bottom-buttons">
        <button className="system-btn">System Settings</button>
        <button className="logout-btn" onClick={handleLogoutConfirm}>Log Out</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Manage User Access</h2>
            <ul className="account-list">
              {users.map((user, index) => (
                <li key={index} className="account-item">
                  <div>
                    <strong>{user.username}</strong> — {user.status}
                  </div>
                  <div className="account-actions">
                    <button onClick={() => toggleStatus(user.username)}>
                      {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button onClick={() => deleteUser(user.username)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
            <button className="close-button" onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
