import React, { useEffect, useRef } from 'react';
import PrintableBill from './PrintableBill';

export default function InvoiceModal({ invoice, isOpen, onClose }) {
  const printRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // ESC key to close
      if (e.key === 'Escape') {
        onClose();
      }
      // Ctrl+P or Cmd+P to trigger print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay modal-overlay-print" role="dialog" aria-modal="true" aria-label="Invoice Preview">
      <div className="modal-content invoice-modal-content">
        {/* Header - Hidden in Print */}
        <div className="modal-header no-print">
          <div>
            <h3 className="panel-title">[ GST INVOICE PREVIEW: {invoice.invoiceNo} ]</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Seller: AS MARKETING (33APDPM1586P1ZG) | Buyer: {invoice.buyerDetails?.name}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handlePrint} id="btn-print-bill-modal">
              [ PRINT BILL (Ctrl+P) ]
            </button>
            <button className="btn btn-outline" onClick={onClose} id="btn-close-modal">
              [X] CLOSE
            </button>
          </div>
        </div>

        {/* Modal Body - Contains the exact A4 Printable Component */}
        <div className="modal-body invoice-modal-body">
          <PrintableBill ref={printRef} invoice={invoice} />
        </div>

        {/* Footer - Hidden in Print */}
        <div className="modal-footer no-print">
          <button className="btn btn-outline" onClick={onClose}>
            BACK TO DASHBOARD
          </button>
          <button className="btn btn-success" onClick={handlePrint} id="btn-print-hardcopy">
            [ PRINT HARD COPY NOW ]
          </button>
        </div>
      </div>
    </div>
  );
}

