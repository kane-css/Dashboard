import React, { useEffect, useState } from "react";
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
import "../admincss/AdminDashboard.css";

export default function AdminDashboard({ isDark }) {
  const [salesData, setSalesData] = useState([]);
  const [viewData, setViewData] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingViews, setLoadingViews] = useState(true);

  // 🧾 Fetch Top Sold Parts
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const { data: sales, error: salesError } = await supabase
          .from("sales_history")
          .select("part_id, quantity_sold");

        if (salesError) throw salesError;

        const quantityMap = {};
        (sales || []).forEach((sale) => {
          quantityMap[sale.part_id] =
            (quantityMap[sale.part_id] || 0) + (sale.quantity_sold || 0);
        });

        const { data: parts, error: partsError } = await supabase
          .from("inventory_parts")
          .select("id, model");

        if (partsError) throw partsError;

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
    };

    fetchSalesData();
  }, []);

  // 👀 Fetch Top Viewed Parts
  useEffect(() => {
    const fetchViewedParts = async () => {
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
    };

    fetchViewedParts();
  }, []);

  // 🌓 Sync dark mode
  useEffect(() => {
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <main className={`admin-dashboard-main ${isDark ? "dark" : ""}`}>
      <h1>Overview</h1>

      {/* === TOP SOLD PARTS === */}
      <section className={`chart-section ${isDark ? "dark" : ""}`}>
        <h2>Top Sold Parts (by Quantity)</h2>
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

      {/* === TOP VIEWED PARTS (LINE GRAPH) === */}
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
                  borderRadius: "6px",
                }}
              />
              <Line
                type="monotone"
                dataKey="part_views"
                stroke={isDark ? "#00e0c6" : "#007bff"}
                strokeWidth={3}
                dot={{ r: 5, fill: isDark ? "#00e0c6" : "#007bff" }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>
    </main>
  );
}
