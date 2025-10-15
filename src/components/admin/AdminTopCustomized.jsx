import React, { useState, useEffect } from "react";
import "../admincss/AdminTopCustomized.css";
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

export default function AdminTopCustomized() {
  const [dateFilter, setDateFilter] = useState("Last 3 days");
  const [category, setCategory] = useState("All Categories");
  const [unit, setUnit] = useState("All Units");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchMostViewedParts = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("inventory_parts")
        .select("id, model, category, unit, part_views")
        .order("part_views", { ascending: false })
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
    <div className="admin-topcustomized-container no-bg">
      {/* FILTER SECTION */}
      <div className="admin-filter-box">
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

      {/* CHART SECTION */}
      <div className="admin-chart-box chart-box">
        <h3>Top 10 Most Viewed Parts</h3>
        <div className="chart-inner-box">
          {loading ? (
            <p>Loading chart...</p>
          ) : parts.length === 0 ? (
            <p>No data available for selected filters.</p>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={400}
              className={theme === "dark" ? "dark-chart" : ""}
            >
              <BarChart
                data={parts}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="model"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  tick={{ fontSize: 12, fill: "var(--text-color)" }}
                />
                <YAxis tick={{ fill: "var(--text-color)" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    color: "var(--text-color)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                  }}
                />
                <Bar dataKey="part_views" fill="var(--chart-bar)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
