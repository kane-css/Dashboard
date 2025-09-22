import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import { supabase } from "../../supabase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../admincss/AdminDashboard.css";

export default function AdminDashboard() {
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
      } else {
        setParts(data);
      }
      setLoading(false);
    };

    fetchPopularParts();
  }, []);

  return (
    <div className="admin-dashboard-container" style={{ display: "flex" }}>
      <AdminSidebar />
      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Admin Dashboard</h1>
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
      </main>
    </div>
  );
}