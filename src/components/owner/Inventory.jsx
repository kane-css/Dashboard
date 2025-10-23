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

  useEffect(() => {
  const loadInventory = async () => {
    const { data, error } = await supabase.from('inventory_parts').select('*');
    if (error) {
      console.error('Error loading inventory:', error);
      return;
    }

    // ✅ Load added quantities from localStorage
    const stored = JSON.parse(localStorage.getItem('addedStocks') || '{}');

    // ✅ Merge local "added" data with database data
    const merged = data.map((p) => ({
      ...p,
      added_quantity: stored[p.id] || 0,
    }));

    setProducts(merged);
  };

  loadInventory();
}, []);


  // Toggle product selection
  function handleCheckbox(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // Select/Deselect all visible products
  function handleSelectAll(checked, visibleProducts) {
    if (checked) setSelected(visibleProducts.map((p) => p.id));
    else setSelected([]);
  }

  // Delete selected products
  async function handleDelete() {
    if (!selected.length) {
      Swal.fire('No selection', 'Please select products to delete', 'warning');
      return;
    }
    const result = await Swal.fire({
      title: 'Delete selected?',
      text: 'This cannot be undone',
      icon: 'warning',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    const { error } = await supabase.from('inventory_parts').delete().in('id', selected);
    if (error) Swal.fire('Error', 'Failed to delete products', 'error');
    else {
      Swal.fire('Deleted!', 'Selected products removed.', 'success');
      setSelected([]);
      fetchProducts();
    }
  }

  // Add stock to a product
  // Add stock to a product — persistent version
// Add stock to a product — local tracking for "Added" only (persistent via localStorage)
async function handleAddStock(product) {
  const { value, isConfirmed } = await Swal.fire({
    title: `Add stock to "${product.model || product.name}"`,
    input: 'number',
    inputLabel: 'Enter quantity to add',
    inputAttributes: { min: 1 },
    showCancelButton: true,
  });

  if (!isConfirmed) return; // user canceled
  const qty = Number(value);
  if (!qty || qty <= 0) {
    Swal.fire('Notice', 'Please enter a valid quantity.', 'info');
    return;
  }

  try {
    // Fetch the latest product from DB
    const { data: latest, error: fetchError } = await supabase
      .from('inventory_parts')
      .select('availability')
      .eq('id', product.id)
      .single();

    if (fetchError) throw fetchError;

    const newAvail = Number(latest?.availability ?? 0) + qty;

    // Update only the availability field in Supabase
    const { error: updateError } = await supabase
      .from('inventory_parts')
      .update({
        availability: newAvail,
        modified: new Date().toISOString(),
      })
      .eq('id', product.id);

    if (updateError) throw updateError;

    // ✅ Retrieve saved added quantities from localStorage
    const stored = JSON.parse(localStorage.getItem('addedStocks') || '{}');

    // ✅ Update the added quantity for this product
    stored[product.id] = (stored[product.id] || 0) + qty;

    // ✅ Save it back to localStorage
    localStorage.setItem('addedStocks', JSON.stringify(stored));

    // ✅ Update UI (state)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              availability: newAvail,
              added_quantity: stored[p.id], // use saved value
            }
          : p
      )
    );

    Swal.fire('Success', `Added ${qty} stock successfully.`, 'success');
  } catch (error) {
    console.error('Error adding stock:', error);
    Swal.fire('Error', 'Failed to add stock. Check console for details.', 'error');
  }
}


  // Mark product as sold and log to sales history
  // 🛒 Mark product as sold and update both availability + sold_quantity
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
    Swal.fire('Notice', 'Please enter a valid quantity.', 'info');
    return;
  }

  try {
    // Compute new values
    const newAvail = (product.availability || 0) - qty;
    const newSold = (product.sold_quantity || 0) + qty;

    // 🧾 Update in Supabase
    const { error } = await supabase
      .from('inventory_parts')
      .update({
        availability: newAvail,
        sold_quantity: newSold,
        modified: new Date().toISOString(),
      })
      .eq('id', product.id);

    if (error) throw error;

    // 💾 Record sale in sales_history (for dashboard)
    await supabase.from('sales_history').insert([
      {
        part_id: product.id,
        quantity_sold: qty,
        date_sold: new Date().toISOString(),
      },
    ]);

    // ✅ Update UI immediately
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



  // Save new or edited product
  async function handleSaveProduct() {
    const brand = newProduct.brand.trim();
    const model = newProduct.model.trim();
    const added = parseInt(newProduct.added_quantity || '0', 10);
    const sold = parseInt(newProduct.sold_quantity || '0', 10);
    const price = parseFloat(newProduct.price || '0');
    const categoryVal = newProduct.category;
    const unitVal = newProduct.unit;
    const availability = added - sold;

    if (!model || isNaN(added) || isNaN(price) || !categoryVal || !unitVal) {
      Swal.fire('Incomplete Fields', 'Please fill required fields.', 'warning');
      return;
    }

    const payload = {
      brand,
      model,
      added_quantity: added,
      sold_quantity: sold,
      availability,
      price,
      category: categoryVal,
      unit: unitVal,
      modified: new Date().toISOString(),
    };

    if (editProduct) {
      // Update existing product
      const { error } = await supabase.from('inventory_parts').update(payload).eq('id', editProduct.id);
      if (error) Swal.fire('Error', 'Failed to update product', 'error');
      else {
        Swal.fire('Updated', 'Product updated successfully', 'success');
        setShowModal(false);
        setEditProduct(null);
        resetNewProduct();
        fetchProducts();
      }
    } else {
      // Insert new product
      const { error } = await supabase.from('inventory_parts').insert([payload]);
      if (error) Swal.fire('Error', 'Failed to add product', 'error');
      else {
        Swal.fire('Added', 'Product added successfully', 'success');
        setShowModal(false);
        resetNewProduct();
        fetchProducts();
      }
    }
  }

  function resetNewProduct() {
    setNewProduct({
      brand: '',
      model: '',
      added_quantity: '',
      sold_quantity: '',
      price: '',
      category: '',
      unit: '',
    });
  }

  // Open edit modal for selected product
  function handleTopEdit() {
    if (selected.length !== 1) {
      Swal.fire('Notice', 'Please select exactly one product to edit.', 'info');
      return;
    }
    const productToEdit = products.find((p) => p.id === selected[0]);
    if (!productToEdit) {
      Swal.fire('Error', 'Selected product not found', 'error');
      return;
    }

    setEditProduct(productToEdit);
    setNewProduct({
      brand: productToEdit.brand || '',
      model: productToEdit.model || '',
      added_quantity: productToEdit.added_quantity?.toString() || '',
      sold_quantity: productToEdit.sold_quantity?.toString() || '',
      price: productToEdit.price?.toString() || '',
      category: productToEdit.category || '',
      unit: productToEdit.unit || '',
    });
    setShowModal(true);
  }

  // Filter and sort products
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
    .sort((a, b) => {
      const brandA = (a.brand || '').toLowerCase();
      const brandB = (b.brand || '').toLowerCase();
      if (brandA < brandB) return -1;
      if (brandA > brandB) return 1;
      const modelA = (a.model || '').toLowerCase();
      const modelB = (b.model || '').toLowerCase();
      if (modelA < modelB) return -1;
      if (modelA > modelB) return 1;
      return 0;
    });

  const allVisibleSelected = filteredProducts.length > 0 && selected.length === filteredProducts.length;

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

          <button
            className="add-btn"
            onClick={() => {
              setEditProduct(null);
              resetNewProduct();
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

        {/* Inventory Table */}
        <div className="inventory-table">
          <div
            className="inventory-header"
            style={{ gridTemplateColumns: '48px 1.2fr 2fr 0.9fr 0.9fr 0.9fr 120px 120px 120px 150px' }}
          >
            <div>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) => handleSelectAll(e.target.checked, filteredProducts)}
              />
            </div>
            <div>Brand</div>
            <div>Model Name</div>
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
              style={{ gridTemplateColumns: '48px 1.2fr 2fr 0.9fr 0.9fr 0.9fr 120px 120px 120px 150px' }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => handleCheckbox(product.id)}
                />
              </div>
              <div>{product.brand || ''}</div>
              <div>{product.model || ''}</div>
              <div>{product.added_quantity ?? ''}</div>
              <div>{product.sold_quantity ?? 0}</div>
              <div>{product.availability ?? 0}</div>
              <div>₱{product.price?.toLocaleString() ?? product.price}</div>
              <div>{product.category ?? ''}</div>
              <div>{product.unit ?? ''}</div>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 460 }}>
            <div className="modal-header">
              <h2>{editProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <input
                type="text"
                placeholder="Brand"
                value={newProduct.brand}
                onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
              />
              <input
                type="text"
                placeholder="Model Name"
                value={newProduct.model}
                onChange={(e) => setNewProduct({ ...newProduct, model: e.target.value })}
              />
              <input
                type="number"
                placeholder="Added Quantity"
                value={newProduct.added_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, added_quantity: e.target.value })}
              />
              <input
                type="number"
                placeholder="Sold Quantity"
                value={newProduct.sold_quantity}
                onChange={(e) => setNewProduct({ ...newProduct, sold_quantity: e.target.value })}
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              />
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              >
                <option value="">Select Category</option>
                <option>Swing Arm</option>
                <option>Rear Shock</option>
                <option>Disc Brake</option>
                <option>Calipher</option>
              </select>
              <select
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              >
                <option value="">Select Unit</option>
                <option>Aerox</option>
                <option>Nmax</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="add-btn" onClick={handleSaveProduct}>
                {editProduct ? 'Save Changes' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
