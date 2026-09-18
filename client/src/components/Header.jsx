import React from 'react';

export default function Header({ activeTab, setActiveTab, stockStats }) {
  return (
    <header className="terminal-header no-print">
      <div className="ascii-title">
        <div>
          [ AS MARKETING ] - FOOTWEAR WAREHOUSE & GST BILLING SYSTEM
        </div>
        <div>
          <span className="system-tag">GSTIN: 33APDPM1586P1ZG</span>
          <span className="system-tag" style={{ marginLeft: '6px' }}>STATE: 33 (TN)</span>
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
