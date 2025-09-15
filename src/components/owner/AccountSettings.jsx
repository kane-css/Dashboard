import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../ownercss/AccountSettings.css';

// STEP 1: Import Supabase and hooks
import { supabase } from '../../supabase'; // Make sure this path is correct

// STEP 2: Remove the 'onLogout' prop, it's no longer needed
export default function AccountSettings() {
  const [showModal, setShowModal] = useState(false);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // STEP 3: Fetch REAL users from the Supabase 'profiles' table
  useEffect(() => {
    const fetchUsers = async () => {
      // Fetches all profiles except the current logged-in owner
      const { data: { user: ownerUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', ownerUser.id); // .neq() means 'not equal to'

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data);
      }
    };
    
    // Only open the modal if we have users to show
    if (showModal) {
      fetchUsers();
    }
  }, [showModal]); // Re-fetch users every time the modal is opened

  // STEP 4: Update user status IN SUPABASE
  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      // Update the user in the local state for an instant UI change
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    }
  };

  // STEP 5: Delete user profile IN SUPABASE
  const deleteUser = async (userId) => {
    // Note: This only deletes the profile. The auth user remains.
    // This is generally safer.
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      // Remove the user from the local state
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  // STEP 6: The new self-contained logout function
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
        navigate('/signin'); // Navigate to signin after logout
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
                    <strong>{user.username}</strong> — {user.status}
                  </div>
                  <div className="account-actions">
                    <button onClick={() => toggleStatus(user.id, user.status)}>
                      {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                    <button onClick={() => deleteUser(user.id)}>Delete</button>
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