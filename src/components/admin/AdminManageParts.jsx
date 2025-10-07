import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../admincss/AdminManageParts.css';
import { supabase } from '../../supabase';

export default function AdminManageParts() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [unit, setUnit] = useState('All');
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [newProduct, setNewProduct] = useState({
    brand: '',
    name: '',
    availability: '',
    price: '',
    category: '',
    unit: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(2);
    return `${mm}/${dd}/${yy}`;
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('inventory_parts').select('*');
    if (error) {
      Swal.fire('Error', 'Failed to fetch products', 'error');
    } else {
      // Sort alphabetically by name
      const sorted = data.sort((a, b) =>
        a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
      );
      setProducts(sorted);
    }
  };

  const handleSaveProduct = async () => {
    const { brand, name, availability, price, category, unit } = newProduct;

    if (!brand || !name || !availability || !price || !category || !unit) {
      Swal.fire('Warning', 'Please fill out all fields.', 'warning');
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) {
      Swal.fire('Invalid price', 'Please enter a valid number.', 'warning');
      return;
    }

    const today = new Date().toISOString();

    const { error } = await supabase.from('inventory_parts').insert([
      {
        brand,
        name,
        availability,
        price: priceNumber,
        category,
        unit,
        modified: today,
      },
    ]);

    if (error) {
      Swal.fire('Error', `Failed to add product: ${error.message}`, 'error');
    } else {
      Swal.fire('Success', 'Product added successfully!', 'success');
      setNewProduct({
        brand: '',
        name: '',
        availability: '',
        price: '',
        category: '',
        unit: '',
      });
      setShowModal(false);
      fetchProducts();
    }
  };

  const handleMarkAsSold = async (product) => {
    const { value: soldQty } = await Swal.fire({
      title: `Mark "${product.name}" as Sold`,
      input: 'number',
      inputLabel: 'Enter quantity sold',
      inputPlaceholder: 'e.g. 5',
      showCancelButton: true,
      confirmButtonText: 'Confirm',
      inputAttributes: {
        min: 1,
        max: product.availability,
      },
      inputValidator: (value) => {
        if (!value) return 'Please enter a number!';
        if (value <= 0) return 'Quantity must be greater than 0!';
        if (value > product.availability)
          return `Only ${product.availability} available!`;
      },
    });

    if (soldQty) {
      const newAvailability = product.availability - soldQty;

      const { error } = await supabase
        .from('inventory_parts')
        .update({ availability: newAvailability })
        .eq('id', product.id);

      if (error) {
        Swal.fire('Error', 'Failed to update product.', 'error');
      } else {
        Swal.fire('Updated!', `${soldQty} item(s) marked as sold.`, 'success');
        fetchProducts();
      }
    }
  };

  const handleAddStock = async (product) => {
    const { value: addQty } = await Swal.fire({
      title: `Add stock to "${product.name}"`,
      input: 'number',
      inputLabel: 'Enter quantity to add',
      inputPlaceholder: 'e.g. 10',
      showCancelButton: true,
      confirmButtonText: 'Add',
      inputAttributes: {
        min: 1,
      },
      inputValidator: (value) => {
        if (!value) return 'Please enter a number!';
        if (value <= 0) return 'Quantity must be greater than 0!';
      },
    });

    if (addQty) {
      const newAvailability =
        parseInt(product.availability) + parseInt(addQty);

      const { error } = await supabase
        .from('inventory_parts')
        .update({ availability: newAvailability })
        .eq('id', product.id);

      if (error) {
        Swal.fire('Error', 'Failed to add stock.', 'error');
      } else {
        Swal.fire('Success', `${addQty} stock(s) added!`, 'success');
        fetchProducts();
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = category === 'All' || product.category === category;
    const matchesUnit = unit === 'All' || product.unit === unit;
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
            <option>Exhaust</option>
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
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Products
          </button>
        </div>

        <div className="inventory-table">
          <div className="inventory-header">
            <div className="product-brand">Brand</div>
            <div className="product-name">Product Name</div>
            <div className="product-available">Availability</div>
            <div className="product-price">Price</div>
            <div className="product-modified">Modified</div>
            <div className="product-action">Action</div>
          </div>

          {filteredProducts.map((product) => (
            <div className="inventory-row" key={product.id}>
              <div className="product-brand">{product.brand}</div>
              <div className="product-name">{product.name}</div>
              <div className="product-available">{product.availability}</div>
              <div className="product-price">₱{product.price}</div>
              <div className="product-modified">
                {formatDate(product.modified)}
              </div>
              <div className="product-action">
                <button
                  className="add-stock-btn"
                  onClick={() => handleAddStock(product)}
                >
                  Add Stock
                </button>
                <button
                  className="sold-btn"
                  onClick={() => handleMarkAsSold(product)}
                >
                  Mark as Sold
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Add Product</h3>
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
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Availability"
              value={newProduct.availability}
              onChange={(e) =>
                setNewProduct({ ...newProduct, availability: e.target.value })
              }
            />
            <input
              type="text"
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
              <option value="Exhaust">Exhaust</option>
              <option value="Rear Shock">Rear Shock</option>
              <option value="Disc Brake">Disc Brake</option>
              <option value="Calipher">Calipher</option>
            </select>
            <select
              value={newProduct.unit}
              onChange={(e) =>
                setNewProduct({ ...newProduct, unit: e.target.value })
              }
            >
              <option value="">Select Unit</option>
              <option value="Aerox">Aerox</option>
              <option value="Nmax">Nmax</option>
            </select>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveProduct}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
