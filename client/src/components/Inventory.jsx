import React, { useState } from 'react';
import { inventoryApi } from '../services/api';

export const getColorDotHex = (color) => {
  switch ((color || '').toUpperCase().trim()) {
    case 'BLACK': return '#111827';
    case 'BROWN': return '#854d0e';
    case 'BLUE': return '#2563eb';
    case 'NAVY': return '#1e3a8a';
    case 'RED': return '#dc2626';
    case 'MAROON': return '#881337';
    case 'TAN': return '#d97706';
    case 'BEIGE': return '#d4b996';
    case 'GREY':
    case 'GRAY': return '#9ca3af';
    case 'WHITE': return '#f8fafc';
    case 'GREEN':
    case 'OLIVE': return '#16a34a';
    case 'PINK': return '#ec4899';
    case 'YELLOW': return '#eab308';
    case 'ORANGE': return '#f97316';
    default: return '#38bdf8';
  }
};

export const COLOR_PRESETS = ['BLACK', 'BROWN', 'BLUE', 'NAVY', 'RED', 'TAN', 'GREY', 'WHITE', 'OLIVE', 'PINK'];
export const SIZE_PRESETS = ['6', '7', '8', '9', '10', '11', '12', '6-10', '7-10', '40-45', '4-8', '11-1'];

export default function Inventory({ items = [], loading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    modelName: '',
    brand: 'WALKAROO',
    category: 'DAILY WEAR CHAPPAL',
    color: 'BLACK',
    size: '9',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: '',
    rate: '',
    stockQty: '',
    minStockAlert: '15',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      modelName: '',
      brand: 'WALKAROO',
      category: 'DAILY WEAR CHAPPAL',
      color: 'BLACK',
      size: '9',
      sizeRange: '6-10',
      hsn: '6402',
      mrp: '',
      rate: '',
      stockQty: '',
      minStockAlert: '15',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      modelName: item.modelName,
      brand: item.brand || 'GENERAL',
      category: item.category || 'GENTS CHAPPAL',
      color: item.color || 'BLACK',
      size: item.size || item.sizeRange || '6-10',
      sizeRange: item.sizeRange || item.size || '6-10',
      hsn: item.hsn || '6402',
      mrp: item.mrp,
      rate: item.rate,
      stockQty: item.stockQty,
      minStockAlert: item.minStockAlert || 10,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleQuickStock = async (id, adjustment) => {
    try {
      await inventoryApi.adjustStock(id, { adjustment });
      onRefresh();
    } catch (err) {
      alert(`Error adjusting stock: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDelete = async (id, name, color, size) => {
    const desc = `${name} (Color: ${color || 'BLACK'}, Size: ${size || '-'})`;
    if (window.confirm(`Are you sure you want to delete footwear variant "${desc}"?`)) {
      try {
        await inventoryApi.delete(id);
        onRefresh();
      } catch (err) {
        alert(`Error deleting item: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      const payload = {
        ...formData,
        modelName: formData.modelName.trim().toUpperCase(),
        color: formData.color.trim().toUpperCase(),
        size: formData.size.trim(),
        sizeRange: formData.size.trim(),
        brand: formData.brand.trim().toUpperCase(),
        mrp: Number(formData.mrp),
        rate: Number(formData.rate),
        stockQty: Number(formData.stockQty),
        minStockAlert: Number(formData.minStockAlert || 10),
      };

      if (editingItem) {
        await inventoryApi.update(editingItem._id, payload);
      } else {
        await inventoryApi.create(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Get list of unique colors from existing items
  const availableColors = Array.from(
    new Set(items.map((it) => (it.color || 'BLACK').toUpperCase()))
  ).sort();

  const filteredItems = items.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      item.modelName?.toLowerCase().includes(s) ||
      item.brand?.toLowerCase().includes(s) ||
      item.category?.toLowerCase().includes(s) ||
      item.color?.toLowerCase().includes(s) ||
      item.size?.toLowerCase().includes(s);

    const matchesColor =
      selectedColorFilter === 'ALL' || (item.color || 'BLACK').toUpperCase() === selectedColorFilter;

    if (showLowStockOnly) {
      return matchesSearch && matchesColor && item.stockQty <= (item.minStockAlert || 10);
    }
    return matchesSearch && matchesColor;
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">[ WAREHOUSE FOOTWEAR INVENTORY ]</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Real-time stock tracking by Model + Color + Size combination
          </span>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          + ADD NEW MODEL / VARIANT
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="form-control"
          placeholder="SEARCH MODEL, COLOR (e.g. BLACK, BLUE), BRAND, SIZE..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '240px' }}
        />
        
        {/* Color Filter Dropdown */}
        <select
          className="form-control"
          value={selectedColorFilter}
          onChange={(e) => setSelectedColorFilter(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="ALL">ALL COLORS</option>
          {availableColors.map((c) => (
            <option key={c} value={c}>
              COLOR: {c}
            </option>
          ))}
        </select>

        <button
          className={`btn ${showLowStockOnly ? 'btn-danger' : 'btn-outline'}`}
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
        >
          {showLowStockOnly ? '[*] SHOWING LOW STOCK ONLY' : '[ ] FILTER LOW STOCK'}
        </button>
        <button className="btn btn-outline" onClick={onRefresh}>
          REFRESH
        </button>
      </div>

      {/* Inventory Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>MODEL / DESCRIPTION</th>
              <th>BRAND</th>
              <th>CATEGORY</th>
              <th className="text-center" style={{ minWidth: '100px' }}>COLOR</th>
              <th className="text-center" style={{ width: '65px' }}>SIZE</th>
              <th>HSN</th>
              <th className="text-right">MRP (Rs)</th>
              <th className="text-right">RATE (Rs)</th>
              <th className="text-center">STOCK (PAIRS)</th>
              <th className="text-center">STATUS</th>
              <th className="text-center" style={{ width: '190px' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="12" className="text-center" style={{ padding: '20px' }}>
                  LOADING INVENTORY DATA...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="12" className="text-center" style={{ padding: '20px', color: 'var(--text-muted)' }}>
                  NO FOOTWEAR MODELS FOUND MATCHING SEARCH / COLOR FILTER.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, idx) => {
                const isLow = item.stockQty <= (item.minStockAlert || 10);
                const isOut = item.stockQty <= 0;
                const itemColor = (item.color || 'BLACK').toUpperCase();
                const itemSize = item.size || item.sizeRange || '-';

                return (
                  <tr key={item._id || idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{item.modelName}</td>
                    <td>{item.brand}</td>
                    <td>{item.category}</td>
                    
                    {/* COLOR COLUMN */}
                    <td className="text-center">
                      <span className="color-badge">
                        <span
                          className="color-dot"
                          style={{ backgroundColor: getColorDotHex(itemColor) }}
                        ></span>
                        {itemColor}
                      </span>
                    </td>

                    {/* SIZE COLUMN */}
                    <td className="text-center" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {itemSize}
                    </td>

                    <td>{item.hsn || '6402'}</td>
                    <td className="text-right">{Number(item.mrp).toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                      {Number(item.rate).toFixed(2)}
                    </td>
                    <td className="text-center" style={{ fontWeight: 700, fontSize: '14px' }}>
                      {item.stockQty}
                    </td>
                    <td className="text-center">
                      {isOut ? (
                        <span className="badge badge-danger">OUT OF STOCK</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">! LOW ({item.stockQty})</span>
                      ) : (
                        <span className="badge badge-success">IN STOCK</span>
                      )}
                    </td>
                    <td className="text-center">
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Add 12 Pairs (1 Box)"
                          onClick={() => handleQuickStock(item._id, 12)}
                        >
                          +12
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Reduce 12 Pairs (1 Box)"
                          onClick={() => handleQuickStock(item._id, -12)}
                        >
                          -12
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEdit(item)}
                        >
                          EDIT
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item._id, item.modelName, item.color, item.size)}
                        >
                          DEL
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="panel-title">
                {editingItem
                  ? `[ EDIT VARIANT: ${editingItem.modelName} (${editingItem.color || 'BLACK'} / SIZE ${editingItem.size || '-'}) ]`
                  : '[ ADD NEW CHAPPAL / FOOTWEAR VARIANT ]'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setIsModalOpen(false)}>
                [X] CLOSE
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{ color: 'var(--accent-rose)', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
                    [ERROR]: {errorMsg}
                  </div>
                )}
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>MODEL NAME *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. WALKAROO-WG4512, AEROWALK-NV58, VKC-7014"
                      required
                      value={formData.modelName}
                      onChange={(e) => setFormData({ ...formData, modelName: e.target.value.toUpperCase() })}
                    />
                  </div>

                  {/* COLOR SELECTION */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>COLOR VARIANT *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. BLACK, BROWN, BLUE, RED, TAN, NAVY..."
                      required
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                    />
                    <div className="color-chip-group">
                      {COLOR_PRESETS.map((colorName) => (
                        <button
                          key={colorName}
                          type="button"
                          className={`color-chip ${formData.color.toUpperCase() === colorName ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, color: colorName })}
                        >
                          <span
                            className="color-dot"
                            style={{ backgroundColor: getColorDotHex(colorName) }}
                          ></span>
                          {colorName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SIZE SELECTION */}
                  <div className="form-group">
                    <label>SIZE / SIZE RANGE *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 9, 8, 6-10, 42"
                      required
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    />
                    <div className="color-chip-group">
                      {['6', '7', '8', '9', '10', '6-10'].map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          className={`color-chip ${formData.size === sz ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, size: sz })}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>BRAND</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. WALKAROO / AEROWALK / VKC"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="form-group">
                    <label>CATEGORY</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. DAILY WEAR CHAPPAL / GENTS CHAPPAL"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>HSN CODE</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hsn}
                      onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>MRP (Rs) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 349.00"
                      required
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>WHOLESALE RATE (Rs) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      placeholder="e.g. 210.00"
                      required
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>STOCK (PAIRS) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 14"
                      required
                      value={formData.stockQty}
                      onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>MIN STOCK ALERT THRESHOLD</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  CANCEL
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'SAVING...' : editingItem ? 'UPDATE VARIANT' : '+ SAVE VARIANT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
