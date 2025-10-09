import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase"; // Check path
import Swal from "sweetalert2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
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

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Overview</h1>

      {/* Chart Section */}
      <div className="dashboard-chart">
        {loading ? (
          <p>Loading popular parts chart...</p>
        ) : (
          <div style={{ width: "100%", height: 400 }}>
            <h2>Top 10 Most Viewed Parts</h2>
            <ResponsiveContainer>
              <BarChart
                data={parts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="part_views" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
