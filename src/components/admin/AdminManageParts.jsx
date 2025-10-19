import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../../supabase';
import { X } from 'lucide-react';
import "../admincss/AdminManageParts.css";

export default function AdminManageParts() {
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
    sold_quantity: '',
    availability: '',
    price: '',
    category: '',
    unit: '',
  });

  // Helper to show SweetAlert with theme (dark or light) while preserving passed options.
  const showSwal = (options) => {
    const isDarkMode = document.body.classList.contains('dark');
    const theme = {
      background: isDarkMode ? '#1e1e1e' : '#ffffff',
      color: isDarkMode ? '#f1f1f1' : '#111111',
    };
    return Swal.fire({ ...options, ...theme });
  };

  // ✅ Fetch data on load
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('inventory_parts').select('*');
    if (error) {
      console.error('Error fetching products:', error);
      showSwal({ title: 'Error', text: 'Failed to fetch products', icon: 'error' });
    } else {
      setProducts(data || []);
    }
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
      showSwal({ title: 'No selection', text: 'Please select products to delete', icon: 'warning' });
      return;
    }
    const confirm = await showSwal({
      title: 'Delete selected?',
      text: 'This cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e63946',
      cancelButtonColor: '#6b7280',
    });
    if (!confirm.isConfirmed) return;

    const { error } = await supabase
      .from('inventory_parts')
      .delete()
      .in('id', selected);

    if (error) {
      showSwal({ title: 'Error', text: 'Failed to delete products', icon: 'error' });
    } else {
      showSwal({ title: 'Deleted!', text: 'Selected products removed.', icon: 'success', confirmButtonColor: '#4ade80' });
      setSelected([]);
      fetchProducts();
    }
  };

  // ✅ Add stock (support dark/light in SweetAlert)
  const handleAddStock = async (product) => {
    const { value } = await showSwal({
      title: `Add stock to "${product.model || product.name || ''}"`,
      input: 'number',
      inputLabel: 'Enter quantity to add',
      inputAttributes: { min: 1 },
      showCancelButton: true,
      confirmButtonColor: '#4ade80',
      cancelButtonColor: '#6b7280',
      didOpen: () => {
        // no-op but keeps SweetAlert normal behavior
      },
    });

    const qty = parseInt(value, 10);
    if (!qty || qty <= 0) return;

    const { data: latest, error: fetchError } = await supabase
      .from('inventory_parts')
      .select('availability')
      .eq('id', product.id)
      .single();

    if (fetchError) {
      showSwal({ title: 'Error', text: 'Failed to fetch latest product data', icon: 'error' });
      return;
    }

    const currentAvail = parseInt(latest?.availability ?? 0, 10);
    const newAvail = currentAvail + qty;

    const { error } = await supabase
      .from('inventory_parts')
      .update({
        availability: newAvail,
        modified: new Date().toISOString(),
      })
      .eq('id', product.id);

    if (error) {
      showSwal({ title: 'Error', text: 'Failed to add stock', icon: 'error' });
    } else {
      showSwal({ title: 'Success', text: `Added ${qty} to stock.`, icon: 'success', confirmButtonColor: '#4ade80' });
      fetchProducts();
    }
  };

  // ✅ Mark as sold (support dark/light in SweetAlert)
  const handleMarkAsSold = async (product) => {
    const { value } = await showSwal({
      title: `Mark "${product.model || product.name || ''}" as sold`,
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
      showSwal({ title: 'Notice', text: `Only ${(product.availability || 0)} available.`, icon: 'info', confirmButtonColor: '#3b82f6' });
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
      showSwal({ title: 'Error', text: `Failed to update sold quantity: ${updateError.message}`, icon: 'error' });
      return;
    }

    const { error: insertError } = await supabase.from('sales_history').insert([
      {
        part_id: product.id,
        date_sold: new Date(),
        quantity_sold: qty,
      },
    ]);

    if (insertError) {
      showSwal({
        title: 'Warning',
        text: `Updated stock but failed to log sale history: ${insertError.message}`,
        icon: 'warning',
      });
    } else {
      showSwal({ title: 'Success', text: `Marked ${qty} as sold and logged.`, icon: 'success', confirmButtonColor: '#4ade80' });
    }

    fetchProducts();
  };

  // ✅ Add/Edit product (unchanged behavior, Swal themed)
  const handleSaveProduct = async () => {
    const brand = newProduct.brand || '';
    const model = newProduct.model || newProduct.name || '';
    const sold = parseInt(newProduct.sold_quantity || 0, 10);
    const price = parseFloat(newProduct.price || 0);
    const availability = parseInt(newProduct.availability || 0, 10);
    const categoryVal = newProduct.category || '';
    const unitVal = newProduct.unit || '';

    if (!model || isNaN(price) || !categoryVal || !unitVal) {
      showSwal({
        title: 'Incomplete Fields',
        text: 'Please fill required fields (Model, Price, Category, Unit).',
        icon: 'warning',
      });
      return;
    }

    const payload = {
      brand,
      model,
      sold_quantity: sold,
      availability,
      price,
      category: categoryVal,
      unit: unitVal,
      modified: new Date().toISOString(),
    };

    if (editProduct) {
      const { error } = await supabase
        .from('inventory_parts')
        .update(payload)
        .eq('id', editProduct.id);
      if (error) {
        showSwal({ title: 'Error', text: `Failed to update product: ${error.message}`, icon: 'error' });
      } else {
        showSwal({ title: 'Updated', text: 'Product updated successfully', icon: 'success' });
        setShowModal(false);
        setEditProduct(null);
        resetForm();
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from('inventory_parts').insert([payload]);
      if (error) {
        showSwal({ title: 'Error', text: `Failed to add product: ${error.message}`, icon: 'error' });
      } else {
        showSwal({ title: 'Added', text: 'Product added successfully', icon: 'success' });
        setShowModal(false);
        resetForm();
        fetchProducts();
      }
    }
  };

  const handleTopEdit = () => {
    if (selected.length !== 1) {
      showSwal({ title: 'Notice', text: 'Please select exactly one product to edit.', icon: 'info' });
      return;
    }
    const toEdit = products.find((p) => p.id === selected[0]);
    if (!toEdit) return showSwal({ title: 'Error', text: 'Selected product not found', icon: 'error' });

    setEditProduct(toEdit);
    setNewProduct({
      brand: toEdit.brand || '',
      model: toEdit.model || toEdit.name || '',
      sold_quantity: toEdit.sold_quantity ?? 0,
      availability: toEdit.availability ?? 0,
      price: toEdit.price ?? '',
      category: toEdit.category ?? '',
      unit: toEdit.unit ?? '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setNewProduct({
      brand: '',
      model: '',
      sold_quantity: '',
      availability: '',
      price: '',
      category: '',
      unit: '',
    });
  };

  const normalize = (str) => (str || '').toString().trim();

  const filteredProducts = products
    .filter((product) => {
      const searchText = (search || '').toLowerCase();
      const modelName = (product.model || product.name || '').toString().toLowerCase();
      const brandName = (product.brand || '').toString().toLowerCase();
      const matchesSearch =
        !searchText ||
        modelName.includes(searchText) ||
        brandName.includes(searchText);
      const matchesCategory = category === 'All' || product.category === category;
      const matchesUnit = unit === 'All' || product.unit === unit;
      return matchesSearch && matchesCategory && matchesUnit;
    })
    .sort((a, b) => {
      const aBrand = normalize(a.brand).toLowerCase();
      const bBrand = normalize(b.brand).toLowerCase();
      const brandCompare = aBrand.localeCompare(bBrand);
      if (brandCompare !== 0) return brandCompare;
      const aModel = normalize(a.model || a.name).toLowerCase();
      const bModel = normalize(b.model || b.name).toLowerCase();
      return aModel.localeCompare(bModel);
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
              resetForm();
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
                '48px 1.2fr 2fr 0.9fr 0.9fr 120px 120px 120px 150px',
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
                  '48px 1.2fr 2fr 0.9fr 0.9fr 120px 120px 120px 150px',
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
                  style={{ background: '#ef4444' }}
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
                placeholder="Availability"
                value={newProduct.availability}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    availability: e.target.value,
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
                {editProduct ? 'Save Changes' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
