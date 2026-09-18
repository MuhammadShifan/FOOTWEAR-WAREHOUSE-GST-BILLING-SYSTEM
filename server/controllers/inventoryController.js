import Item from '../models/Item.js';
import mongoose from 'mongoose';

// Fallback in-memory store if MongoDB is offline or disconnected
let memoryItems = [
  {
    _id: 'mem_1',
    modelName: 'WALKAROO-WG4512',
    brand: 'WALKAROO',
    category: 'DAILY WEAR CHAPPAL',
    color: 'BLACK',
    size: '9',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: 349,
    rate: 210,
    stockQty: 14,
    minStockAlert: 15,
    isActive: true,
  },
  {
    _id: 'mem_2',
    modelName: 'WALKAROO-WG4512',
    brand: 'WALKAROO',
    category: 'DAILY WEAR CHAPPAL',
    color: 'BLUE',
    size: '9',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: 349,
    rate: 210,
    stockQty: 42,
    minStockAlert: 15,
    isActive: true,
  },
  {
    _id: 'mem_3',
    modelName: 'WALKAROO-WG4512',
    brand: 'WALKAROO',
    category: 'DAILY WEAR CHAPPAL',
    color: 'RED',
    size: '8',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: 349,
    rate: 210,
    stockQty: 18,
    minStockAlert: 15,
    isActive: true,
  },
  {
    _id: 'mem_4',
    modelName: 'AEROWALK-NV58',
    brand: 'AEROWALK',
    category: 'GENTS CHAPPAL',
    color: 'BLACK',
    size: '42',
    sizeRange: '40-45',
    hsn: '6402',
    mrp: 399,
    rate: 240,
    stockQty: 85,
    minStockAlert: 15,
    isActive: true,
  },
  {
    _id: 'mem_5',
    modelName: 'AEROWALK-NV58',
    brand: 'AEROWALK',
    category: 'GENTS CHAPPAL',
    color: 'BROWN',
    size: '42',
    sizeRange: '40-45',
    hsn: '6402',
    mrp: 399,
    rate: 240,
    stockQty: 80,
    minStockAlert: 20,
    isActive: true,
  },
  {
    _id: 'mem_6',
    modelName: 'VKC-PRIDE-7014',
    brand: 'VKC',
    category: 'GENTS CHAPPAL',
    color: 'BROWN',
    size: '8',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: 449,
    rate: 280,
    stockQty: 120,
    minStockAlert: 20,
    isActive: true,
  },
  {
    _id: 'mem_7',
    modelName: 'PARAGON-VERTEX-9211',
    brand: 'PARAGON',
    category: 'PU SANDAL',
    color: 'BLACK',
    size: '9',
    sizeRange: '7-10',
    hsn: '6404',
    mrp: 499,
    rate: 310,
    stockQty: 8,
    minStockAlert: 12,
    isActive: true,
  },
  {
    _id: 'mem_8',
    modelName: 'AEROWALK-LADIES-FLIP-L62',
    brand: 'AEROWALK',
    category: 'LADIES CHAPPAL',
    color: 'PINK',
    size: '6',
    sizeRange: '4-8',
    hsn: '6402',
    mrp: 299,
    rate: 180,
    stockQty: 60,
    minStockAlert: 10,
    isActive: true,
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all inventory items (with optional search, color, size, and low stock filtering)
// @route   GET /api/inventory
export const getItems = async (req, res) => {
  try {
    const { search, color, size, lowStock } = req.query;

    if (isDbConnected()) {
      let query = { isActive: true };

      if (color) {
        query.color = color.trim().toUpperCase();
      }

      if (size) {
        query.size = size.trim();
      }

      if (search) {
        query.$or = [
          { modelName: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { color: { $regex: search, $options: 'i' } },
          { size: { $regex: search, $options: 'i' } },
        ];
      }

      let items = await Item.find(query).sort({ modelName: 1, color: 1, size: 1 });

      if (lowStock === 'true') {
        items = items.filter((item) => item.stockQty <= item.minStockAlert);
      }

      return res.status(200).json({ success: true, count: items.length, data: items });
    } else {
      // In-Memory fallback
      let items = [...memoryItems].filter((i) => i.isActive);

      if (color) {
        items = items.filter((i) => (i.color || '').toUpperCase() === color.trim().toUpperCase());
      }

      if (size) {
        items = items.filter((i) => (i.size || '') === size.trim());
      }

      if (search) {
        const s = search.toLowerCase();
        items = items.filter(
          (i) =>
            i.modelName.toLowerCase().includes(s) ||
            i.brand.toLowerCase().includes(s) ||
            i.category.toLowerCase().includes(s) ||
            (i.color && i.color.toLowerCase().includes(s)) ||
            (i.size && i.size.toLowerCase().includes(s))
        );
      }

      if (lowStock === 'true') {
        items = items.filter((i) => i.stockQty <= i.minStockAlert);
      }

      return res.status(200).json({ success: true, count: items.length, data: items, mode: 'memory' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single item
// @route   GET /api/inventory/:id
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.status(200).json({ success: true, data: item });
    } else {
      const item = memoryItems.find((i) => i._id === id);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.status(200).json({ success: true, data: item });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new footwear model/variant to inventory
// @route   POST /api/inventory
export const createItem = async (req, res) => {
  try {
    const { modelName, brand, category, color, size, sizeRange, hsn, mrp, rate, stockQty, minStockAlert } = req.body;

    if (!modelName || mrp === undefined || rate === undefined || stockQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide modelName, mrp, rate, and stockQty',
      });
    }

    const itemColor = color ? color.trim().toUpperCase() : 'BLACK';
    const itemSize = size ? size.trim() : (sizeRange ? sizeRange.trim() : '6-10');
    const normalizedModel = modelName.trim().toUpperCase();

    if (isDbConnected()) {
      const existing = await Item.findOne({
        modelName: normalizedModel,
        color: itemColor,
        size: itemSize,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Footwear variant "${normalizedModel}" (Color: ${itemColor}, Size: ${itemSize}) already exists. Please update its stock or change the variant.`,
        });
      }

      const newItem = await Item.create({
        modelName: normalizedModel,
        brand: brand ? brand.trim().toUpperCase() : 'GENERAL',
        category: category || 'GENTS CHAPPAL',
        color: itemColor,
        size: itemSize,
        sizeRange: sizeRange || itemSize,
        hsn: hsn || '6402',
        mrp: Number(mrp),
        rate: Number(rate),
        stockQty: Number(stockQty),
        minStockAlert: minStockAlert ? Number(minStockAlert) : 10,
      });

      return res.status(201).json({ success: true, data: newItem });
    } else {
      const exists = memoryItems.some(
        (i) =>
          i.modelName.toLowerCase() === normalizedModel.toLowerCase() &&
          (i.color || 'BLACK').toUpperCase() === itemColor &&
          (i.size || i.sizeRange || '6-10') === itemSize
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          message: `Footwear variant "${normalizedModel}" (Color: ${itemColor}, Size: ${itemSize}) already exists in inventory.`,
        });
      }

      const newItem = {
        _id: 'mem_' + Date.now(),
        modelName: normalizedModel,
        brand: brand ? brand.trim().toUpperCase() : 'GENERAL',
        category: category || 'GENTS CHAPPAL',
        color: itemColor,
        size: itemSize,
        sizeRange: sizeRange || itemSize,
        hsn: hsn || '6402',
        mrp: Number(mrp),
        rate: Number(rate),
        stockQty: Number(stockQty),
        minStockAlert: minStockAlert ? Number(minStockAlert) : 10,
        isActive: true,
        createdAt: new Date(),
      };
      memoryItems.push(newItem);
      return res.status(201).json({ success: true, data: newItem, mode: 'memory' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update inventory item details
// @route   PUT /api/inventory/:id
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.modelName) updateData.modelName = updateData.modelName.trim().toUpperCase();
    if (updateData.color) updateData.color = updateData.color.trim().toUpperCase();
    if (updateData.brand) updateData.brand = updateData.brand.trim().toUpperCase();

    if (isDbConnected()) {
      const updated = await Item.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.status(200).json({ success: true, data: updated });
    } else {
      const idx = memoryItems.findIndex((i) => i._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });

      memoryItems[idx] = { ...memoryItems[idx], ...updateData };
      return res.status(200).json({ success: true, data: memoryItems[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Quick stock adjustment (+/- stock)
// @route   PATCH /api/inventory/:id/stock
export const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, newStock } = req.body;

    if (isDbConnected()) {
      let item = await Item.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

      if (newStock !== undefined) {
        item.stockQty = Math.max(0, Number(newStock));
      } else if (adjustment !== undefined) {
        item.stockQty = Math.max(0, item.stockQty + Number(adjustment));
      }

      await item.save();
      return res.status(200).json({ success: true, data: item });
    } else {
      const idx = memoryItems.findIndex((i) => i._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });

      if (newStock !== undefined) {
        memoryItems[idx].stockQty = Math.max(0, Number(newStock));
      } else if (adjustment !== undefined) {
        memoryItems[idx].stockQty = Math.max(0, memoryItems[idx].stockQty + Number(adjustment));
      }

      return res.status(200).json({ success: true, data: memoryItems[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete item
// @route   DELETE /api/inventory/:id
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const item = await Item.findByIdAndDelete(id);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      return res.status(200).json({ success: true, message: 'Item deleted successfully' });
    } else {
      const idx = memoryItems.findIndex((i) => i._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
      memoryItems.splice(idx, 1);
      return res.status(200).json({ success: true, message: 'Item deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify strict stock availability before invoice creation to prevent negative inventory
export const verifyStockAvailability = async (items) => {
  for (const item of items) {
    const qtyRequested = Number(item.qty) || 0;
    if (qtyRequested <= 0) continue;

    let dbItem = null;
    if (isDbConnected()) {
      if (item.itemId) {
        dbItem = await Item.findById(item.itemId);
      }
      if (!dbItem && item.modelName && item.color) {
        dbItem = await Item.findOne({
          modelName: item.modelName.trim().toUpperCase(),
          color: item.color.trim().toUpperCase(),
          ...(item.size ? { size: item.size.trim() } : {}),
        });
      }
      if (!dbItem && item.description) {
        dbItem = await Item.findOne({
          modelName: item.description.trim().toUpperCase(),
        });
      }
    } else {
      if (item.itemId) {
        dbItem = memoryItems.find((i) => i._id === item.itemId);
      }
      if (!dbItem && item.modelName && item.color) {
        dbItem = memoryItems.find(
          (i) =>
            i.modelName.toUpperCase() === item.modelName.trim().toUpperCase() &&
            (i.color || '').toUpperCase() === item.color.trim().toUpperCase() &&
            (!item.size || i.size === item.size.trim())
        );
      }
      if (!dbItem && item.description) {
        dbItem = memoryItems.find(
          (i) => i.modelName.toUpperCase() === (item.description || '').trim().toUpperCase()
        );
      }
    }

    if (!dbItem) {
      return {
        available: false,
        message: `Cannot create bill. Footwear item "${item.modelName || item.description}" (Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}) was not found in warehouse inventory.`,
      };
    }

    if (dbItem.stockQty < qtyRequested) {
      return {
        available: false,
        message: `Cannot create bill. Insufficient stock for ${dbItem.modelName} (Color: ${dbItem.color || 'BLACK'}, Size: ${dbItem.size || '-'}). Requested: ${qtyRequested} pairs, Available: ${dbItem.stockQty} pairs.`,
      };
    }
  }

  return { available: true };
};

// Internal stock deduction helper used by invoice creation
export const deductStockForItems = async (items) => {
  for (const item of items) {
    const qtyToDeduct = Number(item.qty) || 0;
    if (qtyToDeduct <= 0) continue;

    if (isDbConnected()) {
      if (item.itemId) {
        await Item.findByIdAndUpdate(item.itemId, {
          $inc: { stockQty: -qtyToDeduct },
        });
      } else if (item.modelName && item.color) {
        await Item.findOneAndUpdate(
          {
            modelName: item.modelName.trim().toUpperCase(),
            color: item.color.trim().toUpperCase(),
            ...(item.size ? { size: item.size.trim() } : {}),
          },
          { $inc: { stockQty: -qtyToDeduct } }
        );
      } else if (item.description) {
        await Item.findOneAndUpdate(
          { modelName: item.description.trim().toUpperCase() },
          { $inc: { stockQty: -qtyToDeduct } }
        );
      }
    } else {
      let found = null;
      if (item.itemId) {
        found = memoryItems.find((i) => i._id === item.itemId);
      }
      if (!found && item.modelName && item.color) {
        found = memoryItems.find(
          (i) =>
            i.modelName.toUpperCase() === item.modelName.trim().toUpperCase() &&
            (i.color || '').toUpperCase() === item.color.trim().toUpperCase() &&
            (!item.size || i.size === item.size.trim())
        );
      }
      if (!found && item.description) {
        found = memoryItems.find(
          (i) => i.modelName.toUpperCase() === (item.description || '').trim().toUpperCase()
        );
      }

      if (found) {
        found.stockQty = Math.max(0, found.stockQty - qtyToDeduct);
      }
    }
  }
};
