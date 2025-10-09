<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase"; // Check path
import Swal from "sweetalert2";
=======
import React, { useEffect, useState } from "react";
import OwnerSidebar from "./Sidebar"; // ✅ Corrected path
import { supabase } from "../../supabase";
>>>>>>> 74ea866cd254dcc263b9d5a5ba9018950247fa31
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
<<<<<<< HEAD
import "../ownercss/Dashboard.css"; // Your dashboard styles

export default function Dashboard() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularParts = async () => {
      const { data, error } = await supabase
        .from("inventory_parts")
        .select("id, name, part_views")
        .order("part_views", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching popular parts:", error);
        Swal.fire("Error", "Failed to load parts data", "error");
      } else {
        setParts(data);
      }
      setLoading(false);
    };

    fetchPopularParts();
  }, []);

=======
import "../ownercss/Dashboard.css"; // ✅ Use your owner dashboard CSS

export default function OwnerDashboard() {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularParts = async () => {
      const { data, error } = await supabase
        .from("inventory_parts")
        .select("id, model, part_views")
        .order("part_views", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching parts:", error);
      } else {
        setParts(data);
      }
      setLoading(false);
    };

    fetchPopularParts();
  }, []);

>>>>>>> 74ea866cd254dcc263b9d5a5ba9018950247fa31
  return (
    <div className="owner-dashboard-container" style={{ display: "flex" }}>
      {/* ✅ Sidebar (matches Admin style) */}
      <OwnerSidebar />

<<<<<<< HEAD
      {/* Chart Section */}
      <div className="dashboard-chart">
        {loading ? (
          <p>Loading popular parts chart...</p>
=======
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Owner Dashboard</h1>

        {loading ? (
          <p>Loading parts chart...</p>
>>>>>>> 74ea866cd254dcc263b9d5a5ba9018950247fa31
        ) : (
          <div style={{ width: "100%", height: 400 }}>
            <h2>Top 10 Most Viewed Parts</h2>
            <ResponsiveContainer>
              <BarChart
                data={parts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
<<<<<<< HEAD
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="part_views" fill="#8884d8" />
=======
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="part_views" fill="#82ca9d" />
>>>>>>> 74ea866cd254dcc263b9d5a5ba9018950247fa31
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
<<<<<<< HEAD
      </div>
=======
      </main>
>>>>>>> 74ea866cd254dcc263b9d5a5ba9018950247fa31
    </div>
  );
}
