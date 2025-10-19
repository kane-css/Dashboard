import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../supabase";
import { X } from "lucide-react";
import "../ownercss/Inventory.css";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [unit, setUnit] = useState("All");

  // ✅ Load products from localStorage first
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("inventoryProducts");
    return saved ? JSON.parse(saved) : [];
  });

  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    brand: "",
    model: "",
    added_quantity: "",
    sold_quantity: "",
    availability: "",
    price: "",
    category: "",
    unit: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  // ✅ Save to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem("inventoryProducts", JSON.stringify(products));
  }, [products]);

  // ✅ Fetch products and preserve frontend-only "added_quantity"
  const fetchProducts = async () => {
    const { data, error } = await supabase.from("inventory_parts").select("*");
    if (error) {
      console.error("Error fetching products:", error);
      customSwal("Error", "Failed to fetch products", "error");
    } else {
      setProducts((prev) => {
        const prevMap = new Map(prev.map((p) => [p.id, p.added_quantity || 0]));
        return (data || []).map((item) => ({
          ...item,
          added_quantity: prevMap.get(item.id) || 0,
        }));
      });
    }
  };

  // ✅ Custom SweetAlert with Dark Mode
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

  const handleDelete = async () => {
    if (selected.length === 0) {
      return customSwal("No selection", "Please select products to delete", "warning");
    }
    const isDarkMode = document.body.classList.contains("dark");
    const confirm = await Swal.fire({
      title: "Delete selected?",
      text: "This cannot be undone",
      icon: "warning",
      showCancelButton: true,
      background: isDarkMode ? "#1e1e1e" : "#ffffff",
      color: isDarkMode ? "#f1f1f1" : "#111111",
    });
    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from("inventory_parts")
      .delete()
      .in("id", selected);
    if (error) {
      customSwal("Error", "Failed to delete products", "error");
    } else {
      customSwal("Deleted!", "Selected products removed.", "success");
      setSelected([]);
      fetchProducts();
    }
  };

  // ✅ + Stock
  const handleAddStock = async (product, qtyOverride = null) => {
    const isDarkMode = document.body.classList.contains("dark");
    let qty = qtyOverride;

    if (qty === null) {
      const { value } = await Swal.fire({
        title: `Add stock to "${product.model || ""}"`,
        input: "number",
        inputLabel: "Enter quantity to add",
        inputAttributes: { min: 1 },
        showCancelButton: true,
        background: isDarkMode ? "#1e1e1e" : "#ffffff",
        color: isDarkMode ? "#f1f1f1" : "#111111",
      });
      qty = parseInt(value, 10);
    }

    if (!qty || qty <= 0) return;

    const currentAvail = parseInt(product.availability || 0, 10);
    const currentAdded = parseInt(product.added_quantity || 0, 10);
    const newAvail = currentAvail + qty;
    const newAdded = currentAdded + qty;

    const updatedProducts = products.map((p) =>
      p.id === product.id
        ? { ...p, added_quantity: newAdded, availability: newAvail }
        : p
    );
    setProducts(updatedProducts);

    const { error } = await supabase
      .from("inventory_parts")
      .update({
        availability: String(newAvail),
        modified: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error)
      customSwal("Error", "Failed to update stock in database", "error");
    else if (qtyOverride === null)
      customSwal("Success", `Added ${qty} to stock.`, "success");
  };

  // ✅ - Sold
  const handleMarkAsSold = async (product) => {
    const isDarkMode = document.body.classList.contains("dark");
    const { value } = await Swal.fire({
      title: `Mark "${product.model || ""}" as sold`,
      input: "number",
      inputLabel: "Enter quantity sold",
      inputAttributes: { min: 1, max: product.availability || 0 },
      showCancelButton: true,
      background: isDarkMode ? "#1e1e1e" : "#ffffff",
      color: isDarkMode ? "#f1f1f1" : "#111111",
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    const currentAvail = parseInt(product.availability || 0, 10);
    const currentSold = parseInt(product.sold_quantity || 0, 10);

    if (qty > currentAvail) {
      return customSwal("Notice", `Only ${currentAvail} available.`, "info");
    }

    const newAvail = currentAvail - qty;
    const newSold = currentSold + qty;

    const updatedProducts = products.map((p) =>
      p.id === product.id
        ? { ...p, sold_quantity: newSold, availability: newAvail }
        : p
    );
    setProducts(updatedProducts);

    const { error } = await supabase
      .from("inventory_parts")
      .update({
        sold_quantity: String(newSold),
        availability: String(newAvail),
        modified: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error)
      customSwal("Error", "Failed to update sold quantity", "error");
    else customSwal("Success", `Marked ${qty} as sold.`, "success");
  };

  const handleSaveProduct = async () => {
    const isDarkMode = document.body.classList.contains("dark");
    if (
      !newProduct.model ||
      !newProduct.price ||
      !newProduct.category ||
      !newProduct.unit
    ) {
      return Swal.fire({
        title: "Incomplete Fields",
        text: "Please fill all required fields.",
        icon: "warning",
        background: isDarkMode ? "#1e1e1e" : "#ffffff",
        color: isDarkMode ? "#f1f1f1" : "#111111",
      });
    }

    const priceValue =
      parseFloat(String(newProduct.price).replace(/[₱,]/g, "")) || 0;

    try {
      if (editProduct) {
        const addedQty = parseInt(newProduct.added_quantity || 0, 10);
        const currentAvail = parseInt(editProduct.availability || 0, 10);
        const newAvail = currentAvail + addedQty;

        const updatedProducts = products.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                brand: newProduct.brand,
                model: newProduct.model,
                added_quantity: (p.added_quantity || 0) + addedQty,
                availability: newAvail,
                price: priceValue,
                category: newProduct.category,
                unit: newProduct.unit,
              }
            : p
        );
        setProducts(updatedProducts);

        const { error } = await supabase
          .from("inventory_parts")
          .update({
            availability: String(newAvail),
            brand: newProduct.brand,
            model: newProduct.model,
            price: priceValue,
            category: newProduct.category,
            unit: newProduct.unit,
            modified: new Date().toISOString(),
          })
          .eq("id", editProduct.id);

        if (error) throw error;
        customSwal("Updated", "Product updated successfully", "success");
      } else {
        const addedQty = parseInt(newProduct.added_quantity || 0);
        const soldQty = parseInt(newProduct.sold_quantity || 0);

        const insertData = {
          brand: newProduct.brand,
          model: newProduct.model,
          sold_quantity: String(soldQty),
          availability: String(
            addedQty - soldQty >= 0 ? addedQty - soldQty : 0
          ),
          price: priceValue,
          category: newProduct.category,
          unit: newProduct.unit,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("inventory_parts")
          .insert([insertData]);
        if (error) throw error;

        customSwal("Added", "Product added successfully", "success");
      }

      setShowModal(false);
      setEditProduct(null);
      setNewProduct({
        brand: "",
        model: "",
        added_quantity: "",
        sold_quantity: "",
        availability: "",
        price: "",
        category: "",
        unit: "",
      });
      fetchProducts();
    } catch (error) {
      console.error("Save product error:", error.message);
      customSwal("Error", "Failed to save product", "error");
    }
  };

  const handleTopEdit = () => {
    if (selected.length !== 1) {
      return customSwal("Notice", "Please select exactly one product to edit.", "info");
    }
    const toEdit = products.find((p) => p.id === selected[0]);
    if (!toEdit) return customSwal("Error", "Selected product not found", "error");

    setEditProduct(toEdit);
    setNewProduct({
      brand: toEdit.brand || "",
      model: toEdit.model || "",
      added_quantity: "",
      sold_quantity: toEdit.sold_quantity || "",
      price: toEdit.price || "",
      category: toEdit.category || "",
      unit: toEdit.unit || "",
    });
    setShowModal(true);
  };

  const normalize = (str) => (str || "").toString().trim();

  const filteredProducts = products
    .filter((product) => {
      const searchText = (search || "").toLowerCase();
      const matchesSearch =
        !searchText ||
        product.model?.toLowerCase().includes(searchText) ||
        product.brand?.toLowerCase().includes(searchText);
      const matchesCategory =
        category === "All" || product.category === category;
      const matchesUnit = unit === "All" || product.unit === unit;
      return matchesSearch && matchesCategory && matchesUnit;
    })
    .sort((a, b) => {
      const brandCompare = normalize(a.brand).localeCompare(normalize(b.brand));
      return brandCompare !== 0
        ? brandCompare
        : normalize(a.model).localeCompare(normalize(b.model));
    });

  const allVisibleSelected =
    filteredProducts.length > 0 && selected.length === filteredProducts.length;

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

          <button className="add-btn" onClick={handleTopEdit}>
            ✎ Edit Product
          </button>

          <button
            className="add-btn"
            onClick={() => {
              setEditProduct(null);
              setNewProduct({
                brand: "",
                model: "",
                added_quantity: "",
                sold_quantity: "",
                availability: "",
                price: "",
                category: "",
                unit: "",
              });
              setShowModal(true);
            }}
          >
            + Add Products
          </button>

          <button
            className="delete-selected-btn"
            onClick={handleDelete}
            disabled={selected.length === 0}
          >
            Delete Selected
          </button>
        </div>

        {/* TABLE */}
        <div className="inventory-table">
          <div
            className="inventory-header"
            style={{
              gridTemplateColumns:
                "40px 1fr 1.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1.2fr",
            }}
          >
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

              <div>{product.brand || ""}</div>
              <div>{product.model || ""}</div>
              <div>{product.added_quantity ?? 0}</div>
              <div>{product.sold_quantity ?? 0}</div>
              <div>{product.availability ?? 0}</div>
              <div>₱{product.price?.toLocaleString?.() ?? product.price}</div>
              <div>{product.category ?? ""}</div>
              <div>{product.unit ?? ""}</div>

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

      {/* ADD/EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ width: 460, maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h2>{editProduct ? "Edit Product" : "Add Product"}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <input
                type="text"
                placeholder="Brand"
                value={newProduct.brand}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, brand: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Model Name"
                value={newProduct.model}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, model: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Added Quantity"
                value={newProduct.added_quantity}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    added_quantity: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Sold Quantity"
                value={newProduct.sold_quantity}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    sold_quantity: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />
              <select
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              >
                <option value="">Select Category</option>
                <option>Swing Arm</option>
                <option>Rear Shock</option>
                <option>Disc Brake</option>
                <option>Calipher</option>
              </select>
              <select
                value={newProduct.unit}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, unit: e.target.value })
                }
              >
                <option value="">Select Unit</option>
                <option>Aerox</option>
                <option>Nmax</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="add-btn" onClick={handleSaveProduct}>
                {editProduct ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
