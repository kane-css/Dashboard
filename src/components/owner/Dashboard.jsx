import React, { useEffect, useState } from "react";
import OwnerSidebar from "./Sidebar"; // ✅ Corrected path
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

  return (
    <div className="owner-dashboard-container" style={{ display: "flex" }}>
      {/* ✅ Sidebar (matches Admin style) */}
      <OwnerSidebar />

      <main style={{ flexGrow: 1, padding: "2rem" }}>
        <h1>Owner Dashboard</h1>

        {loading ? (
          <p>Loading parts chart...</p>
        ) : (
          <div style={{ width: "100%", height: 400 }}>
            <h2>Top 10 Most Viewed Parts</h2>
            <ResponsiveContainer>
              <BarChart
                data={parts}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="model" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="part_views" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
}
