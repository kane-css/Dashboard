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
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Total Quantity Sold per Part (Top Sold Parts)
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // 1️⃣ Get all sales data
        const { data: sales, error: salesError } = await supabase
          .from("sales_history")
          .select("part_id, quantity_sold");

        if (salesError) throw salesError;

        // 2️⃣ Aggregate quantities sold per part_id
        const quantityMap = {};
        (sales || []).forEach((sale) => {
          quantityMap[sale.part_id] =
            (quantityMap[sale.part_id] || 0) + (sale.quantity_sold || 0);
        });

        // 3️⃣ Fetch all parts info
        const { data: parts, error: partsError } = await supabase
          .from("inventory_parts")
          .select("id, model");

        if (partsError) throw partsError;

        // 4️⃣ Merge parts + total_sold data
        const merged = (parts || [])
          .map((p) => ({
            model: p.model,
            total_sold: quantityMap[p.id] || 0,
          }))
          .sort((a, b) => b.total_sold - a.total_sold) // Sort descending
          .slice(0, 10); // Limit to top 10

        setSalesData(merged);
      } catch (error) {
        console.error("Error fetching top sold parts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // Toggle Dark Mode
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <main className={`admin-dashboard-main ${isDark ? "dark" : ""}`}>
      <h1>Admin Dashboard</h1>

      {loading ? (
        <p>Loading Top Sold Parts...</p>
      ) : (
        <div className={`chart-container ${isDark ? "dark" : ""}`}>
          <h2>Top Sold Parts (by Quantity)</h2>
          {salesData && salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={salesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                barCategoryGap="20%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? "#444" : "#ccc"}
                />
                <XAxis
                  dataKey="model"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 12, fill: isDark ? "#ddd" : "#333" }}
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
                  dataKey="total_sold"
                  fill={isDark ? "#60a5fa" : "#3b82f6"}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No sales data available.</p>
          )}
        </div>
      )}
    </main>
  );
}
