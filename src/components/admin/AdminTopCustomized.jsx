import React, { useState, useEffect } from "react";
import "../ownercss/CustomizedParts.css";
import { supabase } from "../../supabase";

export default function AdminTopCustomized() {
  const [dateFilter, setDateFilter] = useState("Last 3 days");
  const [category, setCategory] = useState("Rear Shock");
  const [unit, setUnit] = useState("Aerox V2");
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Compute start date (non-mutating)
  const getDateFromFilter = () => {
    const now = new Date();
    if (dateFilter === "Last 3 days") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
    }
    if (dateFilter === "Last 7 days") {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    if (dateFilter === "This month") {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(0);
  };

  useEffect(() => {
    const fetchParts = async () => {
      setLoading(true);
      try {
        const fromDate = getDateFromFilter().toISOString();

        // ✅ 1) Fetch part interactions from the past X days
        const { data: interactions, error: interactionsError } = await supabase
          .from("part_interactions")
          .select("id, part_id, created_at")
          .gte("created_at", fromDate);

        if (interactionsError) {
          console.error("❌ Error fetching part_interactions:", interactionsError);
          setParts([]);
          setLoading(false);
          return;
        }

        if (!interactions || interactions.length === 0) {
          setParts([]);
          setLoading(false);
          return;
        }

        // ✅ 2) Get unique part IDs
        const partIds = Array.from(new Set(interactions.map((i) => i.part_id))).filter(Boolean);
        if (partIds.length === 0) {
          setParts([]);
          setLoading(false);
          return;
        }

        // ✅ 3) Fetch the related inventory_parts
        const { data: inventoryParts, error: partsError } = await supabase
          .from("inventory_parts")
          .select("id, model, category, unit")
          .in("id", partIds);

        if (partsError) {
          console.error("❌ Error fetching inventory_parts:", partsError);
          setParts([]);
          setLoading(false);
          return;
        }

        // ✅ 4) Filter by category and unit
        const filteredInventory = inventoryParts.filter(
          (p) => p.category === category && p.unit === unit
        );

        if (filteredInventory.length === 0) {
          setParts([]);
          setLoading(false);
          return;
        }

        // ✅ 5) Count interactions for each allowed part
        const allowedIds = new Set(filteredInventory.map((p) => String(p.id)));
        const counts = {};
        interactions.forEach((it) => {
          const pid = String(it.part_id);
          if (allowedIds.has(pid)) {
            counts[pid] = (counts[pid] || 0) + 1;
          }
        });

        // ✅ 6) Sort by count and return top 10
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([pid]) => filteredInventory.find((p) => String(p.id) === String(pid)))
          .filter(Boolean);

        setParts(sorted);
      } catch (err) {
        console.error("⚠️ Unexpected error in fetchParts:", err);
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

      {/* ✅ Filter section */}
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

      {/* ✅ Results list */}
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
