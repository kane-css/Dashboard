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
import "../ownercss/Dashboard.css";

export default function OwnerDashboard({ isDark }) {
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

  // ✅ Sync dark mode styling on body
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <main
      className={`owner-dashboard-main ${isDark ? "dark" : ""}`}
      style={{
        flexGrow: 1,
        padding: "2rem",
        transition: "background 0.3s, color 0.3s",
        backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
        color: isDark ? "#f5f5f5" : "#000000",
        minHeight: "100vh",
      }}
    >
      <h1>Owner Dashboard</h1>

      {loading ? (
        <p>Loading parts chart...</p>
      ) : (
        <div style={{ width: "100%", height: 450 }}>
          <h2>Top 10 Most Viewed Parts</h2>
          <ResponsiveContainer>
            <BarChart
              data={parts}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#555" : "#ccc"}
              />
              <XAxis
                dataKey="model"
                interval={0}
                angle={-25}
                textAnchor="end"
                tick={{
                  fontSize: 12,
                  fill: isDark ? "#ddd" : "#333",
                }}
              />
              <YAxis tick={{ fill: isDark ? "#ddd" : "#333" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#333" : "#fff",
                  color: isDark ? "#fff" : "#000",
                  border: "none",
                  borderRadius: "6px",
                }}
              />
              <Bar
                dataKey="part_views"
                fill={isDark ? "#4ade80" : "#82ca9d"}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </main>
  );
}