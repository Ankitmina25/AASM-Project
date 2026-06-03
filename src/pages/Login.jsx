import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Beaker, ShieldAlert } from 'lucide-react';

const Login = ({ setUser, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      showToast('Logged in successfully', 'success');

      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const autofill = (role) => {
    if (role === 'admin') {
      setEmail('admin@aasamedchem.com');
      setPassword('admin123');
    } else {
      setEmail('seller@aasamedchem.com');
      setPassword('seller123');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="glass-panel"
            style={{
              width: '4rem',
              height: '4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              background: 'rgba(0, 210, 196, 0.05)',
              borderColor: 'var(--glass-border-hover)',
              borderRadius: '16px'
            }}
          >
            <Beaker size={32} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p className="text-secondary" style={{ fontSize: '0.95rem' }}>
            AasaMedChem Portal Login
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={16} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-secondary" style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Register here
          </Link>
        </p>

        {/* Demo Credentials Box */}
        <div
          className="glass-panel"
          style={{
            marginTop: '2rem',
            padding: '1rem',
            background: 'rgba(255,255,255,0.02)',
            borderStyle: 'dashed'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            <ShieldAlert size={16} />
            <span>Hackathon Quick Login</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => autofill('admin')}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>Admin Account</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to Auto-fill</span>
            </button>
            <button
              onClick={() => autofill('user')}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
            >
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Seller Account</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to Auto-fill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
