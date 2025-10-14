import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "../admincss/AdminManageParts.css";
import { supabase } from "../../supabase";
import { X } from "lucide-react";

export default function AdminManageParts() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [unit, setUnit] = useState("All");
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    brand: "",
    model: "",
    availability: "",
    price: "",
    category: "",
    unit: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(2);
    return `${mm}/${dd}/${yy}`;
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("inventory_parts").select("*");
    if (error) {
      Swal.fire("Error", "Failed to fetch products", "error");
    } else {
      const sorted = data.sort((a, b) =>
        a.model.localeCompare(b.model, "en", { sensitivity: "base" })
      );
      setProducts(sorted);
    }
  };

  const handleSelectProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0)
      return Swal.fire("Notice", "No products selected.", "info");

    const confirm = await Swal.fire({
      title: "Delete selected products?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Yes, Delete All",
    });

    if (confirm.isConfirmed) {
      const { error } = await supabase
        .from("inventory_parts")
        .delete()
        .in("id", selectedProducts);

      if (error) {
        Swal.fire("Error", "Failed to delete selected products.", "error");
      } else {
        Swal.fire("Deleted!", "Selected products removed.", "success");
        setSelectedProducts([]);
        fetchProducts();
      }
    }
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.brand ||
      !newProduct.model ||
      !newProduct.category ||
      !newProduct.unit ||
      !newProduct.availability ||
      !newProduct.price
    ) {
      return Swal.fire("Error", "Please fill all fields.", "error");
    }

    const today = new Date().toISOString();

    if (editProduct) {
      // Update existing product
      const { error } = await supabase
        .from("inventory_parts")
        .update({
          brand: newProduct.brand,
          model: newProduct.model,
          category: newProduct.category,
          unit: newProduct.unit,
          availability: parseInt(newProduct.availability),
          price: parseFloat(newProduct.price),
          modified: today,
        })
        .eq("id", editProduct.id);

      if (error) {
        Swal.fire("Error", "Failed to update product.", "error");
      } else {
        Swal.fire("Updated!", "Product updated successfully!", "success");
        setShowModal(false);
        setEditProduct(null);
        resetForm();
        fetchProducts();
      }
    } else {
      // Add new product
      const { error } = await supabase.from("inventory_parts").insert([
        {
          brand: newProduct.brand,
          model: newProduct.model,
          category: newProduct.category,
          unit: newProduct.unit,
          availability: parseInt(newProduct.availability),
          price: parseFloat(newProduct.price),
          modified: today,
        },
      ]);

      if (error) {
        Swal.fire("Error", "Failed to add product.", "error");
      } else {
        Swal.fire("Success", "Product added successfully!", "success");
        setShowModal(false);
        resetForm();
        fetchProducts();
      }
    }
  };

  const resetForm = () => {
    setNewProduct({
      brand: "",
      model: "",
      availability: "",
      price: "",
      category: "",
      unit: "",
    });
  };

  // ✅ Add Stock / Sold functions with custom input modal
  const handleStockChange = async (product, action) => {
    const { value: qty } = await Swal.fire({
      title: action === "add" ? "Add Stock" : "Mark as Sold",
      input: "number",
      inputLabel: "Enter quantity",
      inputPlaceholder: "e.g. 5",
      inputAttributes: { min: 1 },
      showCancelButton: true,
      confirmButtonText: "Update",
      confirmButtonColor: "#111827",
    });

    if (!qty || qty <= 0) return;

    const newAvailability =
      action === "add"
        ? product.availability + parseInt(qty)
        : Math.max(product.availability - parseInt(qty), 0);

    const today = new Date().toISOString();

    const { error } = await supabase
      .from("inventory_parts")
      .update({
        availability: newAvailability,
        modified: today,
      })
      .eq("id", product.id);

    if (error) {
      Swal.fire("Error", "Failed to update stock.", "error");
    } else {
      Swal.fire(
        "Success!",
        `Stock ${action === "add" ? "increased" : "decreased"} by ${qty}.`,
        "success"
      );
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchText = search.toLowerCase();
    const matchesSearch =
      product.model.toLowerCase().includes(searchText) ||
      product.brand.toLowerCase().includes(searchText);
    const matchesCategory = category === "All" || product.category === category;
    const matchesUnit = unit === "All" || product.unit === unit;
    return matchesSearch && matchesCategory && matchesUnit;
  });

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

          <button
            className="add-btn"
            onClick={() => {
              if (selectedProducts.length !== 1) {
                Swal.fire(
                  "Notice",
                  "Please select exactly one product to edit.",
                  "info"
                );
                return;
              }
              const productToEdit = products.find(
                (p) => p.id === selectedProducts[0]
              );
              setEditProduct(productToEdit);
              setNewProduct({
                brand: productToEdit.brand,
                model: productToEdit.model,
                availability: productToEdit.availability,
                price: productToEdit.price,
                category: productToEdit.category,
                unit: productToEdit.unit,
              });
              setShowModal(true);
            }}
          >
            ✎ Edit Product
          </button>

          <button
            className="add-btn"
            onClick={() => {
              setEditProduct(null);
              resetForm();
              setShowModal(true);
            }}
          >
            + Add Products
          </button>

          <button
            className="delete-selected-btn"
            onClick={handleDeleteSelected}
            disabled={selectedProducts.length === 0}
          >
            Delete Selected
          </button>
        </div>

        {/* Table */}
        <div className="inventory-table">
          <div className="inventory-header">
            <div>
              <input
                type="checkbox"
                checked={
                  selectedProducts.length > 0 &&
                  selectedProducts.length === filteredProducts.length
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </div>
            <div>Brand</div>
            <div>Model Name</div>
            <div>Unit</div>
            <div>Availability</div>
            <div>Price</div>
            <div>Modified</div>
            <div>Action</div>
          </div>

          {filteredProducts.map((product) => (
            <div className="inventory-row" key={product.id}>
              <div>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleSelectProduct(product.id)}
                />
              </div>
              <div>{product.brand}</div>
              <div>{product.model}</div>
              <div>{product.unit}</div>
              <div>{product.availability}</div>
              <div>₱{product.price}</div>
              <div>{formatDate(product.modified)}</div>
              <div>
                <button
                  className="add-stock-btn"
                  onClick={() => handleStockChange(product, "add")}
                >
                  Add Stock
                </button>
                <button
                  className="sold-btn"
                  onClick={() => handleStockChange(product, "sold")}
                >
                  Mark as Sold
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
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
                placeholder="Availability"
                value={newProduct.availability}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, availability: e.target.value })
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
              <button className="add-btn" onClick={handleAddProduct}>
                {editProduct ? "Save Changes" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
