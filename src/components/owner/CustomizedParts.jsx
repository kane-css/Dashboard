import React, { useState, useEffect } from "react";
import "../ownercss/CustomizedParts.css";
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

export default function CustomizedParts() {
  const [dateFilter, setDateFilter] = useState("Last 3 days");
  const [category, setCategory] = useState("All Categories");
  const [unit, setUnit] = useState("All Units");
  const [parts, setParts] = useState([]);
  const [stats, setStats] = useState({ week: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMostViewedParts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("inventory_parts")
        .select("id, model, category, unit, part_views, brand")
        .order("brand", { ascending: true }) // alphabetical by brand
        .limit(10);

      if (error) {
        console.error("Error fetching viewed parts:", error);
        setParts([]);
        setLoading(false);
        return;
      }

      let filtered = data;

      if (category !== "All Categories") {
        filtered = filtered.filter((item) => item.category === category);
      }

      if (unit !== "All Units") {
        filtered = filtered.filter((item) => item.unit === unit);
      }

      setParts(filtered);
      setLoading(false);
    };

    fetchMostViewedParts();
  }, [dateFilter, category, unit]);

  return (
    <div className="custom-container">
      {/* Filter Section */}
      <div className="custom-filter-box">
        <div className="filter-group">
          <label>Date</label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option>Last 3 days</option>
            <option>Last 7 days</option>
            <option>This month</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Rear Shock</option>
            <option>Exhaust</option>
            <option>Disc Brake</option>
            <option>Calipher</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option>All Units</option>
            <option>Aerox V2</option>
            <option>Nmax V2</option>
          </select>
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="summary-box">
        <div className="summary-item">
          <h3>{stats.week}</h3>
          <p>This Week</p>
        </div>
        <div className="summary-item">
          <h3>{stats.month}</h3>
          <p>This Month</p>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <h3>Top 9 Most Viewed Parts</h3>

        {loading ? (
          <p className="loading-text">Loading chart...</p>
        ) : parts.length === 0 ? (
          <p className="no-data-text">No parts found for the selected filters.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={parts}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              barCategoryGap="25%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis
                dataKey="model"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11, fill: "#555" }}
              />
              <YAxis tick={{ fill: "#555" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e1e1e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px",
                }}
              />
              <Bar dataKey="part_views" fill="#4CAF50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
