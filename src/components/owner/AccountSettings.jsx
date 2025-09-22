import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../ownercss/AccountSettings.css';
import { supabase } from '../../supabase';

export default function AccountSettings() {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: { user: ownerUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', ownerUser.id);

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data);
      }
    };

    if (showModal) {
      fetchUsers();
    }
  }, [showModal]);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    }
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const approveAsAdmin = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Approved!', 'User has been approved as Admin.', 'success');
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: 'admin' } : user
      ));
    }
  };

  const approveAsOwner = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'owner' })
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Approved!', 'User has been approved as Owner.', 'success');
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: 'owner' } : user
      ));
    }
  };

  const denyAccount = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'denied' })
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      Swal.fire('Denied!', 'User account has been denied.', 'info');
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: 'denied' } : user
      ));
    }
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        navigate('/signin');
      }
    });
  };

  return (
    <div className="account-settings">
      <h1>Account Settings</h1>

      <div className="settings-buttons">
        <button>View Details</button>
        <button onClick={() => setShowModal(true)}>Manage User Access</button>
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
              {users.map((user) => (
                <li key={user.id} className="account-item">
                  <div>
                    <strong>{user.username}</strong> — {user.status} {user.role && `(${user.role})`}
                  </div>
                  <div className="account-actions">
                    <div className="approve-buttons">
                      <button className="approve admin" onClick={() => approveAsAdmin(user.id)}>Approve as Admin</button>
                      <button className="approve owner" onClick={() => approveAsOwner(user.id)}>Approve as Owner</button>
                    </div>
                    <div className="manage-buttons">
                      <button className="deny" onClick={() => denyAccount(user.id)}>Deny</button>
                      <button className="status" onClick={() => toggleStatus(user.id, user.status)}>
                        {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button className="delete" onClick={() => deleteUser(user.id)}>Delete</button>
                    </div>
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
