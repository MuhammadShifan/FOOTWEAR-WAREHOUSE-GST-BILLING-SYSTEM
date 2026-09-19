import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ activeTab, setActiveTab, stockStats, onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="terminal-header no-print">
      <div className="ascii-title">
        <div>
          [ AS MARKETING ] - FOOTWEAR WAREHOUSE & GST BILLING SYSTEM
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="system-tag">GSTIN: 33APDPM1586P1ZG</span>
          <span className="system-tag">STATE: 33 (TN)</span>
          
          {isAuthenticated && user ? (
            <div className="auth-user-badge">
              <span className="user-icon">&#9679;</span>
              <span className="user-name">{user.name || user.email}</span>
              <span className="user-role">[{user.role?.toUpperCase() || 'USER'}]</span>
              <button
                type="button"
                className="btn-logout"
                onClick={logout}
                title="Sign out of warehouse system"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-header-login"
              onClick={onOpenAuth}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      <div className="header-meta">
        <div className="meta-item">
          LOCATION: <strong>Thanjavur, Tamil Nadu</strong>
        </div>
        <div className="meta-item">
          TOTAL MODELS: <strong>{stockStats?.totalModels || 0}</strong>
        </div>
        <div className="meta-item">
          TOTAL STOCK PAIRS: <strong>{stockStats?.totalPairs || 0}</strong>
        </div>
        <div className="meta-item">
          LOW STOCK ALERTS: 
          <strong style={{ color: stockStats?.lowStockCount > 0 ? '#f87171' : '#34d399', marginLeft: '4px' }}>
            {stockStats?.lowStockCount || 0}
          </strong>
        </div>
      </div>

      <nav className="nav-tabs" style={{ marginTop: '16px', marginBottom: '0', paddingBottom: '0' }}>
        <button
          className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          [ 1. INVENTORY / STOCKS ]
        </button>
        <button
          className={`nav-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          [ 2. CREATE BILL ]
        </button>
        <button
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          [ 3. INVOICE HISTORY ]
        </button>
      </nav>
    </header>
  );
}
