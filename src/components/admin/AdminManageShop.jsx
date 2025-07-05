import React, { useState } from "react";
import {
  FaSearch,
  FaEdit,
  FaBan,
  FaCheck,
  FaTrash,
  FaUserCircle,
} from "react-icons/fa";
import "../admincss/AdminManageShop.css";

export default function AdminManageShop({ onLogout }) {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Admin Manage Parts</h1>
      <p>This is a placeholder for AdminManageShop UI.</p>
      <button onClick={onLogout}>Log Out</button>
    </div>
  );
}