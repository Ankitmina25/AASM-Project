import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Beaker, LogOut, ShoppingCart, Database, User } from 'lucide-react';

const Navbar = ({ user, onLogout, cartCount, onToggleCart }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="navbar-floating glass-panel">
      <div className="navbar-brand">
        <Beaker size={26} className="brand-icon" style={{ strokeWidth: 2.5 }} />
        <span>AasaMedChem</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Navigation links based on role */}
        {user.role === 'admin' ? (
          <Link
            to="/admin"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              color: location.pathname === '/admin' ? 'var(--color-primary)' : 'var(--text-secondary)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Database size={18} />
            <span>Admin Panel</span>
          </Link>
        ) : (
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              color: location.pathname === '/' ? 'var(--color-primary)' : 'var(--text-secondary)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Beaker size={18} />
            <span>Catalog</span>
          </Link>
        )}

        {/* Separator */}
        <div style={{ width: '1px', height: '1.5rem', background: 'var(--glass-border)' }}></div>

        {/* User Info Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="glass-panel"
            style={{
              padding: '0.4rem 0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              background: 'rgba(255,255,255,0.03)'
            }}
          >
            <User size={14} className="text-secondary" />
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
              {user.role.toUpperCase()}
            </span>
          </div>

          {/* Cart Icon (only for users/sellers) */}
          {user.role !== 'admin' && (
            <button
              onClick={onToggleCart}
              className="glass-panel"
              style={{
                position: 'relative',
                width: '2.5rem',
                height: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                borderColor: cartCount > 0 ? 'var(--color-primary)' : 'var(--glass-border)',
                transition: 'var(--transition-smooth)'
              }}
            >
              <ShoppingCart size={18} color={cartCount > 0 ? 'var(--color-primary)' : 'currentColor'} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--color-primary)',
                    color: '#050811',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="glass-panel"
            title="Log Out"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.05)',
              borderColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
