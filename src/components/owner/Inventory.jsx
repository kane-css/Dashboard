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
    availability: '',
    price: '',
    category: '',
    unit: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('inventory_parts').select('*');
    if (error) {
      console.error('Error fetching products:', error);
      Swal.fire('Error', 'Failed to fetch products', 'error');
    } else {
      setProducts(data || []);
    }
  };

  const handleCheckbox = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (checked, list) => {
    if (checked) setSelected(list.map((p) => p.id));
    else setSelected([]);
  };

  const handleDelete = async () => {
    if (selected.length === 0) {
      Swal.fire('No selection', 'Please select products to delete', 'warning');
      return;
    }
    const confirm = await Swal.fire({
      title: 'Delete selected?',
      text: 'This cannot be undone',
      icon: 'warning',
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    const { error } = await supabase.from('inventory_parts').delete().in('id', selected);
    if (error) {
      Swal.fire('Error', 'Failed to delete products', 'error');
    } else {
      Swal.fire('Deleted!', 'Selected products removed.', 'success');
      setSelected([]);
      fetchProducts();
    }
  };

  const handleAddStock = async (product) => {
    const { value } = await Swal.fire({
      title: `Add stock to "${product.model || product.name || ''}"`,
      input: 'number',
      inputLabel: 'Enter quantity to add',
      inputAttributes: { min: 1 },
      showCancelButton: true,
    });
    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    // Re-fetch the latest product availability to avoid concatenation issues
    const { data: latest, error: fetchError } = await supabase
      .from('inventory_parts')
      .select('availability')
      .eq('id', product.id)
      .single();

    if (fetchError) {
      Swal.fire('Error', 'Failed to fetch latest product data', 'error');
      return;
    }

    const currentAvail = parseInt(latest?.availability ?? 0, 10);
    const newAvail = currentAvail + qty;

    const { error } = await supabase
      .from('inventory_parts')
      .update({ availability: newAvail, modified: new Date().toISOString() })
      .eq('id', product.id);

    if (error) Swal.fire('Error', 'Failed to add stock', 'error');
    else {
      Swal.fire('Success', `Added ${qty} to stock.`, 'success');
      fetchProducts();
    }
  };

  // Mark as sold + log to sales_history
  const handleMarkAsSold = async (product) => {
    const { value } = await Swal.fire({
      title: `Mark "${product.model || product.name || ''}" as sold`,
      input: 'number',
      inputLabel: 'Enter quantity sold',
      inputAttributes: { min: 1, max: product.availability || 0 },
      showCancelButton: true,
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    if (qty > (product.availability || 0)) {
      Swal.fire('Notice', `Only ${(product.availability || 0)} available.`, 'info');
      return;
    }

    // verify product exists
    const { data: checkPart, error: checkError } = await supabase
      .from('inventory_parts')
      .select('id')
      .eq('id', product.id)
      .single();

    if (checkError || !checkPart) {
      Swal.fire('Error', 'Product not found in inventory_parts.', 'error');
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
      Swal.fire('Error', `Failed to update sold quantity: ${updateError.message}`, 'error');
      return;
    }

    const { error: insertError } = await supabase
      .from('sales_history')
      .insert([
        {
          part_id: product.id,
          date_sold: new Date(),
          quantity_sold: qty,
        },
      ]);

    if (insertError) {
      console.error('Sales log error:', insertError);
      Swal.fire(
        'Warning',
        `Updated stock but failed to log sale history: ${insertError.message}`,
        'warning'
      );
    } else {
      Swal.fire('Success', `Marked ${qty} as sold and logged to sales history.`, 'success');
    }

    fetchProducts();
  };

  const handleSaveProduct = async () => {
    const brand = newProduct.brand || '';
    const model = newProduct.model || newProduct.name || '';
    const added = parseInt(newProduct.added_quantity || 0, 10);
    const sold = parseInt(newProduct.sold_quantity || 0, 10);
    const price = parseFloat(newProduct.price || 0);
    const availability = added - sold;
    const categoryVal = newProduct.category || '';
    const unitVal = newProduct.unit || '';

    if (!model || (!added && added !== 0) || isNaN(price) || !categoryVal || !unitVal) {
      Swal.fire('Incomplete Fields', 'Please fill required fields (Model, Added, Price, Category, Unit).', 'warning');
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
      const { error } = await supabase.from('inventory_parts').update(payload).eq('id', editProduct.id);
      if (error) {
        Swal.fire('Error', 'Failed to update product', 'error');
      } else {
        Swal.fire('Updated', 'Product updated successfully', 'success');
        setShowModal(false);
        setEditProduct(null);
        setNewProduct({
          brand: '',
          model: '',
          added_quantity: '',
          sold_quantity: '',
          availability: '',
          price: '',
          category: '',
          unit: '',
        });
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('inventory_parts').insert([payload]);
      if (error) {
        Swal.fire('Error', 'Failed to add product', 'error');
      } else {
        Swal.fire('Added', 'Product added successfully', 'success');
        setShowModal(false);
        setNewProduct({
          brand: '',
          model: '',
          added_quantity: '',
          sold_quantity: '',
          availability: '',
          price: '',
          category: '',
          unit: '',
        });
        fetchProducts();
      }
    }
  };

  const handleTopEdit = () => {
    if (selected.length !== 1) {
      Swal.fire('Notice', 'Please select exactly one product to edit.', 'info');
      return;
    }
    const toEdit = products.find((p) => p.id === selected[0]);
    if (!toEdit) return Swal.fire('Error', 'Selected product not found', 'error');

    setEditProduct(toEdit);
    setNewProduct({
      brand: toEdit.brand || '',
      model: toEdit.model || toEdit.name || '',
      added_quantity: toEdit.added_quantity ?? 0,
      sold_quantity: toEdit.sold_quantity ?? 0,
      availability: toEdit.availability ?? 0,
      price: toEdit.price ?? '',
      category: toEdit.category ?? '',
      unit: toEdit.unit ?? '',
    });
    setShowModal(true);
  };

  // Helper that normalizes strings (trim + fallback)
  const normalize = (str) => (str || '').toString().trim();

  // Sort alphabetically by brand (case-insensitive), tie-break by model
  const filteredProducts = products
    .filter((product) => {
      const searchText = (search || '').toLowerCase();
      const modelName = (product.model || product.name || '').toString().toLowerCase();
      const brandName = (product.brand || '').toString().toLowerCase();
      const matchesSearch = !searchText || modelName.includes(searchText) || brandName.includes(searchText);
      const matchesCategory = category === 'All' || product.category === category;
      const matchesUnit = unit === 'All' || product.unit === unit;
      return matchesSearch && matchesCategory && matchesUnit;
    })
    .sort((a, b) => {
      const aBrand = normalize(a.brand).toLowerCase();
      const bBrand = normalize(b.brand).toLowerCase();
      const brandCompare = aBrand.localeCompare(bBrand, undefined, { sensitivity: 'base' });
      if (brandCompare !== 0) return brandCompare;
      // Tie-breaker: model
      const aModel = normalize(a.model || a.name).toLowerCase();
      const bModel = normalize(b.model || b.name).toLowerCase();
      return aModel.localeCompare(bModel, undefined, { sensitivity: 'base' });
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
              setNewProduct({
                brand: '',
                model: '',
                added_quantity: '',
                sold_quantity: '',
                availability: '',
                price: '',
                category: '',
                unit: '',
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
              gridTemplateColumns: '48px 1.2fr 2fr 0.9fr 0.9fr 0.9fr 120px 120px 120px 150px',
            }}
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
              style={{
                gridTemplateColumns: '48px 1.2fr 2fr 0.9fr 0.9fr 0.9fr 120px 120px 120px 150px',
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => handleCheckbox(product.id)}
                />
              </div>

              <div>{product.brand || ''}</div>
              <div>{product.model || product.name || ''}</div>
              <div>{product.added_quantity ?? ''}</div>
              <div>{product.sold_quantity ?? 0}</div>
              <div>{product.availability ?? 0}</div>
              <div>₱{product.price?.toLocaleString?.() ?? product.price}</div>
              <div>{product.category ?? ''}</div>
              <div>{product.unit ?? ''}</div>

              <div>
                <button
                  className="add-btn"
                  style={{ background: '#22c55e', marginRight: '5px' }}
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

      {/* ADD/EDIT MODAL */}
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
