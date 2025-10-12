import React, { useEffect, useState } from "react";
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

export default function AdminDashboard({ isDark }) {
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
        console.error("Error fetching popular parts:", error);
      } else {
        setParts(data);
      }
      setLoading(false);
    };

    fetchPopularParts();
  }, []);

  return (
    <main
      className={`admin-dashboard-main ${isDark ? "dark" : ""}`}
      style={{
        flexGrow: 1,
        padding: "2rem",
        transition: "background 0.3s, color 0.3s",
        backgroundColor: isDark ? "#121212" : "#f5f5f5",
        color: isDark ? "#f1f1f1" : "#111",
        minHeight: "100vh",
        overflowY: "auto",
        position: "relative",
        zIndex: 1,
      }}
    >
      <h1>Admin Dashboard</h1>

      {loading ? (
        <p>Loading popular parts chart...</p>
      ) : (
        <div
          style={{
            width: "100%",
            height: 400,
            backgroundColor: isDark ? "#1e1e1e" : "#fff",
            borderRadius: "10px",
            padding: "1rem",
            boxShadow: isDark
              ? "0 0 10px rgba(255,255,255,0.1)"
              : "0 0 10px rgba(0,0,0,0.1)",
            transition: "background-color 0.3s ease, box-shadow 0.3s ease",
            position: "relative",
            zIndex: 0, // ✅ prevents chart from blocking buttons
          }}
        >
          <h2 style={{ marginBottom: "1rem" }}>Top 10 Most Viewed Parts</h2>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={parts}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#333" : "#ccc"}
              />
              <XAxis
                dataKey="model"
                stroke={isDark ? "#ddd" : "#333"}
                interval={0}
                angle={-45}              // ✅ Tilted/slanted text
                textAnchor="end"          // ✅ Align to avoid cutoff
                height={80}               // ✅ Extra space for slanted labels
                tick={{ fontSize: 12 }}   // ✅ Smaller text for readability
              />
              <YAxis stroke={isDark ? "#ddd" : "#333"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#2a2a2a" : "#fff",
                  color: isDark ? "#fff" : "#111",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="part_views"
                fill={isDark ? "#8884d8" : "#007bff"}
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </main>
  );
}
