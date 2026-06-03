import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileCheck, 
  Database, 
  Info, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  FlaskConical,
  BadgeAlert
} from 'lucide-react';
import { 
  DIMENSION_UNITS, 
  convertToDisplayQuantity, 
  convertToDisplayPrice, 
  formatINR, 
  formatQuantity 
} from '../utils/conversions';

const AdminDashboard = ({ user, showToast }) => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' or 'orders'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentProductId, setCurrentProductId] = useState(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDimension, setFormDimension] = useState('WEIGHT');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formPreferredUnit, setFormPreferredUnit] = useState('kg');
  const [formCasNumber, setFormCasNumber] = useState('');
  const [formChemicalFormula, setFormChemicalFormula] = useState('');
  const [formPurity, setFormPurity] = useState('99.0');

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [user]);

  // Adjust preferred unit when dimension changes
  useEffect(() => {
    if (formDimension === 'WEIGHT') setFormPreferredUnit('kg');
    else if (formDimension === 'VOLUME') setFormPreferredUnit('L');
    else if (formDimension === 'COUNT') setFormPreferredUnit('pcs');
  }, [formDimension]);

  const fetchProducts = async () => {
    if (!user || !user.token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      showToast('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!user || !user.token) return;
    try {
      setOrdersLoading(true);
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      showToast('Error loading orders', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setCurrentProductId(null);
    setFormName('');
    setFormSku('');
    setFormDescription('');
    setFormCategory('General');
    setFormDimension('WEIGHT');
    setFormPrice('');
    setFormStock('');
    setFormPreferredUnit('kg');
    setFormCasNumber('');
    setFormChemicalFormula('');
    setFormPurity('99.5');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode('edit');
    setCurrentProductId(product.id);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormDescription(product.description || '');
    setFormCategory(product.category || 'General');
    setFormDimension(product.dimension);
    
    // Display price and stock in their preferred display units in form
    const currentPrice = convertToDisplayPrice(product.pricePerBaseUnit, product.preferredUnit);
    const currentStock = convertToDisplayQuantity(product.stockInBaseUnit, product.preferredUnit);
    
    setFormPrice(currentPrice.toString());
    setFormStock(currentStock.toString());
    setFormPreferredUnit(product.preferredUnit);
    setFormCasNumber(product.casNumber || '');
    setFormChemicalFormula(product.chemicalFormula || '');
    setFormPurity(product.purity || '99.5');
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formName || !formSku || !formPrice || !formStock) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload = {
      name: formName,
      sku: formSku,
      description: formDescription,
      category: formCategory,
      dimension: formDimension,
      price: parseFloat(formPrice),
      stock: parseFloat(formStock),
      preferredUnit: formPreferredUnit,
      casNumber: formCasNumber,
      chemicalFormula: formChemicalFormula,
      purity: parseFloat(formPurity)
    };

    try {
      const url = modalMode === 'create' ? '/api/products' : `/api/products/${currentProductId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save product');

      showToast(`Product ${modalMode === 'create' ? 'created' : 'updated'} successfully`, 'success');
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Delete failed');
      }

      showToast('Product deleted successfully', 'success');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status update failed');

      showToast(`Order status marked as ${newStatus}`, 'success');
      fetchOrders();
      fetchProducts(); // Stock levels might have updated (e.g. if rejected)
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="container">
      {/* Header section */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            Admin Dashboard
          </h1>
          <p className="text-secondary">Control inventory stocks, add new reagents, and verify incoming quotation requests.</p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('inventory')}
            className={activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px' }}
          >
            <Database size={16} />
            <span>Manage Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: '6px' }}
          >
            <FileCheck size={16} />
            <span>Verify Quotations</span>
          </button>
        </div>
      </div>

      {/* -------------------- INVENTORY MANAGEMENT TAB -------------------- */}
      {activeTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FlaskConical size={20} color="var(--color-primary)" />
              <span>Chemical Inventory Levels</span>
            </h2>
            <button onClick={openCreateModal} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              <Plus size={16} />
              <span>Add Chemical</span>
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '0.5rem', color: 'var(--color-primary)' }}>
              <RefreshCw className="animate-spin" size={20} />
              <span>Refreshing stocks...</span>
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '4rem' }}>No chemicals in inventory. Click "Add Chemical" to create one.</p>
          ) : (
            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Chemical / SKU</th>
                    <th>Formula / CAS</th>
                    <th>Category</th>
                    <th>Stock (Preferred)</th>
                    <th>Stock (Base Unit)</th>
                    <th>Base Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const prefStock = convertToDisplayQuantity(product.stockInBaseUnit, product.preferredUnit);
                    const prefPrice = convertToDisplayPrice(product.pricePerBaseUnit, product.preferredUnit);
                    const baseUnitName = product.baseUnit;

                    return (
                      <tr key={product.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 700 }}>{product.name}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{product.sku}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            {product.chemicalFormula && (
                              <span className="chemistry-formula" style={{ display: 'inline-block', marginBottom: '0.2rem' }}>{product.chemicalFormula}</span>
                            )}
                            {product.casNumber && (
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>CAS: {product.casNumber}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-user" style={{ fontSize: '0.75rem' }}>{product.category}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>
                            {formatQuantity(prefStock, product.preferredUnit)} {product.preferredUnit}
                          </span>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            ({formatINR(prefPrice)} / {product.preferredUnit})
                          </div>
                        </td>
                        <td>
                          <span className="text-secondary" style={{ fontSize: '0.85rem' }}>
                            {formatQuantity(product.stockInBaseUnit, baseUnitName)} {baseUnitName}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                            {formatINR(product.pricePerBaseUnit)} / {baseUnitName}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditModal(product)}
                              className="btn-secondary"
                              style={{ padding: '0.4rem', borderRadius: '6px' }}
                              title="Edit Product"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="btn-secondary"
                              style={{ padding: '0.4rem', borderRadius: '6px', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.1)' }}
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* -------------------- QUOTATION VERIFICATION TAB -------------------- */}
      {activeTab === 'orders' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCheck size={20} color="var(--color-primary)" />
            <span>Incoming Quotation Verification</span>
          </h2>

          {ordersLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '0.5rem', color: 'var(--color-primary)' }}>
              <RefreshCw className="animate-spin" size={20} />
              <span>Fetching quotation queue...</span>
            </div>
          ) : orders.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '4rem' }}>No quotation requests in the queue.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {orders.map(order => (
                <div 
                  key={order.id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem', 
                    background: 'rgba(255,255,255,0.01)',
                    borderColor: order.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : order.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'var(--glass-border)'
                  }}
                >
                  {/* Order info header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Requested by: {order.user ? order.user.name : 'Unknown User'}</span>
                        <span className="text-muted">({order.user ? order.user.email : 'N/A'})</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Ref ID: <span style={{ fontFamily: 'monospace' }}>{order.id}</span></span>
                        <span style={{ margin: '0 0.5rem' }}>|</span>
                        <span>Date: {new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`badge badge-${order.status}`}>{order.status.toUpperCase()}</span>
                      
                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'approved')}
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--color-success)', color: '#fff', boxShadow: 'none' }}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'rejected')}
                            className="btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'rgba(239,68,68,0.2)' }}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {order.items.map((item, idx) => {
                      const multiplier = item.orderedUnit === 'kg' || item.orderedUnit === 'L' ? 1000 : 1;
                      const displayUnitRate = parseFloat(item.pricePerBaseUnit.toString()) * multiplier;
                      
                      return (
                        <div key={idx} className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.12)', borderStyle: 'dotted' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{item.productName}</span>{' '}
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>({item.sku})</span>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                              Total: {formatINR(item.totalPrice)}
                            </div>
                          </div>

                          {/* Ordered Detail Row */}
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            Ordered Quantity: <strong style={{ color: 'var(--text-primary)' }}>{formatQuantity(item.orderedQuantity, item.orderedUnit)} {item.orderedUnit}</strong> @ {formatINR(displayUnitRate)} / {item.orderedUnit}
                          </div>

                          {/* -------------------- DETAILED AUDIT CONVERSION SECTION -------------------- */}
                          <div style={{ background: 'rgba(0, 210, 196, 0.03)', border: '1px solid rgba(0, 210, 196, 0.1)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                              <Info size={12} />
                              <span>Unit Conversion & Price Audit Trail</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                              <div>
                                <span className="text-muted">Internal DB Stock Storage:</span>
                                <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                                  Quantity: <strong>{formatQuantity(item.quantityInBaseUnit, item.dimension === 'WEIGHT' ? 'g' : item.dimension === 'VOLUME' ? 'mL' : 'pcs')} {item.dimension === 'WEIGHT' ? 'g' : item.dimension === 'VOLUME' ? 'mL' : 'pcs'}</strong>
                                </div>
                              </div>
                              <div>
                                <span className="text-muted">Internal DB Price Storage:</span>
                                <div style={{ color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                                  Rate: <strong>{formatINR(item.pricePerBaseUnit)} / {item.dimension === 'WEIGHT' ? 'g' : item.dimension === 'VOLUME' ? 'mL' : 'pcs'}</strong>
                                </div>
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <span className="text-muted">Mathematical Verification formula:</span>
                                <div style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontWeight: 600, marginTop: '0.15rem' }}>
                                  ({item.orderedQuantity} {item.orderedUnit} * {multiplier} multiplier) * {formatINR(item.pricePerBaseUnit)}/base_unit = {formatINR(item.totalPrice)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grand total amount */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <span className="text-muted" style={{ marginRight: '0.5rem', fontSize: '0.95rem' }}>Quotation Grand Total:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatINR(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------- PRODUCT CREATION / EDITING MODAL -------------------- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {modalMode === 'create' ? 'Add New Chemical Product' : 'Edit Chemical Product'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Row 1: Name and SKU */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aspirin USP"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ASP-098"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Row 2: Category and Dimension */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Analgesics"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Physical Dimension *</label>
                  <select
                    value={formDimension}
                    onChange={(e) => setFormDimension(e.target.value)}
                    className="select-field"
                    style={{ width: '100%', padding: '0.75rem' }}
                    disabled={modalMode === 'edit'} // Lock dimension on edit to prevent math mismatch
                  >
                    <option value="WEIGHT">WEIGHT (g, kg)</option>
                    <option value="VOLUME">VOLUME (mL, L)</option>
                    <option value="COUNT">COUNT (pcs)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Chemical Formula, CAS, Purity */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Chemical Formula</label>
                  <input
                    type="text"
                    placeholder="e.g. C9H8O4"
                    value={formChemicalFormula}
                    onChange={(e) => setFormChemicalFormula(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>CAS Registry Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 50-78-2"
                    value={formCasNumber}
                    onChange={(e) => setFormCasNumber(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Purity (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="99.5"
                    value={formPurity}
                    onChange={(e) => setFormPurity(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Row 4: Pricing & Stock (in preferred display unit) */}
              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Price (INR) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 800"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1.5 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Stock Quantity *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 15"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Preferred Unit *</label>
                  <select
                    value={formPreferredUnit}
                    onChange={(e) => setFormPreferredUnit(e.target.value)}
                    className="select-field"
                    style={{ width: '100%', padding: '0.75rem' }}
                  >
                    {DIMENSION_UNITS[formDimension].map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                <Info size={12} />
                <span>
                  Admin note: Stock and price are input in <strong>{formPreferredUnit}</strong>. Internally, they will be stored in base units.
                </span>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Description</label>
                <textarea
                  rows="3"
                  placeholder="Enter chemical details, hazards, storage temp, etc."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="input-field"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'create' ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
