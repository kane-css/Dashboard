import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../supabase';
import "../admincss/AdminManageParts.css";

export default function AdminManageParts() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [unit, setUnit] = useState('All');
  const [products, setProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  
  const showSwal = (options) => {
    const isDarkMode = document.body.classList.contains('dark');
    const theme = {
      background: isDarkMode ? '#1e1e1e' : '#ffffff',
      color: isDarkMode ? '#f1f1f1' : '#111111',
    };
    return Swal.fire({ ...options, ...theme });
  };

  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('inventory_parts')
      .select('*')
      .eq('is_archived', false);
    if (error) {
      console.error('Error fetching products:', error);
      showSwal({ title: 'Error', text: 'Failed to fetch products', icon: 'error' });
    } else {
      setProducts(data || []);
    }
  };

  
  const handleAddStock = async (product) => {
    const { value } = await showSwal({
      title: `Add stock to "${product.model || ''}"`,
      input: 'number',
      inputLabel: 'Enter quantity to add',
      inputAttributes: { min: 1 },
      showCancelButton: true,
      confirmButtonColor: '#4ade80',
      cancelButtonColor: '#6b7280',
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    const { data: latest } = await supabase
      .from('inventory_parts')
      .select('availability')
      .eq('id', product.id)
      .single();

    const newAvail = (parseInt(latest?.availability ?? 0, 10)) + qty;

    const { error } = await supabase
      .from('inventory_parts')
      .update({ availability: newAvail, modified: new Date().toISOString() })
      .eq('id', product.id);

    if (error) {
      showSwal({ title: 'Error', text: 'Failed to add stock', icon: 'error' });
    } else {
      showSwal({ title: 'Success', text: `Added ${qty} to stock.`, icon: 'success' });
      fetchProducts();
    }
  };

  
  const handleMarkAsSold = async (product) => {
    const { value } = await showSwal({
      title: `Mark "${product.model || ''}" as sold`,
      input: 'number',
      inputLabel: 'Enter quantity sold',
      inputAttributes: { min: 1, max: product.availability || 0 },
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;
    if (qty > (product.availability || 0)) {
      showSwal({ title: 'Notice', text: `Only ${(product.availability || 0)} available.`, icon: 'info' });
      return;
    }

    const newSold = (product.sold_quantity || 0) + qty;
    const newAvail = (product.availability || 0) - qty;

    const { error: updateError } = await supabase
      .from('inventory_parts')
      .update({
        sold_quantity: newSold,
        availability: newAvail,
        modified: new Date().toISOString(),
      })
      .eq('id', product.id);

    if (updateError) {
      showSwal({ title: 'Error', text: 'Failed to update sold quantity', icon: 'error' });
      return;
    }

    await supabase.from('sales_history').insert([
      {
        part_id: product.id,
        date_sold: new Date(),
        quantity_sold: qty,
      },
    ]);

    showSwal({ title: 'Success', text: `Marked ${qty} as sold.`, icon: 'success' });
    fetchProducts();
  };

  
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  
  const handleArchiveSelected = async () => {
    if (selectedIds.length === 0) {
      showSwal({ title: 'Notice', text: 'Please select items to archive.', icon: 'info' });
      return;
    }

    const confirm = await showSwal({
      title: 'Archive Selected',
      text: `Are you sure you want to archive ${selectedIds.length} items?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, archive them',
      confirmButtonColor: '#f59e0b',
    });

    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from('inventory_parts')
      .update({ is_archived: true })
      .in('id', selectedIds);

    if (error) {
      showSwal({ title: 'Error', text: 'Failed to archive items.', icon: 'error' });
    } else {
      showSwal({ title: 'Archived', text: 'Selected items archived successfully.', icon: 'success' });
      setSelectedIds([]);
      fetchProducts();
    }
  };

  const normalize = (str) => (str || '').toString().trim();

  const filteredProducts = products
    .filter((product) => {
      const searchText = (search || '').toLowerCase();
      const modelName = (product.model || '').toLowerCase();
      const brandName = (product.brand || '').toLowerCase();
      const matchesSearch =
        !searchText || modelName.includes(searchText) || brandName.includes(searchText);
      const matchesCategory = category === 'All' || product.category === category;
      const matchesUnit = unit === 'All' || product.unit === unit;
      return matchesSearch && matchesCategory && matchesUnit;
    })
    .sort((a, b) => {
      const aBrand = normalize(a.brand).toLowerCase();
      const bBrand = normalize(b.brand).toLowerCase();
      const brandCompare = aBrand.localeCompare(bBrand);
      if (brandCompare !== 0) return brandCompare;
      return normalize(a.model).toLowerCase().localeCompare(normalize(b.model).toLowerCase());
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

          <button className="archive-btn" onClick={handleArchiveSelected}>
            Archive Selected
          </button>
        </div>

        {/* Table */}
        <div className="inventory-table">
          <div
            className="inventory-header"
            style={{
              gridTemplateColumns:
                '40px 1.2fr 2fr 0.9fr 0.9fr 120px 120px 120px 150px',
            }}
          >
            <div></div>
            <div>Brand</div>
            <div>Model Name</div>
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
                  '40px 1.2fr 2fr 0.9fr 0.9fr 120px 120px 120px 150px',
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggleSelect(product.id)}
                />
              </div>
              <div>{product.brand || ''}</div>
              <div>{product.model || ''}</div>
              <div>{product.sold_quantity ?? 0}</div>
              <div>{product.availability ?? 0}</div>
              <div>₱{product.price?.toLocaleString?.() ?? product.price}</div>
              <div>{product.category ?? ''}</div>
              <div>{product.unit ?? ''}</div>
              <div>
                <button
                  className="add-btn"
                  onClick={() => handleAddStock(product)}
                >
                  + Stock
                </button>
                <button
                  className="delete-selected-btn"
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
