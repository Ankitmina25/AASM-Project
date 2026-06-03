import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const App = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Check for stored user session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setCart([]);
    setIsCartOpen(false);
    showToast('Logged out successfully', 'success');
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Remove toast after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <BrowserRouter>
      {user && (
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          cartCount={cart.length} 
          onToggleCart={() => setIsCartOpen(!isCartOpen)} 
        />
      )}

      <main style={{ minHeight: '85vh' }}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
              ) : (
                <Login setUser={setUser} showToast={showToast} />
              )
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? (
                <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />
              ) : (
                <Register setUser={setUser} showToast={showToast} />
              )
            } 
          />

          {/* User / Seller Dashboard */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute user={user}>
                <Dashboard 
                  user={user} 
                  cart={cart} 
                  setCart={setCart} 
                  isCartOpen={isCartOpen}
                  setIsCartOpen={setIsCartOpen}
                  showToast={showToast} 
                />
              </ProtectedRoute>
            } 
          />

          {/* Admin Dashboard */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute user={user} adminOnly={true}>
                <AdminDashboard user={user} showToast={showToast} />
              </ProtectedRoute>
            } 
          />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} />
            ) : (
              <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast.message}</span>
          </div>
        ))}
      </div>
    </BrowserRouter>
  );
};

export default App;
