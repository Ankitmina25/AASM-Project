import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  FileText, 
  ChevronRight, 
  Trash2, 
  Calculator, 
  Activity, 
  RefreshCw,
  FlaskConical,
  Sparkles
} from 'lucide-react';
import { 
  DIMENSION_UNITS, 
  convertToDisplayQuantity, 
  convertToDisplayPrice, 
  calculateTotalPrice, 
  formatINR, 
  formatQuantity 
} from '../utils/conversions';

const Dashboard = ({ user, cart, setCart, isCartOpen, setIsCartOpen, showToast }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [orders, setOrders] = useState([]);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // States for each product card input
  const [inputQuantities, setInputQuantities] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [user]);

  const fetchProducts = async () => {
    if (!user || !user.token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/products?search=${search}&category=${selectedCategory}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch products');
      
      setProducts(data);
      
      // Extract unique categories
      const resAll = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const allData = await resAll.json();
      if (resAll.ok) {
        const cats = ['All', ...new Set(allData.map(p => p.category))];
        setCategories(cats);
      }

      // Initialize inputs and units
      const initialUnits = {};
      const initialQuantities = {};
      data.forEach(p => {
        initialUnits[p.id] = p.preferredUnit;
        initialQuantities[p.id] = '1'; // Default order qty is 1
      });
      setSelectedUnits(prev => ({ ...initialUnits, ...prev }));
      setInputQuantities(prev => ({ ...initialQuantities, ...prev }));

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Re-run search/filter locally or via api
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategory]);

  const fetchOrders = async () => {
    if (!user || !user.token) return;
    try {
      setOrdersLoading(true);
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUnitChange = (productId, unit) => {
    setSelectedUnits(prev => ({ ...prev, [productId]: unit }));
  };

  const handleQtyChange = (productId, val) => {
    setInputQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const addToCart = (product) => {
    const qty = parseFloat(inputQuantities[product.id]);
    const unit = selectedUnits[product.id];

    if (!qty || qty <= 0) {
      showToast('Please enter a valid quantity', 'error');
      return;
    }

    const availableStockInBase = parseFloat(product.stockInBaseUnit);
    const multiplier = unit === 'kg' || unit === 'L' ? 1000 : 1;
    const requestedQtyInBase = qty * multiplier;

    if (requestedQtyInBase > availableStockInBase) {
      showToast(`Cannot order more than available stock (${formatQuantity(availableStockInBase/multiplier, unit)} ${unit})`, 'error');
      return;
    }

    // Check if product with this unit already exists in cart
    const existingIndex = cart.findIndex(item => item.product.id === product.id && item.orderedUnit === unit);

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].orderedQuantity + qty;
      const newQtyInBase = newQty * multiplier;
      if (newQtyInBase > availableStockInBase) {
        showToast('Combined quantity exceeds available stock', 'error');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].orderedQuantity = newQty;
      updatedCart[existingIndex].totalPrice = calculateTotalPrice(newQty, unit, product.pricePerBaseUnit);
      setCart(updatedCart);
    } else {
      const newItem = {
        product,
        orderedQuantity: qty,
        orderedUnit: unit,
        pricePerUnit: convertToDisplayPrice(product.pricePerBaseUnit, unit),
        totalPrice: calculateTotalPrice(qty, unit, product.pricePerBaseUnit)
      };
      setCart([...cart, newItem]);
    }
    showToast(`${product.name} added to cart`, 'success');
  };

  const removeFromCart = (index) => {
    const item = cart[index];
    setCart(cart.filter((_, i) => i !== index));
    showToast(`${item.product.name} removed from cart`, 'success');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const submitQuotation = async () => {
    if (cart.length === 0) return;
    
    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        orderedQuantity: item.orderedQuantity.toString(),
        orderedUnit: item.orderedUnit
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ items: itemsPayload })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');

      showToast('Quotation submitted successfully!', 'success');
      setCart([]);
      setIsCartOpen(false);
      fetchProducts(); // Refresh stock
      fetchOrders(); // Refresh orders history
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="container">
      {/* Header section with modern chemistry visual styling */}
      <div className="glass-panel" style={{ padding: '2.5rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '2rem', top: '1.5rem', opacity: 0.05 }}>
          <FlaskConical size={140} color="var(--color-primary)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          <Sparkles size={16} />
          <span>Interactive Chemistry Catalog</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>
          Browse & Request Chemicals
        </h1>
        <p className="text-secondary" style={{ maxWidth: '650px', fontSize: '1.05rem' }}>
          Search cataloged reagents, dynamically convert weights and volumes in real-time, view calculations transparently, and submit instant quotation requests.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search by Name, SKU, Description, CAS Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '2.75rem' }}
          />
          <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', gap: '1rem', color: 'var(--color-primary)' }}>
          <RefreshCw className="animate-spin" size={24} />
          <span>Loading Chemical Catalog...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <FlaskConical size={48} className="text-muted" style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No Products Found</h3>
          <p className="text-secondary">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid-products">
          {products.map(product => {
            const currentUnit = selectedUnits[product.id] || product.preferredUnit;
            const currentQtyInput = inputQuantities[product.id] || '1';

            // Conversion Calculations
            const displayPriceVal = convertToDisplayPrice(product.pricePerBaseUnit, currentUnit);
            const displayStockVal = convertToDisplayQuantity(product.stockInBaseUnit, currentUnit);
            const liveTotalVal = calculateTotalPrice(currentQtyInput, currentUnit, product.pricePerBaseUnit);

            return (
              <div key={product.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  {/* Category and SKU row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className="badge badge-user" style={{ fontSize: '0.7rem' }}>{product.category}</span>
                    <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>SKU: {product.sku}</span>
                  </div>

                  {/* Product Title */}
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{product.name}</h3>

                  {/* Chemistry Specific Meta */}
                  {(product.chemicalFormula || product.casNumber) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                      {product.chemicalFormula && (
                        <span className="chemistry-formula" title="Chemical Formula">{product.chemicalFormula}</span>
                      )}
                      {product.casNumber && (
                        <span className="text-muted" style={{ fontSize: '0.8rem' }} title="CAS Number">CAS: {product.casNumber}</span>
                      )}
                      {product.purity && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>{product.purity}% Pure</span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {product.description && (
                    <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>
                  )}
                </div>

                <div>
                  {/* Dynamic Pricing / Stock Conversion View */}
                  <div className="glass-panel" style={{ padding: '0.85rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                      <span className="text-muted">Stock Level:</span>
                      <span style={{ fontWeight: 600, color: displayStockVal === 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                        {displayStockVal === 0 ? 'Out of Stock' : `${formatQuantity(displayStockVal, currentUnit)} ${currentUnit}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                      <span className="text-muted">Rate:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatINR(displayPriceVal)} / {currentUnit}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Quantity / Unit Input fields */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 2 }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Quantity"
                        value={currentQtyInput}
                        onChange={(e) => handleQtyChange(product.id, e.target.value)}
                        className="input-field"
                        style={{ padding: '0.5rem' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <select
                        value={currentUnit}
                        onChange={(e) => handleUnitChange(product.id, e.target.value)}
                        className="select-field"
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        {DIMENSION_UNITS[product.dimension].map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Order Pricing Calculation */}
                  {parseFloat(currentQtyInput) > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-success-glow)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <Calculator size={14} className="text-success" />
                      <span className="text-secondary" style={{ flex: 1 }}>Live Estimate:</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{formatINR(liveTotalVal)}</span>
                    </div>
                  )}

                  {/* Add to Cart button */}
                  <button
                    onClick={() => addToCart(product)}
                    className="btn-primary"
                    disabled={displayStockVal === 0 || !currentQtyInput || parseFloat(currentQtyInput) <= 0}
                    style={{ width: '100%', padding: '0.6rem' }}
                  >
                    <ShoppingCart size={16} />
                    <span>Add to Quotation</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <FileText size={22} className="text-primary" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Your Quotation Requests</h2>
        </div>

        {ordersLoading ? (
          <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <RefreshCw className="animate-spin" size={16} />
            <span>Fetching quotation history...</span>
          </div>
        ) : orders.length === 0 ? (
          <p className="text-muted" style={{ fontSize: '0.95rem' }}>You have not submitted any quotation requests yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => (
              <div 
                key={order.id} 
                className="glass-panel" 
                style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(255,255,255,0.01)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  borderColor: order.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : order.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'var(--glass-border)'
                }}
              >
                {/* Header detail */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span className="text-muted">Request Ref:</span>{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.id.slice(-8).toUpperCase()}</span>
                    <span style={{ margin: '0 0.5rem', color: 'var(--glass-border)' }}>|</span>
                    <span className="text-muted">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className={`badge badge-${order.status}`}>{order.status.toUpperCase()}</span>
                  </div>
                </div>

                {/* Ordered Items list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.25rem 0', borderBottom: idx < order.items.length - 1 ? '1px dashed rgba(255,255,255,0.03)' : 'none' }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{item.productName}</span>{' '}
                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>({item.sku})</span>
                      </div>
                      <div className="text-secondary">
                        <span>{formatQuantity(item.orderedQuantity, item.orderedUnit)} {item.orderedUnit}</span>
                        <span style={{ margin: '0 0.5rem' }}>@</span>
                        <span>{formatINR(convertToDisplayPrice(item.pricePerBaseUnit, item.orderedUnit))} / {item.orderedUnit}</span>
                        <span style={{ margin: '0 0.5rem', color: 'var(--glass-border)' }}>=</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatINR(item.totalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer total */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', fontSize: '0.95rem' }}>
                  <span className="text-muted" style={{ marginRight: '0.5rem' }}>Grand Total:</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatINR(order.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sliding Cart Drawer */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()} style={{ height: '100%' }}>
            {/* Drawer Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Selected Quotation Items</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                Close
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={36} style={{ margin: '0 auto 1rem' }} />
                  <p>Your quotation is empty.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Add chemical products from the catalog to see them here.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.product.name}</h4>
                      <button 
                        onClick={() => removeFromCart(idx)} 
                        className="text-muted" 
                        style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      <span>SKU: {item.product.sku}</span>
                      <span>Requested: {formatQuantity(item.orderedQuantity, item.orderedUnit)} {item.orderedUnit}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <span>Rate: {formatINR(item.pricePerUnit)} / {item.orderedUnit}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span className="text-secondary">Subtotal:</span>
                      <span style={{ color: 'var(--color-success)' }}>{formatINR(item.totalPrice)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  <span>Total Est. Amount:</span>
                  <span style={{ color: 'var(--color-primary)' }}>{formatINR(cartTotal)}</span>
                </div>

                <button onClick={submitQuotation} className="btn-primary" style={{ width: '100%', gap: '0.75rem', padding: '0.9rem' }}>
                  <span>Submit Quotation Request</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
