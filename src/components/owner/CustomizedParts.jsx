import React, { useState, useEffect } from "react";
import "../ownercss/CustomizedParts.css";
import { supabase } from "../../supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CustomizedParts() {
  const [dateFilter, setDateFilter] = useState("Last 3 days");
  const [category, setCategory] = useState("Rear Shock");
  const [unit, setUnit] = useState("Aerox V2");
  const [parts, setParts] = useState([]);
  const [stats, setStats] = useState({ week: 0, month: 0 });
  const [chartData, setChartData] = useState([]);

  const getDateFromFilter = () => {
    const now = new Date();
    switch (dateFilter) {
      case "Last 3 days":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
      case "Last 7 days":
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      case "This month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      default:
        return new Date(0);
    }
  };

  useEffect(() => {
    const fetchPartsData = async () => {
      const fromDate = getDateFromFilter().toISOString();

      const { data, error } = await supabase
        .from("part_interactions")
        .select(
          `
          part_id,
          interaction_date,
          inventory_parts!inner (
            id,
            model,
            category,
            unit
          )
        `
        )
        .gte("interaction_date", fromDate);

      if (error) {
        console.error("Error fetching customized parts:", error);
        setParts([]);
        return;
      }

      // Filter by category & units
      const filtered = data.filter(
        (item) =>
          item.inventory_parts.category === category &&
          item.inventory_parts.unit === unit
      );

      // Count customizations per part
      const counts = {};
      filtered.forEach((item) => {
        counts[item.part_id] = (counts[item.part_id] || 0) + 1;
      });

      // Sort and get top 10
      const sortedParts = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([partId]) => {
          const partItem = filtered.find(
            (item) => item.part_id === parseInt(partId)
          );
          return partItem ? partItem.inventory_parts : null;
        })
        .filter(Boolean);

      setParts(sortedParts);

      // ---- Summary Stats ----
      const now = new Date();
      const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const weekCount = data.filter(
        (item) => new Date(item.interaction_date) >= oneWeekAgo
      ).length;

      const monthCount = data.filter(
        (item) => new Date(item.interaction_date) >= oneMonthAgo
      ).length;

      setStats({ week: weekCount, month: monthCount });

      // ---- Date Range Chart ----
      const dateCounts = {};
      data.forEach((item) => {
        const dateKey = new Date(item.interaction_date)
          .toISOString()
          .split("T")[0];
        dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
      });

      const chart = Object.entries(dateCounts).map(([date, count]) => ({
        date,
        count,
      }));

      setChartData(chart.sort((a, b) => new Date(a.date) - new Date(b.date)));
    };

    fetchPartsData();
  }, [dateFilter, category, unit]);

  return (
    <div className="custom-container">
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

      {/* Filters */}
      <div className="custom-filter-box">
        <div className="filter-group">
          <label>Date</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option>Last 3 days</option>
            <option>Last 7 days</option>
            <option>This month</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>Rear Shock</option>
            <option>Exhaust</option>
            <option>Disc Brake</option>
            <option>Calipher</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option>Aerox V2</option>
            <option>Nmax V2</option>
          </select>
        </div>
      </div>

      {/* Parts List */}
      <div className="custom-list-box">
        <h3>Top 10 Most Customized Parts</h3>
        {parts.length === 0 ? (
          <p>No parts found for the selected filters.</p>
        ) : (
          parts.map((part, index) => (
            <div className="custom-part-row" key={part.id}>
              <span className="part-index">{index + 1}.</span>
              <span className="part-name">{part.name}</span>
            </div>
          ))
        )}
      </div>

      {/* Date Range Chart */}
      <div className="chart-container">
        <h3>Customizations Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
