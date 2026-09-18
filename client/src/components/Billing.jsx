import React, { useState, useEffect } from 'react';
import { invoiceApi } from '../services/api';
import { getColorDotHex, COLOR_PRESETS } from './Inventory';

function convertNumberToRupeesClient(amount) {
  if (!amount || isNaN(amount)) return 'Rupees Zero Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const twoDigits = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(n) {
    let str = '';
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += twoDigits[n - 10] + ' ';
    } else if (n >= 20) {
      str += tensMultiple[Math.floor(n / 10)] + ' ';
      if (n % 10 > 0) str += singleDigits[n % 10] + ' ';
    } else if (n > 0) {
      str += singleDigits[n] + ' ';
    }
    return str.trim();
  }

  const num = Math.abs(Number(amount));
  if (num === 0) return 'Rupees Zero Only';

  const parts = num.toFixed(2).split('.');
  let integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);

  let result = '';
  if (integerPart >= 10000000) {
    result += convertBelowThousand(Math.floor(integerPart / 10000000)) + ' Crore ';
    integerPart %= 10000000;
  }
  if (integerPart >= 100000) {
    result += convertBelowThousand(Math.floor(integerPart / 100000)) + ' Lakh ';
    integerPart %= 100000;
  }
  if (integerPart >= 1000) {
    result += convertBelowThousand(Math.floor(integerPart / 1000)) + ' Thousand ';
    integerPart %= 1000;
  }
  if (integerPart > 0) {
    result += convertBelowThousand(integerPart) + ' ';
  }

  result = result.trim();
  let finalStr = result ? `Rupees ${result}` : 'Rupees Zero';
  if (decimalPart > 0) {
    finalStr += ` and ${convertBelowThousand(decimalPart)} Paise`;
  }
  finalStr += ' Only';
  return finalStr.replace(/\s+/g, ' ');
}

const createInitialRow = (sn = 1) => ({
  sn,
  itemId: '',
  modelName: '',
  color: 'BLACK',
  size: '9',
  description: '',
  hsn: '6402',
  qty: 12,
  mrp: 0,
  rate: 0,
  disPercent: 0,
  disAmount: 0,
  amount: 0,
  availableStock: 0,
});

export default function Billing({ inventoryItems = [], onInvoiceCreated, onPrintTrigger }) {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState('30 Days');
  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    address: '',
    contact: '',
    gstin: '',
    state: 'Tamil Nadu',
    stateCode: '33',
  });

  const [items, setItems] = useState([createInitialRow(1)]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch next invoice number on load
  useEffect(() => {
    fetchNextNo();
  }, []);

  const fetchNextNo = async () => {
    try {
      const res = await invoiceApi.getNextNumber();
      if (res.data?.nextInvoiceNo) {
        setInvoiceNo(res.data.nextInvoiceNo);
      }
    } catch (err) {
      console.warn('Using fallback invoice number generator');
      setInvoiceNo(`ASM/26-27/${String(Math.floor(Math.random() * 900) + 100)}`);
    }
  };

  // Detect state code from Buyer GSTIN
  const handleBuyerGstinChange = (val) => {
    const clean = val.toUpperCase().trim();
    let state = buyerDetails.state;
    let stateCode = buyerDetails.stateCode;

    if (clean.length >= 2) {
      const code = clean.substring(0, 2);
      stateCode = code;
      if (code === '33') state = 'Tamil Nadu';
      else if (code === '32') state = 'Kerala';
      else if (code === '29') state = 'Karnataka';
      else if (code === '37') state = 'Andhra Pradesh';
      else if (code === '36') state = 'Telangana';
      else state = 'Other State';
    }

    setBuyerDetails({
      ...buyerDetails,
      gstin: clean,
      state,
      stateCode,
    });
  };

  // When user selects a specific item variant from dropdown
  const handleItemSelect = (index, selectedItemId) => {
    const selected = inventoryItems.find((i) => i._id === selectedItemId);
    const updated = [...items];

    if (selected) {
      const gross = updated[index].qty * selected.rate;
      const disAmount = Number(((gross * updated[index].disPercent) / 100).toFixed(2));
      const amount = Number((gross - disAmount).toFixed(2));
      const selectedColor = (selected.color || 'BLACK').toUpperCase();
      const selectedSize = selected.size || selected.sizeRange || '6-10';

      updated[index] = {
        ...updated[index],
        itemId: selected._id,
        modelName: selected.modelName,
        color: selectedColor,
        size: selectedSize,
        description: selected.modelName,
        hsn: selected.hsn || '6402',
        mrp: selected.mrp,
        rate: selected.rate,
        availableStock: selected.stockQty,
        disAmount,
        amount,
      };
    } else {
      updated[index] = createInitialRow(index + 1);
    }
    setItems(updated);
  };

  // When user changes color directly for the selected row
  const handleColorChange = (index, newColor) => {
    const updated = [...items];
    const currentRow = updated[index];
    const upperColor = newColor.toUpperCase().trim();

    // Check if there is a matching inventory item with the same modelName & newColor
    const matchingVariant = inventoryItems.find(
      (inv) =>
        inv.modelName.toUpperCase() === (currentRow.modelName || '').toUpperCase() &&
        (inv.color || 'BLACK').toUpperCase() === upperColor &&
        (!currentRow.size || (inv.size || inv.sizeRange) === currentRow.size)
    ) || inventoryItems.find(
      (inv) =>
        inv.modelName.toUpperCase() === (currentRow.modelName || '').toUpperCase() &&
        (inv.color || 'BLACK').toUpperCase() === upperColor
    );

    if (matchingVariant) {
      const gross = currentRow.qty * matchingVariant.rate;
      const disAmount = Number(((gross * currentRow.disPercent) / 100).toFixed(2));
      const amount = Number((gross - disAmount).toFixed(2));

      updated[index] = {
        ...currentRow,
        itemId: matchingVariant._id,
        color: upperColor,
        size: matchingVariant.size || matchingVariant.sizeRange || currentRow.size,
        mrp: matchingVariant.mrp,
        rate: matchingVariant.rate,
        availableStock: matchingVariant.stockQty,
        disAmount,
        amount,
      };
    } else {
      // Custom color variant not in inventory
      updated[index] = {
        ...currentRow,
        color: upperColor,
        availableStock: 0,
      };
    }
    setItems(updated);
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const disPercent = Number(item.disPercent) || 0;

    const gross = qty * rate;
    const disAmount = Number(((gross * disPercent) / 100).toFixed(2));
    const amount = Number((gross - disAmount).toFixed(2));

    item.disAmount = disAmount;
    item.amount = amount;

    updated[index] = item;
    setItems(updated);
  };

  const handleAddRow = () => {
    setItems([...items, createInitialRow(items.length + 1)]);
  };

  const handleRemoveRow = (index) => {
    if (items.length === 1) return;
    const filtered = items.filter((_, i) => i !== index);
    const reindexed = filtered.map((it, idx) => ({ ...it, sn: idx + 1 }));
    setItems(reindexed);
  };

  // Live Calculations
  const isInterState = buyerDetails.stateCode !== '33';
  const totalQty = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);
  const totalBeforeTax = Number(items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0).toFixed(2));

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = 5.0;
    igstAmount = Number(((totalBeforeTax * 5.0) / 100).toFixed(2));
  } else {
    cgstRate = 2.5;
    cgstAmount = Number(((totalBeforeTax * 2.5) / 100).toFixed(2));
    sgstRate = 2.5;
    sgstAmount = Number(((totalBeforeTax * 2.5) / 100).toFixed(2));
  }

  const totalGst = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
  const rawGrandTotal = totalBeforeTax + totalGst;
  const netTotal = Math.round(rawGrandTotal);
  const roundOff = Number((netTotal - rawGrandTotal).toFixed(2));
  const amountInWords = convertNumberToRupeesClient(netTotal);

  // Real-time check for insufficient stock across all cart rows
  const stockViolations = items.filter(
    (it) => it.itemId && Number(it.qty) > Number(it.availableStock)
  );
  const hasInsufficientStock = stockViolations.length > 0;

  const handleCreateInvoice = async (triggerPrint = false) => {
    setErrorMsg('');
    if (!buyerDetails.name.trim()) {
      setErrorMsg('Please enter Buyer / Retailer Name');
      return;
    }

    const validItems = items.filter((it) => (it.modelName || it.description) && it.qty > 0);
    if (validItems.length === 0) {
      setErrorMsg('Please select at least one valid footwear model with quantity > 0');
      return;
    }

    // STRICT STOCK VALIDATION: Prevent bill creation if requested quantity exceeds available stock
    const violations = validItems.filter(
      (it) => it.itemId && Number(it.qty) > Number(it.availableStock)
    );

    if (violations.length > 0) {
      const first = violations[0];
      const alertMsg = `Cannot create bill. Insufficient stock for ${first.modelName || first.description} (Color: ${first.color || 'BLACK'}, Size: ${first.size || '-'}). Requested: ${first.qty} pairs, Available: ${first.availableStock} pairs.`;
      setErrorMsg(alertMsg);
      alert(alertMsg);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        invoiceNo,
        date,
        term,
        buyerDetails,
        items: validItems.map((it) => ({
          sn: it.sn,
          itemId: it.itemId || null,
          modelName: it.modelName || it.description,
          color: (it.color || 'BLACK').toUpperCase(),
          size: it.size || '6-10',
          description: it.description || it.modelName,
          hsn: it.hsn || '6402',
          qty: Number(it.qty),
          mrp: Number(it.mrp),
          rate: Number(it.rate),
          disPercent: Number(it.disPercent || 0),
          disAmount: Number(it.disAmount || 0),
          amount: Number(it.amount),
        })),
        isInterState,
      };

      const res = await invoiceApi.create(payload);
      const created = res.data.data;

      if (onInvoiceCreated) onInvoiceCreated(created);

      if (triggerPrint && onPrintTrigger) {
        onPrintTrigger(created);
      }

      // Reset for next bill
      fetchNextNo();
      setBuyerDetails({
        name: '',
        address: '',
        contact: '',
        gstin: '',
        state: 'Tamil Nadu',
        stateCode: '33',
      });
      setItems([createInitialRow(1)]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setErrorMsg(msg);
      alert(`[ERROR]: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">[ NEW GST BILL GENERATION ]</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Model, Size & Color Variant Billing | Strict Stock Verification | Seller: AS MARKETING (33APDPM1586P1ZG)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (window.confirm('Reset all fields in this billing form?')) {
                fetchNextNo();
                setItems([createInitialRow(1)]);
                setErrorMsg('');
              }
            }}
          >
            RESET
          </button>
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            color: 'var(--accent-rose)',
            background: 'rgba(248, 113, 113, 0.12)',
            padding: '10px 14px',
            borderRadius: '4px',
            border: '1px solid var(--accent-rose)',
            marginBottom: '16px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            fontWeight: '600',
          }}
        >
          [BILLING ERROR]: {errorMsg}
        </div>
      )}

      {/* Invoice & Buyer Header Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Section 1: Invoice Specifications */}
        <div style={{ background: '#131c30', padding: '14px', borderRadius: '4px', border: '1px solid #29384d' }}>
          <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
            [ 1. INVOICE META ]
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group">
              <label>INVOICE NO *</label>
              <input
                type="text"
                className="form-control"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="form-group">
              <label>INVOICE DATE</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>PAYMENT TERM</label>
              <select
                className="form-control"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="30 Days">30 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="Credit">Credit</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div className="form-group">
              <label>PLACE OF SUPPLY</label>
              <input
                type="text"
                className="form-control"
                readOnly
                value={isInterState ? `${buyerDetails.state} (${buyerDetails.stateCode})` : 'Tamil Nadu (33)'}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Buyer / Retailer Details */}
        <div style={{ background: '#131c30', padding: '14px', borderRadius: '4px', border: '1px solid #29384d' }}>
          <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '10px' }}>
            [ 2. BUYER / RETAILER (BILL TO) ]
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>BUYER / SHOP NAME *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. SRI BALAJI FOOTWEAR"
                value={buyerDetails.name}
                onChange={(e) => setBuyerDetails({ ...buyerDetails, name: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label>BUYER GSTIN (OR 'URP')</label>
              <input
                type="text"
                className="form-control"
                placeholder="33AAACB1234F1Z8"
                value={buyerDetails.gstin}
                onChange={(e) => handleBuyerGstinChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>CONTACT NUMBER</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 94421 XXXXX"
                value={buyerDetails.contact}
                onChange={(e) => setBuyerDetails({ ...buyerDetails, contact: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>BUYER ADDRESS & CITY</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Main Road, Kumbakonam, Tamil Nadu - 612001"
                value={buyerDetails.address}
                onChange={(e) => setBuyerDetails({ ...buyerDetails, address: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Itemized Goods Entry */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--accent-cyan)' }}>
            [ 3. ITEM LIST & QUANTITY ]
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleAddRow}>
            + ADD ROW [Alt+A]
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '32px' }}>S.N</th>
                <th style={{ minWidth: '220px' }}>SELECT VARIANT FROM STOCK</th>
                <th style={{ minWidth: '130px' }} className="text-center">COLOR</th>
                <th style={{ width: '65px' }} className="text-center">SIZE</th>
                <th style={{ width: '65px' }}>HSN</th>
                <th style={{ width: '100px' }} className="text-center">QTY (PRS)</th>
                <th style={{ width: '80px' }} className="text-right">MRP</th>
                <th style={{ width: '85px' }} className="text-right">RATE</th>
                <th style={{ width: '65px' }} className="text-right">DIS%</th>
                <th style={{ width: '80px' }} className="text-right">DISC. (Rs)</th>
                <th style={{ width: '95px' }} className="text-right">AMOUNT (Rs)</th>
                <th style={{ width: '40px' }} className="text-center">DEL</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => {
                const currentColor = (row.color || 'BLACK').toUpperCase();
                const availableColorsForModel = Array.from(
                  new Set(
                    inventoryItems
                      .filter((i) => i.modelName.toUpperCase() === (row.modelName || '').toUpperCase())
                      .map((i) => (i.color || 'BLACK').toUpperCase())
                  )
                );

                const isStockExceeded = row.itemId && Number(row.qty) > Number(row.availableStock);

                return (
                  <tr key={idx} style={isStockExceeded ? { background: 'rgba(248, 113, 113, 0.06)' } : {}}>
                    <td className="text-center">{row.sn}</td>
                    
                    {/* SELECT MODEL FROM STOCK */}
                    <td>
                      <select
                        className="form-control"
                        value={row.itemId}
                        onChange={(e) => handleItemSelect(idx, e.target.value)}
                        style={{ fontSize: '12px' }}
                      >
                        <option value="">-- Select Footwear Variant --</option>
                        {inventoryItems.map((inv) => (
                          <option key={inv._id} value={inv._id}>
                            {inv.modelName} | {inv.color || 'BLACK'} | Sz: {inv.size || inv.sizeRange} | Stock: {inv.stockQty} prs | Rs. {inv.rate}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* COLOR SELECTOR */}
                    <td className="text-center">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <span
                          className="color-dot"
                          style={{ backgroundColor: getColorDotHex(currentColor) }}
                        ></span>
                        <select
                          className="form-control"
                          value={currentColor}
                          onChange={(e) => handleColorChange(idx, e.target.value)}
                          style={{ fontSize: '11px', padding: '4px 6px', fontWeight: 700 }}
                        >
                          {/* Options for this model if known, plus presets */}
                          {Array.from(new Set([...availableColorsForModel, ...COLOR_PRESETS])).map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* SIZE */}
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={row.size}
                        onChange={(e) => handleRowChange(idx, 'size', e.target.value)}
                        style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600 }}
                        placeholder="Size"
                      />
                    </td>

                    {/* HSN */}
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={row.hsn}
                        onChange={(e) => handleRowChange(idx, 'hsn', e.target.value)}
                        style={{ textAlign: 'center', fontSize: '12px' }}
                      />
                    </td>

                    {/* QTY WITH REAL-TIME STOCK HIGHLIGHT */}
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={row.qty}
                        onChange={(e) => handleRowChange(idx, 'qty', e.target.value)}
                        style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          fontSize: '13px',
                          ...(isStockExceeded
                            ? {
                                borderColor: 'var(--accent-rose)',
                                backgroundColor: 'rgba(248, 113, 113, 0.18)',
                                color: 'var(--accent-rose)',
                                outline: '1px solid var(--accent-rose)',
                              }
                            : {}),
                        }}
                      />
                      {row.itemId && (
                        <div style={{ marginTop: '3px', lineHeight: 1.2 }}>
                          {isStockExceeded ? (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--accent-rose)',
                                fontWeight: '700',
                                display: 'block',
                                letterSpacing: '0.2px',
                              }}
                            >
                              ⚠ Max: {row.availableStock}
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--accent-emerald)',
                                display: 'block',
                              }}
                            >
                              ✓ Avail: {row.availableStock}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* MRP */}
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control text-right"
                        value={row.mrp}
                        onChange={(e) => handleRowChange(idx, 'mrp', e.target.value)}
                      />
                    </td>

                    {/* RATE */}
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control text-right"
                        value={row.rate}
                        onChange={(e) => handleRowChange(idx, 'rate', e.target.value)}
                        style={{ fontWeight: '700', color: 'var(--accent-amber)' }}
                      />
                    </td>

                    {/* DISCOUNT % */}
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="form-control text-right"
                        value={row.disPercent}
                        onChange={(e) => handleRowChange(idx, 'disPercent', e.target.value)}
                      />
                    </td>

                    {/* DISCOUNT AMOUNT */}
                    <td className="text-right" style={{ fontFamily: 'var(--font-mono)' }}>
                      {Number(row.disAmount || 0).toFixed(2)}
                    </td>

                    {/* LINE AMOUNT */}
                    <td className="text-right" style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>
                      {Number(row.amount || 0).toFixed(2)}
                    </td>

                    {/* DELETE ROW */}
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={items.length === 1}
                      >
                        X
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Calculation & Action Footer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
          background: '#131c30',
          padding: '16px',
          borderRadius: '4px',
          border: '1px solid #29384d',
        }}
      >
        {/* Left: Number to Words & Summary */}
        <div>
          <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
            AMOUNT IN WORDS:
          </div>
          <div
            style={{
              padding: '10px 12px',
              background: '#0d1527',
              border: '1px solid var(--border-color)',
              borderRadius: '3px',
              fontStyle: 'italic',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--text-primary)',
              minHeight: '44px',
            }}
          >
            {amountInWords}
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div>* TOTAL QUANTITY: <strong>{totalQty} Pairs</strong></div>
            <div>* TAX STATUS: <strong>{isInterState ? 'INTER-STATE (IGST 5%)' : 'INTRA-STATE (CGST 2.5% + SGST 2.5%)'}</strong></div>
            <div>* BANK: <strong>JAS MARKETING / SOUTH INDIAN BANK (A/C: 0076073000010634)</strong></div>
          </div>
        </div>

        {/* Right: Detailed Math */}
        <div>
          <table style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Total Before Tax:</td>
                <td className="text-right" style={{ fontWeight: '600' }}>Rs. {totalBeforeTax.toFixed(2)}</td>
              </tr>
              {isInterState ? (
                <tr>
                  <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Add IGST @ 5.0%:</td>
                  <td className="text-right">Rs. {igstAmount.toFixed(2)}</td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Add CGST @ 2.5%:</td>
                    <td className="text-right">Rs. {cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Add SGST @ 2.5%:</td>
                    <td className="text-right">Rs. {sgstAmount.toFixed(2)}</td>
                  </tr>
                </>
              )}
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Total GST (5%):</td>
                <td className="text-right" style={{ color: 'var(--accent-amber)' }}>Rs. {totalGst.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>Round Off:</td>
                <td className="text-right">{roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</td>
              </tr>
              <tr style={{ borderTop: '1px solid var(--border-strong)' }}>
                <td style={{ padding: '8px 0', fontSize: '16px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                  NET PAYABLE TOTAL:
                </td>
                <td
                  className="text-right"
                  style={{ padding: '8px 0', fontSize: '18px', fontWeight: '800', color: 'var(--accent-emerald)' }}
                >
                  Rs. {netTotal.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Insufficient Stock Real-time Alert Banner */}
          {hasInsufficientStock && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(248, 113, 113, 0.15)',
                border: '1px solid var(--accent-rose)',
                borderRadius: '4px',
                color: 'var(--accent-rose)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                fontWeight: '600',
              }}
            >
              [!] CANNOT SAVE/PRINT: {stockViolations.length} line item(s) exceed available warehouse inventory. Please adjust quantities.
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{
                flex: 1,
                ...(hasInsufficientStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
              onClick={() => handleCreateInvoice(false)}
              disabled={saving || hasInsufficientStock}
              title={hasInsufficientStock ? 'Cannot save: Entered quantity exceeds available stock' : ''}
            >
              {saving ? 'SAVING...' : 'SAVE BILL ONLY'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                flex: 1.5,
                fontWeight: '700',
                ...(hasInsufficientStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
              }}
              onClick={() => handleCreateInvoice(true)}
              disabled={saving || hasInsufficientStock}
              title={hasInsufficientStock ? 'Cannot print: Entered quantity exceeds available stock' : ''}
            >
              {saving ? 'SAVING...' : '[ PRINT BILL ]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
