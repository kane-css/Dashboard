import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../ownercss/Inventory.css';
import { supabase } from '../../supabase';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [unit, setUnit] = useState('All');

  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    availability: '',
    price: '',
    category: '',
    unit: '',
  });

  // Fetch products from Supabase on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('inventory_parts').select('*');

    if (error) {
      console.error('Error fetching products:', error);
      Swal.fire('Error', 'Failed to fetch products', 'error');
    } else {
      setProducts(data);
    }
  };

  const handleCheckbox = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((i) => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleDelete = async () => {
    if (selected.length === 0) {
      Swal.fire('No selection', 'Please select products to delete', 'warning');
      return;
    }

    const { error } = await supabase.from('inventory_parts').delete().in('id', selected);

    if (error) {
      Swal.fire('Error', 'Failed to delete products', 'error');
    } else {
      Swal.fire('Deleted!', 'Selected products have been deleted.', 'success');
      setSelected([]);
      fetchProducts();
    }
  };

  const handleSaveProduct = async () => {
    const { name, availability, price, category, unit } = newProduct;

    if (!name || !availability || !price || !category || !unit) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Fields',
        text: 'Please fill out all fields before saving.',
      });
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber)) {
      Swal.fire('Invalid price', 'Please enter a valid number for price.', 'warning');
      return;
    }

    const today = new Date().toISOString();

    const { data, error } = await supabase.from('inventory_parts').insert([
      {
        name,
        availability,
        price: priceNumber,
        category,
        unit,
        modified: today,
      },
    ]);

    if (error) {
      console.error('Insert error:', error);
      Swal.fire('Error', `Failed to add product: ${error.message}`, 'error');
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Product added successfully!',
        showConfirmButton: false,
        timer: 1500,
      });
      setNewProduct({
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

  // Filtered display based on search, category, and unit
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
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
          <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Products</button>
        </div>

        <div className="inventory-table">
          <div className="inventory-header">
            <div className="checkbox-col"></div>
            <div className="product-name">Product Name</div>
            <div className="product-available">Availability</div>
            <div className="product-price">Price</div>
            <div className="product-modified">Modified</div>
          </div>

          {filteredProducts.map((product) => (
            <div className="inventory-row" key={product.id}>
              <div className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => handleCheckbox(product.id)}
                />
              </div>
              <div className="product-name">{product.name}</div>
              <div className="product-available">{product.availability}</div>
              <div className="product-price">{product.price}</div>
              <div className="product-modified">{product.modified}</div>
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
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Availability"
              value={newProduct.availability}
              onChange={(e) => setNewProduct({ ...newProduct, availability: e.target.value })}
            />
            <input
              type="text"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Exhaust">Exhaust</option>
              <option value="Rear Shock">Rear Shock</option>
              <option value="Disc Brake">Disc Brake</option>
              <option value="Calipher">Calipher</option>
            </select>
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
            >
              <option value="">Select Unit</option>
              <option value="Aerox">Aerox</option>
              <option value="Nmax">Nmax</option>
            </select>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveProduct}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}