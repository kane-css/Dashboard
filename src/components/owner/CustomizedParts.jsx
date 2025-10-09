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
    const fetchSalesData = async () => {
      const fromDate = getDateFromFilter().toISOString();

      // Replace "sales" with your actual table name if different
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_date, category, unit, total_amount")
        .gte("sale_date", fromDate);

      if (error) {
        console.error("Error fetching sales data:", error);
        return;
      }

      // Filter by category and unit
      const filtered = data.filter(
        (item) => item.category === category && item.unit === unit
      );

      // ---- Summary Stats ----
      const now = new Date();
      const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const weekCount = filtered.filter(
        (item) => new Date(item.sale_date) >= oneWeekAgo
      ).length;

      const monthCount = filtered.filter(
        (item) => new Date(item.sale_date) >= oneMonthAgo
      ).length;

      setStats({ week: weekCount, month: monthCount });

      // ---- Sales Over Time Chart ----
      const dateTotals = {};
      filtered.forEach((item) => {
        const dateKey = new Date(item.sale_date).toISOString().split("T")[0];
        dateTotals[dateKey] = (dateTotals[dateKey] || 0) + item.total_amount;
      });

      const chart = Object.entries(dateTotals).map(([date, total]) => ({
        date,
        total,
      }));

      setChartData(chart.sort((a, b) => new Date(a.date) - new Date(b.date)));
    };

    fetchSalesData();
  }, [dateFilter, category, unit]);

  return (
    <div className="custom-container">
      {/* Summary Boxes */}
      <div className="summary-box">
        <div className="summary-item">
          <h3>{stats.week}</h3>
          <p>Sales This Week</p>
        </div>
        <div className="summary-item">
          <h3>{stats.month}</h3>
          <p>Sales This Month</p>
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

      {/* Sales Chart */}
      <div className="chart-container">
        <h3>Sales Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Total Sales"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
