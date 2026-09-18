import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  sn: {
    type: Number,
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false,
  },
  modelName: {
    type: String,
    trim: true,
    uppercase: true,
  },
  color: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'BLACK',
  },
  size: {
    type: String,
    trim: true,
    default: '6-10',
  },
  description: {
    type: String,
    required: [true, 'Description of goods is required'],
    trim: true,
  },
  hsn: {
    type: String,
    default: '6402',
    trim: true,
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1,
  },
  mrp: {
    type: Number,
    required: true,
    min: 0,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  disPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  disAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNo: {
      type: String,
      required: [true, 'Invoice Number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    term: {
      type: String,
      default: '30 Days',
      trim: true,
    },
    placeOfSupply: {
      type: String,
      default: 'Tamil Nadu (33)',
      trim: true,
    },
    sellerDetails: {
      name: { type: String, default: 'AS MARKETING' },
      tagline: { type: String, default: 'WHOLESALE FOOTWEAR DISTRIBUTOR' },
      address: {
        type: String,
        default: 'No. 14/B, Old Bus Stand Road, Near Flower Market, Thanjavur, Tamil Nadu - 613001',
      },
      contact: { type: String, default: 'Ph: +91 98424 55123, +91 94431 88290' },
      email: { type: String, default: 'asmarketingtnj@gmail.com' },
      gstin: { type: String, default: '33APDPM1586P1ZG' },
      state: { type: String, default: 'Tamil Nadu' },
      stateCode: { type: String, default: '33' },
    },
    buyerDetails: {
      name: { type: String, required: [true, 'Buyer Name is required'], trim: true },
      address: { type: String, default: '', trim: true },
      contact: { type: String, default: '', trim: true },
      gstin: { type: String, default: 'URP', trim: true, uppercase: true }, // URP = Unregistered Person
      state: { type: String, default: 'Tamil Nadu', trim: true },
      stateCode: { type: String, default: '33', trim: true },
    },
    items: [invoiceItemSchema],
    totalQty: {
      type: Number,
      required: true,
      default: 0,
    },
    totalBeforeTax: {
      type: Number,
      required: true,
      default: 0,
    },
    isInterState: {
      type: Boolean,
      default: false,
    },
    cgstRate: {
      type: Number,
      default: 2.5,
    },
    cgstAmount: {
      type: Number,
      default: 0,
    },
    sgstRate: {
      type: Number,
      default: 2.5,
    },
    sgstAmount: {
      type: Number,
      default: 0,
    },
    igstRate: {
      type: Number,
      default: 5.0,
    },
    igstAmount: {
      type: Number,
      default: 0,
    },
    totalGst: {
      type: Number,
      required: true,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    netTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    amountInWords: {
      type: String,
      required: true,
      default: '',
    },
    bankDetails: {
      accountName: { type: String, default: 'JAS MARKETING' },
      bankName: { type: String, default: 'SOUTH INDIAN BANK' },
      accountNo: { type: String, default: '0076073000010634' },
      ifsc: { type: String, default: 'SIBL0000076' },
      branch: { type: String, default: 'Thanjavur Branch' },
    },
    terms: {
      type: [String],
      default: [
        'Goods once sold will not be taken back or exchanged after 15 days.',
        'Interest @ 18% p.a. will be charged on overdue payments beyond due date.',
        'Subject to Thanjavur Jurisdiction only.',
      ],
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PAID', 'PARTIALLY_PAID', 'CANCELLED'],
      default: 'UNPAID',
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ invoiceNo: 1, 'buyerDetails.name': 1, date: -1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
