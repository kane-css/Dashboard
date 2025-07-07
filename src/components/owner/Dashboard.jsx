import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // Make sure this path is correct
import Swal from 'sweetalert2';
import "../ownercss/Dashboard.css"; // Your dashboard styles

export default function Dashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);

  // Fetch pending users when the component loads
  useEffect(() => {
    const fetchPendingUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching pending users:', error);
      } else {
        setPendingUsers(data || []);
      }
    };

    fetchPendingUsers();
  }, []);

  // UPGRADED handleApprove function. It now takes a 'role' to assign.
  const handleApprove = async (userId, roleToAssign) => {
    if (!roleToAssign) {
      Swal.fire('Error', 'Please select a role to assign.', 'warning');
      return;
    }

    // Update both status and role in one database call
    const { error } = await supabase
      .from('profiles')
      .update({ 
        status: 'active',
        role: roleToAssign 
      })
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', `Could not approve user. ${error.message}`, 'error');
    } else {
      Swal.fire('Approved!', `User has been activated as an ${roleToAssign}.`, 'success');
      // Refresh the list by removing the approved user
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    }
  };

  // The handleDeny function can stay the same
  const handleDeny = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      Swal.fire('Error', `Could not deny user. ${error.message}`, 'error');
    } else {
      Swal.fire('Denied!', 'User has been removed.', 'success');
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="dashboard-chart">
        <p>[Graph Placeholder]</p>
      </div>

      <div className="pending-approvals-section">
        <h2 className="section-title">Pending Account Approvals</h2>
        {pendingUsers.length === 0 ? (
          <p>No pending approvals at this time.</p>
        ) : (
          <ul className="user-approval-list">
            {pendingUsers.map(user => (
              <li key={user.id} className="user-approval-item">
                <span className="username">{user.username}</span>
                <div className="action-buttons">
                  {/* UPGRADED APPROVAL BUTTONS */}
                  <button className="approve-btn" onClick={() => handleApprove(user.id, 'admin')}>
                    Approve as Admin
                  </button>
                  <button className="approve-owner-btn" onClick={() => handleApprove(user.id, 'owner')}>
                    Approve as Owner
                  </button>
                  <button className="deny-btn" onClick={() => handleDeny(user.id)}>
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}