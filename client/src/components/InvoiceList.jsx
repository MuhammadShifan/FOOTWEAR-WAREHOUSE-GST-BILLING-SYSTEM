import React, { useState } from 'react';

export default function InvoiceList({ invoices = [], loading, onRefresh, onSelectInvoice }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filtered = invoices.filter((inv) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      inv.invoiceNo?.toLowerCase().includes(s) ||
      inv.buyerDetails?.name?.toLowerCase().includes(s) ||
      (inv.buyerDetails?.gstin && inv.buyerDetails.gstin.toLowerCase().includes(s));

    if (filterStatus !== 'ALL') {
      return matchesSearch && inv.status === filterStatus;
    }
    return matchesSearch;
  });

  const totalBilled = filtered.reduce((acc, inv) => acc + (Number(inv.netTotal) || 0), 0);
  const totalPairs = filtered.reduce((acc, inv) => acc + (Number(inv.totalQty) || 0), 0);

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">[ INVOICE HISTORY & ARCHIVES ]</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            List of generated GST Invoices | Click to view or reprint
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          TOTAL BILLED: <strong style={{ color: 'var(--accent-emerald)' }}>Rs. {totalBilled.toFixed(2)}</strong> |{' '}
          PAIRS: <strong style={{ color: 'var(--accent-cyan)' }}>{totalPairs}</strong>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          placeholder="SEARCH BY INVOICE NO / BUYER NAME / GSTIN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '240px' }}
        />
        <select
          className="form-control"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ width: '150px' }}
        >
          <option value="ALL">ALL STATUS</option>
          <option value="PAID">PAID</option>
          <option value="UNPAID">UNPAID</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
        <button className="btn btn-outline" onClick={onRefresh}>
          REFRESH
        </button>
      </div>

      {/* Invoices Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>#</th>
              <th>INVOICE NO</th>
              <th>DATE</th>
              <th>BUYER NAME</th>
              <th>BUYER GSTIN</th>
              <th className="text-center">PAIRS</th>
              <th className="text-right">BEFORE TAX</th>
              <th className="text-right">TOTAL GST</th>
              <th className="text-right">NET TOTAL (Rs)</th>
              <th className="text-center">STATUS</th>
              <th className="text-center" style={{ width: '140px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center" style={{ padding: '20px' }}>
                  LOADING INVOICES...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center" style={{ padding: '20px', color: 'var(--text-muted)' }}>
                  NO INVOICES FOUND.
                </td>
              </tr>
            ) : (
              filtered.map((inv, idx) => (
                <tr key={inv._id || idx}>
                  <td>{idx + 1}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{inv.invoiceNo}</td>
                  <td>{new Date(inv.date).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>{inv.buyerDetails?.name}</td>
                  <td>{inv.buyerDetails?.gstin || 'URP'}</td>
                  <td className="text-center" style={{ fontWeight: 700 }}>
                    {inv.totalQty}
                  </td>
                  <td className="text-right">{Number(inv.totalBeforeTax).toFixed(2)}</td>
                  <td className="text-right">{Number(inv.totalGst).toFixed(2)}</td>
                  <td
                    className="text-right"
                    style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '14px' }}
                  >
                    Rs. {Number(inv.netTotal).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        inv.status === 'PAID'
                          ? 'badge-success'
                          : inv.status === 'CANCELLED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      [ PRINT / VIEW ]
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
