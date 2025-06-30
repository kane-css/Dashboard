import React, { useState } from 'react';
import './CustomizedParts.css';

export default function CustomizedParts() {
  const [dateFilter, setDateFilter] = useState('Last 3 days');
  const [category, setCategory] = useState('Rear Shock');
  const [unit, setUnit] = useState('Aerox V2');

  const parts = [
    {
      id: 1,
      name: 'ÖHLINS 395mm',
    },
    // Add more parts here if needed
  ];

  return (
    <div className="custom-container">
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
        {parts.map((part, index) => (
          <div className="custom-part-row" key={part.id}>
            <span className="part-index">{index + 1}.</span>
            <span className="part-name">{part.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
