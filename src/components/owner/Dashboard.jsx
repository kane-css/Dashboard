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
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Total Quantity Sold per Part
  useEffect(() => {
    const fetchSalesData = async () => {
      const { data: sales } = await supabase
        .from("sales_history")
        .select("part_id, quantity_sold");

      const quantityMap = {};
      (sales || []).forEach((sale) => {
        quantityMap[sale.part_id] =
          (quantityMap[sale.part_id] || 0) + (sale.quantity_sold || 0);
      });

      const { data: parts } = await supabase
        .from("inventory_parts")
        .select("id, model");

      const merged = (parts || []).map((p) => ({
        model: p.model,
        total_sold: quantityMap[p.id] || 0,
      }));

      setSalesData(merged);
      setLoading(false);
    };
    fetchSalesData();
  }, []);

  // Toggle Dark Mode Class
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <main className={`owner-dashboard-main ${isDark ? "dark" : ""}`}>
      <h1>Owner Dashboard</h1>

      {loading ? (
        <p>Loading chart...</p>
      ) : (
        <div className="chart-section">
          <h2>Top Sold Parts (by Quantity)</h2>
          {salesData && salesData.some((d) => d.total_sold > 0) ? (
            <ResponsiveContainer width="100%" height={450}>
              <BarChart
                data={salesData}
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
            <p>No sales data yet.</p>
          )}
        </div>
      )}
    </main>
  );
}
