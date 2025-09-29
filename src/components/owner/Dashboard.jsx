import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase'; // Make sure this path is correct
import Swal from 'sweetalert2';
import "../ownercss/Dashboard.css"; // Your dashboard styles

export default function Dashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      <div className="dashboard-chart">
        <p>[Graph Placeholder]</p>
      </div>
    </div>
  );
}