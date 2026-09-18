import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      uppercase: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
      uppercase: true,
      default: 'BLACK',
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
      default: '6-10',
    },
    sizeRange: {
      type: String,
      trim: true,
      default: '6-10',
    },
    brand: {
      type: String,
      default: 'GENERAL',
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      default: 'GENTS CHAPPAL',
      trim: true,
    },
    hsn: {
      type: String,
      default: '6402',
      trim: true,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0,
    },
    rate: {
      type: Number,
      required: [true, 'Rate (Wholesale price) is required'],
      min: 0,
    },
    stockQty: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: 0,
    },
    minStockAlert: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique combination of Model + Color + Size
itemSchema.index({ modelName: 1, color: 1, size: 1 }, { unique: true });

// Index for fast search
itemSchema.index({ modelName: 'text', brand: 'text', category: 'text', color: 'text', size: 'text' });

const Item = mongoose.model('Item', itemSchema);
export default Item;
