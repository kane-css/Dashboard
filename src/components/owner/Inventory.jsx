import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../supabase";
import "../ownercss/Inventory.css";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [unit, setUnit] = useState("All");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    brand: "",
    model: "",
    added_quantity: "",
    sold_quantity: "",
    price: "",
    category: "",
    unit: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("inventory_parts")
      .select("*")
      .eq("is_archived", false);

    if (error) {
      console.error("Error fetching products:", error);
      customSwal("Error", "Failed to fetch products", "error");
    } else {
      setProducts(data || []);
    }
  };

  const customSwal = (title, text, icon) => {
    const isDarkMode = document.body.classList.contains("dark");
    Swal.fire({
      title,
      text,
      icon,
      background: isDarkMode ? "#1e1e1e" : "#ffffff",
      color: isDarkMode ? "#f1f1f1" : "#111111",
      confirmButtonColor: isDarkMode ? "#3b82f6" : "#2563eb",
    });
  };

  const handleCheckbox = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked, list) => {
    if (checked) setSelected(list.map((p) => p.id));
    else setSelected([]);
  };

  const handleArchiveSelected = async () => {
    if (selected.length === 0)
      return customSwal("Notice", "Select at least one product to archive.", "info");

    const confirm = await Swal.fire({
      title: "Archive Selected Products?",
      text: `You are about to archive ${selected.length} product(s).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Archive",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("inventory_parts")
      .update({ is_archived: true })
      .in("id", selected);

    if (error) {
      console.error("Error archiving:", error);
      customSwal("Error", "Failed to archive selected products.", "error");
    } else {
      setProducts((prev) => prev.filter((p) => !selected.includes(p.id)));
      setSelected([]);
      customSwal("Success", "Selected products have been archived.", "success");
    }
  };

  const handleAddStock = async (product) => {
    const { value } = await Swal.fire({
      title: `Add stock to "${product.model}"`,
      input: "number",
      inputLabel: "Enter quantity to add",
      inputAttributes: { min: 1 },
      showCancelButton: true,
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    const newAvail = parseInt(product.availability || 0, 10) + qty;
    const { error } = await supabase
      .from("inventory_parts")
      .update({ availability: String(newAvail) })
      .eq("id", product.id);

    if (error) customSwal("Error", "Failed to update stock.", "error");
    else {
      fetchProducts();
      customSwal("Success", `Added ${qty} to stock.`, "success");
    }
  };

  const handleMarkAsSold = async (product) => {
    const { value } = await Swal.fire({
      title: `Mark "${product.model}" as sold`,
      input: "number",
      inputLabel: "Enter quantity sold",
      inputAttributes: { min: 1, max: product.availability || 0 },
      showCancelButton: true,
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    const newAvail = parseInt(product.availability || 0, 10) - qty;
    const newSold = parseInt(product.sold_quantity || 0, 10) + qty;

    const { error } = await supabase
      .from("inventory_parts")
      .update({
        sold_quantity: String(newSold),
        availability: String(newAvail),
      })
      .eq("id", product.id);

    if (error) customSwal("Error", "Failed to mark as sold.", "error");
    else {
      fetchProducts();
      customSwal("Success", `Marked ${qty} as sold.`, "success");
    }
  };

  const handleTopEdit = () => {
    if (selected.length !== 1)
      return customSwal("Notice", "Select one product to edit.", "info");

    const toEdit = products.find((p) => p.id === selected[0]);
    if (!toEdit) return customSwal("Error", "Product not found.", "error");

    setEditProduct(toEdit);
    setNewProduct({
      brand: toEdit.brand || "",
      model: toEdit.model || "",
      price: toEdit.price || "",
      category: toEdit.category || "",
      unit: toEdit.unit || "",
    });
    setShowModal(true);
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("inventory_parts")
      .update(newProduct)
      .eq("id", editProduct.id);

    if (error) customSwal("Error", "Failed to save changes.", "error");
    else {
      customSwal("Success", "Product updated successfully.", "success");
      setShowModal(false);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch = !s || p.model?.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s);
    const matchCategory = category === "All" || p.category === category;
    const matchUnit = unit === "All" || p.unit === unit;
    return matchSearch && matchCategory && matchUnit;
  });

  const allVisibleSelected =
    filteredProducts.length > 0 && selected.length === filteredProducts.length;

  const isDark = document.body.classList.contains("dark");

  return (
    <div className="inventory-container">
      <div className="inventory-card">
        <div className="inventory-controls">
          <input
            type="text"
            className="inventory-search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="inventory-dropdown"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option>Swing Arm</option>
            <option>Rear Shock</option>
            <option>Disc Brake</option>
            <option>Calipher</option>
          </select>
          <select
            className="inventory-dropdown"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            <option value="All">All Units</option>
            <option>Aerox</option>
            <option>Nmax</option>
          </select>

          <button className="add-btn" onClick={handleTopEdit}>✎ Edit Product</button>
          <button className="archive-btn" onClick={handleArchiveSelected}>
            Archive Selected
          </button>
        </div>

        <div className="inventory-table">
          <div className="inventory-header" style={{
            gridTemplateColumns: "40px 1fr 1.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1.2fr",
          }}>
            <div>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) =>
                  handleSelectAll(e.target.checked, filteredProducts)
                }
              />
            </div>
            <div>Brand</div>
            <div>Model</div>
            <div>Added</div>
            <div>Sold</div>
            <div>Available</div>
            <div>Price</div>
            <div>Category</div>
            <div>Unit</div>
            <div>Actions</div>
          </div>

          {filteredProducts.map((product) => (
            <div
              className="inventory-row"
              key={product.id}
              style={{
                gridTemplateColumns:
                  "40px 1fr 1.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1.2fr",
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => handleCheckbox(product.id)}
                />
              </div>
              <div>{product.brand}</div>
              <div>{product.model}</div>
              <div>{product.added_quantity ?? 0}</div>
              <div>{product.sold_quantity ?? 0}</div>
              <div>{product.availability ?? 0}</div>
              <div>₱{product.price}</div>
              <div>{product.category}</div>
              <div>{product.unit}</div>
              <div>
                <button
                  className="add-btn"
                  style={{ background: "#22c55e", marginRight: "5px" }}
                  onClick={() => handleAddStock(product)}
                >
                  + Stock
                </button>
                <button
                  className="delete-selected-btn"
                  style={{ background: "#ff0000ff" }}
                  onClick={() => handleMarkAsSold(product)}
                >
                  - Sold
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✏️ MODAL FOR EDIT (Now Dark/Light Mode Compatible) */}
      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal"
            style={{
              backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
              color: isDark ? "#f1f1f1" : "#111111",
              boxShadow: isDark
                ? "0 0 10px rgba(255,255,255,0.1)"
                : "0 0 10px rgba(0,0,0,0.2)",
              border: isDark ? "1px solid #333" : "1px solid #ddd",
            }}
          >
            <h2>Edit Product</h2>

            <label>Brand:</label>
            <input
              value={newProduct.brand}
              onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                color: isDark ? "#f1f1f1" : "#111",
              }}
            />

            <label>Model:</label>
            <input
              value={newProduct.model}
              onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                color: isDark ? "#f1f1f1" : "#111",
              }}
            />

            <label>Price:</label>
            <input
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                color: isDark ? "#f1f1f1" : "#111",
              }}
            />

            <label>Category:</label>
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="inventory-dropdown"
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                color: isDark ? "#f1f1f1" : "#111",
              }}
            >
              <option value="">Select Category</option>
              <option>Swing Arm</option>
              <option>Rear Shock</option>
              <option>Disc Brake</option>
              <option>Calipher</option>
            </select>

            <label>Unit:</label>
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              className="inventory-dropdown"
              style={{
                backgroundColor: isDark ? "#2a2a2a" : "#f9f9f9",
                color: isDark ? "#f1f1f1" : "#111",
              }}
            >
              <option value="">Select Unit</option>
              <option>Aerox</option>
              <option>Nmax</option>
            </select>

            <div className="modal-buttons">
              <button
                className="add-btn"
                style={{
                  background: isDark ? "#3b82f6" : "#000",
                  color: "#fff",
                }}
                onClick={handleSaveEdit}
              >
                Save
              </button>
              <button
                className="delete-selected-btn"
                style={{
                  background: isDark ? "#dc2626" : "#ff4d4d",
                  color: "#fff",
                }}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
