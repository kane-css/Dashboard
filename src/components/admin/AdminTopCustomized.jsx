import React, { useState, useEffect } from "react";
import "../ownercss/CustomizedParts.css";
import { supabase } from "../../supabase";

export default function AdminTopCustomized() {
  const [dateFilter, setDateFilter] = useState("Last 3 days");
  const [category, setCategory] = useState("Rear Shock");
  const [unit, setUnit] = useState("Aerox V2");

  const [parts, setParts] = useState([]);

  // Helper to compute filter date
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
    const fetchParts = async () => {
      const fromDate = getDateFromFilter().toISOString();

      const { data, error } = await supabase
        .from("part_interactions")
        .select(
          `
          part_id,
          inventory_parts!inner (
            id,
            name,
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

      // Filter by category & unit
      const filtered = data.filter(
        (item) =>
          item.inventory_parts.category === category &&
          item.inventory_parts.unit === unit
      );

      // Count interactions per part
      const counts = {};
      filtered.forEach((item) => {
        counts[item.part_id] = (counts[item.part_id] || 0) + 1;
      });

      // Convert & sort
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
    };

    fetchParts();
  }, [dateFilter, category, unit]);

  return (
    <div className="custom-container">
      <h1>Admin Top Customized Parts</h1>

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

      <div className="custom-list-box">
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
    </div>
  );
}
