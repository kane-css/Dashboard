import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../supabase';
import { X } from 'lucide-react';
import "../ownercss/Inventory.css";

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [unit, setUnit] = useState('All');
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    brand: '',
    model: '',
    added_quantity: '',
    sold_quantity: '',
    price: '',
    category: '',
    unit: '',
  });

  // ✅ Load all non-archived products
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('inventory_parts')
      .select('*')
      .eq('is_archived', false);

    if (error) {
      console.error('Error loading inventory:', error);
      return;
    }

    const stored = JSON.parse(localStorage.getItem('addedStocks') || '{}');
    const merged = data.map((p) => ({
      ...p,
      added_quantity: stored[p.id] || 0,
    }));

    setProducts(merged);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Toggle checkbox
  function handleCheckbox(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Select all
  function handleSelectAll(checked, visibleProducts) {
    if (checked) setSelected(visibleProducts.map((p) => p.id));
    else setSelected([]);
  }

  // 🗂️ Archive selected products
  async function handleArchive() {
    if (!selected.length) {
      Swal.fire('No selection', 'Please select products to archive', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Archive selected?',
      text: 'You can restore them later from Account Settings → Archive.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, archive them',
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from('inventory_parts')
      .update({ is_archived: true })
      .in('id', selected);

    if (error) Swal.fire('Error', 'Failed to archive products', 'error');
    else {
      Swal.fire('Archived!', 'Selected products have been archived.', 'success');
      setSelected([]);
      fetchProducts(); // refresh the list
    }
  }

  // Add stock
  async function handleAddStock(product) {
    const { value, isConfirmed } = await Swal.fire({
      title: `Add stock to "${product.model || product.name}"`,
      input: 'number',
      inputLabel: 'Enter quantity to add',
      inputAttributes: { min: 1 },
      showCancelButton: true,
    });

    if (!isConfirmed) return;
    const qty = Number(value);
    if (!qty || qty <= 0) {
      Swal.fire('Notice', 'Please enter a valid quantity.', 'info');
      return;
    }

    try {
      const { data: latest, error: fetchError } = await supabase
        .from('inventory_parts')
        .select('availability')
        .eq('id', product.id)
        .single();

      if (fetchError) throw fetchError;

      const newAvail = Number(latest?.availability ?? 0) + qty;

      const { error: updateError } = await supabase
        .from('inventory_parts')
        .update({
          availability: newAvail,
          modified: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (updateError) throw updateError;

      const stored = JSON.parse(localStorage.getItem('addedStocks') || '{}');
      stored[product.id] = (stored[product.id] || 0) + qty;
      localStorage.setItem('addedStocks', JSON.stringify(stored));

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                availability: newAvail,
                added_quantity: stored[p.id],
              }
            : p
        )
      );

      Swal.fire('Success', `Added ${qty} stock successfully.`, 'success');
    } catch (error) {
      console.error('Error adding stock:', error);
      Swal.fire('Error', 'Failed to add stock.', 'error');
    }
  }

  // Sold logic
  async function handleMarkAsSold(product) {
    const { value, isConfirmed } = await Swal.fire({
      title: `Mark "${product.model || product.name}" as sold`,
      input: 'number',
      inputLabel: 'Enter quantity sold',
      inputAttributes: { min: 1, max: product.availability },
      showCancelButton: true,
    });

    if (!isConfirmed) return;

    const qty = Number(value);
    if (!qty || qty <= 0 || qty > product.availability) {
      Swal.fire('Notice', 'Invalid quantity.', 'info');
      return;
    }

    try {
      const newAvail = (product.availability || 0) - qty;
      const newSold = (product.sold_quantity || 0) + qty;

      const { error } = await supabase
        .from('inventory_parts')
        .update({
          availability: newAvail,
          sold_quantity: newSold,
          modified: new Date().toISOString(),
        })
        .eq('id', product.id);

      if (error) throw error;

      await supabase.from('sales_history').insert([
        {
          part_id: product.id,
          quantity_sold: qty,
          date_sold: new Date().toISOString(),
        },
      ]);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, availability: newAvail, sold_quantity: newSold }
            : p
        )
      );

      Swal.fire('Success', `${qty} item(s) marked as sold.`, 'success');
    } catch (err) {
      console.error('Error marking as sold:', err);
      Swal.fire('Error', 'Failed to update stock.', 'error');
    }
  }

  // Filtered products
  const filteredProducts = products
    .filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        (p.model && p.model.toLowerCase().includes(searchLower)) ||
        (p.brand && p.brand.toLowerCase().includes(searchLower));
      const matchesCategory = category === 'All' || p.category === category;
      const matchesUnit = unit === 'All' || p.unit === unit;
      return matchesSearch && matchesCategory && matchesUnit;
    })
    .sort((a, b) => a.brand.localeCompare(b.brand));

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

          <button className="add-btn" onClick={() => handleArchive()}>
            Archive
          </button>

          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Products
          </button>
        </div>

        {/* Table */}
        <div className="inventory-table">
          <div
            className="inventory-header"
            style={{
              gridTemplateColumns:
                '48px 1.2fr 2fr 0.9fr 0.9fr 0.9fr 120px 120px 120px 150px',
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
                  '48px 1.2fr 2fr 0.9fr 0.9fr 0.9fr 120px 120px 120px 150px',
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
              <div>{product.added_quantity}</div>
              <div>{product.sold_quantity}</div>
              <div>{product.availability}</div>
              <div>₱{product.price?.toLocaleString()}</div>
              <div>{product.category}</div>
              <div>{product.unit}</div>
              <div>
                <button
                  className="add-btn"
                  style={{ background: '#22c55e', marginRight: 5 }}
                  onClick={() => handleAddStock(product)}
                >
                  + Stock
                </button>
                <button
                  className="delete-selected-btn"
                  style={{ background: '#ff0000ff' }}
                  onClick={() => handleMarkAsSold(product)}
                >
                  - Sold
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
