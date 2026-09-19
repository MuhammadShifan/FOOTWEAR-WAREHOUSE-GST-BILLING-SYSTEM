import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import InvoiceList from './components/InvoiceList';
import InvoiceModal from './components/InvoiceModal';
import AuthPage from './components/auth/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { inventoryApi, invoiceApi } from './services/api';

function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [items, setItems] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Selected Invoice for View & Print Modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Allow guest exploration mode if user chooses
  const [guestMode, setGuestMode] = useState(false);

  // Initial Load when authenticated or in guest mode
  useEffect(() => {
    if (isAuthenticated || guestMode) {
      loadInventory();
      loadInvoices();
    }
  }, [isAuthenticated, guestMode]);

  const loadInventory = async () => {
    setLoadingItems(true);
    try {
      const res = await inventoryApi.getAll();
      setItems(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const res = await invoiceApi.getAll();
      setInvoices(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleInvoiceCreated = (newInvoice) => {
    loadInventory();
    loadInvoices();
  };

  const handlePrintTrigger = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  // Stock summary stats
  const stockStats = {
    totalModels: items.length,
    totalPairs: items.reduce((acc, it) => acc + (Number(it.stockQty) || 0), 0),
    lowStockCount: items.filter((it) => it.stockQty <= (it.minStockAlert || 10)).length,
  };

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="terminal-loader">
          <div className="loader-text">[ INITIALIZING AS MARKETING SECURITY SUBSYSTEM... ]</div>
          <div className="loader-bar"><div className="loader-bar-fill"></div></div>
        </div>
      </div>
    );
  }

  // If not logged in and not in guest mode, show the Authentication Page
  if (!isAuthenticated && !guestMode) {
    return (
      <div className="auth-container">
        <AuthPage onAuthSuccess={() => setGuestMode(false)} />
        <div className="guest-mode-bar">
          <span>Need quick preview without logging in?</span>
          <button
            type="button"
            className="guest-mode-btn"
            onClick={() => setGuestMode(true)}
          >
            Continue as Guest Viewer &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stockStats={stockStats}
        onOpenAuth={() => setGuestMode(false)}
      />

      {/* Main Content Areas */}
      <main>
        {activeTab === 'inventory' && (
          <Inventory
            items={items}
            loading={loadingItems}
            onRefresh={loadInventory}
          />
        )}

        {activeTab === 'billing' && (
          <Billing
            inventoryItems={items}
            onInvoiceCreated={handleInvoiceCreated}
            onPrintTrigger={handlePrintTrigger}
          />
        )}

        {activeTab === 'history' && (
          <InvoiceList
            invoices={invoices}
            loading={loadingInvoices}
            onRefresh={loadInvoices}
            onSelectInvoice={(inv) => {
              setSelectedInvoice(inv);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Invoice View & Print Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}