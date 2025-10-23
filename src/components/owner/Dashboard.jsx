import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../supabase";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import "../ownercss/Dashboard.css";

export default function OwnerDashboard({ isDark }) {
  const [salesData, setSalesData] = useState([]);
  const [viewData, setViewData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingViews, setLoadingViews] = useState(true);

  // 🧾 Fetch Top Sold Parts
  const fetchSalesData = useCallback(async () => {
    setLoadingSales(true);
    try {
      // Fetch sales history
      const { data: sales, error: salesError } = await supabase
        .from("sales_history")
        .select("part_id, quantity_sold");

      if (salesError) throw salesError;

      // Count total sold per part
      const quantityMap = {};
      (sales || []).forEach((sale) => {
        quantityMap[sale.part_id] =
          (quantityMap[sale.part_id] || 0) + (sale.quantity_sold || 0);
      });

      // Fetch part info
      const { data: parts, error: partsError } = await supabase
        .from("inventory_parts")
        .select("id, model");

      if (partsError) throw partsError;

      // Merge
      const merged = (parts || [])
        .map((p) => ({
          model: p.model,
          total_sold: quantityMap[p.id] || 0,
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 10);

      setSalesData(merged);
    } catch (error) {
      console.error("Error fetching top sold parts:", error);
    } finally {
      setLoadingSales(false);
    }
  }, []);

  // 👀 Fetch Top Viewed Parts
  const fetchViewedParts = useCallback(async () => {
    setLoadingViews(true);
    try {
      const { data, error } = await supabase
        .from("inventory_parts")
        .select("id, model, part_views")
        .order("part_views", { ascending: false })
        .limit(10);

      if (error) throw error;

      setViewData(data || []);
    } catch (err) {
      console.error("Error fetching viewed parts:", err);
    } finally {
      setLoadingViews(false);
    }
  }, []);

  // 🔄 Fetch on mount
  useEffect(() => {
    fetchSalesData();
    fetchViewedParts();
  }, [fetchSalesData, fetchViewedParts]);

  // ⚡ Real-time updates from Supabase when a sale is added
  useEffect(() => {
    const channel = supabase
      .channel("realtime_sales_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sales_history" },
        (payload) => {
          console.log("📦 Sales updated:", payload);
          fetchSalesData(); // refresh chart
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSalesData]);

  // 🌓 Sync dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <main className={`owner-dashboard-main ${isDark ? "dark" : ""}`}>
      <h1>Dashboard Overview</h1>

      {/* === TOP SOLD PARTS === */}
      <section className={`chart-section ${isDark ? "dark" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Top Sold Parts (by Quantity)</h2>
          <button
            onClick={fetchSalesData}
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: "none",
              background: isDark ? "#3b82f6" : "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Refresh
          </button>
        </div>

        {loadingSales ? (
          <p>Loading Top Sold Parts...</p>
        ) : salesData.length === 0 ? (
          <p>No sales data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={salesData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
        )}
      </section>

      {/* === TOP VIEWED PARTS === */}
      <section className={`chart-section ${isDark ? "dark" : ""}`}>
        <h2>Top Viewed Parts</h2>
        {loadingViews ? (
          <p>Loading Top Viewed Parts...</p>
        ) : viewData.length === 0 ? (
          <p>No viewed parts data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={viewData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
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
                  borderRadius: "8px",
                  border: isDark ? "1px solid #444" : "1px solid #ccc",
                }}
              />
              <Line
                type="monotone"
                dataKey="part_views"
                stroke={isDark ? "#00e0c6" : "#007bff"}
                strokeWidth={3}
                dot={{ fill: isDark ? "#00e0c6" : "#007bff", r: 5 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>
    </main>
  );
}
