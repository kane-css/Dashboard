import React, { useState, useEffect } from "react";
import "../ownercss/CustomizedParts.css";
import { supabase } from "../../supabase";

export default function AdminTopCustomized() {
  const [dateFilter, setDateFilter] = useState("Last 3 days");
  const [category, setCategory] = useState("Rear Shock");
  const [unit, setUnit] = useState("Aerox V2");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        // ✅ Fetch all interactions (no date filter)
        const { data: interactions, error: interactionsError } = await supabase
          .from("part_interactions")
          .select("id, part_id");

        if (interactionsError || !interactions?.length) {
          setParts([]);
          setLoading(false);
          return;
        }

        // ✅ Fetch all inventory parts
        const { data: inventoryParts, error: partsError } = await supabase
          .from("inventory_parts")
          .select("id, model, category, unit");

        if (partsError || !inventoryParts) {
          setParts([]);
          setLoading(false);
          return;
        }

        // ✅ Filter parts by category and unit
        const filteredInventory = inventoryParts.filter(
          (p) => p.category === category && p.unit === unit
        );

        // ✅ Count how many interactions each part has
        const counts = {};
        interactions.forEach((it) => {
          const pid = String(it.part_id);
          if (filteredInventory.some((p) => String(p.id) === pid)) {
            counts[pid] = (counts[pid] || 0) + 1;
          }
        });

        // ✅ Sort by top 10
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([pid]) => filteredInventory.find((p) => String(p.id) === pid))
          .filter(Boolean);

        setParts(sorted);
      } catch (err) {
        console.error("⚠️ Unexpected error:", err);
        setParts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [dateFilter, category, unit]);

  return (
    <div className="custom-container">
      <h1>Admin Top Customized Parts</h1>

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

      <div className="custom-list-box">
        {loading ? (
          <p>Loading...</p>
        ) : parts.length === 0 ? (
          <p>No parts found for the selected filters.</p>
        ) : (
          parts.map((part, index) => (
            <div className="custom-part-row" key={part.id}>
              <span className="part-index">{index + 1}.</span>
              <span className="part-name">{part.model}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
