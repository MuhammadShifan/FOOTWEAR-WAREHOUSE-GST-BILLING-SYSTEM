import Invoice from '../models/Invoice.js';
import mongoose from 'mongoose';
import { numberToWordsRupees } from '../utils/numberToWords.js';
import { deductStockForItems, verifyStockAvailability } from './inventoryController.js';

let memoryInvoices = [
  {
    _id: 'inv_mem_1',
    invoiceNo: 'ASM/26-27/001',
    date: new Date('2026-09-12'),
    term: '30 Days',
    placeOfSupply: 'Tamil Nadu (33)',
    sellerDetails: {
      name: 'AS MARKETING',
      tagline: 'WHOLESALE FOOTWEAR DISTRIBUTOR',
      address: 'No. 14/B, Old Bus Stand Road, Near Flower Market, Thanjavur, Tamil Nadu - 613001',
      contact: 'Ph: +91 98424 55123, +91 94431 88290',
      email: 'asmarketingtnj@gmail.com',
      gstin: '33APDPM1586P1ZG',
      state: 'Tamil Nadu',
      stateCode: '33',
    },
    buyerDetails: {
      name: 'SRI BALAJI FOOTWEAR',
      address: 'Main Bazaar, Kumbakonam, Tamil Nadu - 612001',
      contact: '+91 94421 22345',
      gstin: '33AAACB1234F1Z8',
      state: 'Tamil Nadu',
      stateCode: '33',
    },
    items: [
      {
        sn: 1,
        modelName: 'WALKAROO-WG4512',
        color: 'BLACK',
        size: '9',
        description: 'WALKAROO-WG4512 (COLOR: BLACK | SIZE: 9)',
        hsn: '6402',
        qty: 24,
        mrp: 349,
        rate: 210,
        disPercent: 5,
        disAmount: 252.0,
        amount: 4788.0,
      },
      {
        sn: 2,
        modelName: 'VKC-PRIDE-7014',
        color: 'BROWN',
        size: '8',
        description: 'VKC-PRIDE-7014 (COLOR: BROWN | SIZE: 8)',
        hsn: '6402',
        qty: 36,
        mrp: 449,
        rate: 280,
        disPercent: 0,
        disAmount: 0.0,
        amount: 10080.0,
      },
    ],
    totalQty: 60,
    totalBeforeTax: 14868.0,
    isInterState: false,
    cgstRate: 2.5,
    cgstAmount: 371.7,
    sgstRate: 2.5,
    sgstAmount: 371.7,
    igstRate: 5.0,
    igstAmount: 0.0,
    totalGst: 743.4,
    roundOff: -0.4,
    netTotal: 15611.0,
    amountInWords: 'Rupees Fifteen Thousand Six Hundred Eleven Only',
    bankDetails: {
      accountName: 'JAS MARKETING',
      bankName: 'SOUTH INDIAN BANK',
      accountNo: '0076073000010634',
      ifsc: 'SIBL0000076',
      branch: 'Thanjavur Branch',
    },
    terms: [
      'Goods once sold will not be taken back or exchanged after 15 days.',
      'Interest @ 18% p.a. will be charged on overdue payments beyond due date.',
      'Subject to Thanjavur Jurisdiction only.',
    ],
    status: 'PAID',
    createdAt: new Date('2026-09-12T10:30:00Z'),
  },
];

const isDbConnected = () => mongoose.connection.readyState === 1;

// Generate sequential Invoice Number
const getNextInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const prefix = `ASM/${String(currentYear).slice(-2)}-${nextYearShort}/`;

  if (isDbConnected()) {
    const lastInvoice = await Invoice.findOne({ invoiceNo: { $regex: `^${prefix}` } })
      .sort({ createdAt: -1 })
      .lean();

    if (!lastInvoice) {
      return `${prefix}001`;
    }

    const lastNumStr = lastInvoice.invoiceNo.split('/').pop();
    const lastNum = parseInt(lastNumStr, 10);
    const nextNum = isNaN(lastNum) ? 1 : lastNum + 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  } else {
    const count = memoryInvoices.length + 1;
    return `${prefix}${String(count).padStart(3, '0')}`;
  }
};

// @desc    Get next suggested invoice number
// @route   GET /api/invoices/next-number
export const getNextInvoiceNo = async (req, res) => {
  try {
    const nextNo = await getNextInvoiceNumber();
    return res.status(200).json({ success: true, nextInvoiceNo: nextNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const { search, status, fromDate, toDate } = req.query;

    if (isDbConnected()) {
      let query = {};

      if (search) {
        query.$or = [
          { invoiceNo: { $regex: search, $options: 'i' } },
          { 'buyerDetails.name': { $regex: search, $options: 'i' } },
          { 'buyerDetails.gstin': { $regex: search, $options: 'i' } },
        ];
      }

      if (status) {
        query.status = status;
      }

      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) query.date.$lte = new Date(toDate);
      }

      const invoices = await Invoice.find(query).sort({ date: -1, createdAt: -1 });
      return res.status(200).json({ success: true, count: invoices.length, data: invoices });
    } else {
      let invs = [...memoryInvoices];

      if (search) {
        const s = search.toLowerCase();
        invs = invs.filter(
          (i) =>
            i.invoiceNo.toLowerCase().includes(s) ||
            i.buyerDetails.name.toLowerCase().includes(s) ||
            (i.buyerDetails.gstin && i.buyerDetails.gstin.toLowerCase().includes(s))
        );
      }

      if (status) {
        invs = invs.filter((i) => i.status === status);
      }

      return res.status(200).json({ success: true, count: invs.length, data: invs, mode: 'memory' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      let invoice;
      if (mongoose.Types.ObjectId.isValid(id)) {
        invoice = await Invoice.findById(id);
      }
      if (!invoice) {
        invoice = await Invoice.findOne({ invoiceNo: id.toUpperCase() });
      }

      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
      return res.status(200).json({ success: true, data: invoice });
    } else {
      const invoice = memoryInvoices.find((i) => i._id === id || i.invoiceNo === id.toUpperCase());
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
      return res.status(200).json({ success: true, data: invoice });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new GST Invoice & deduct stock
// @route   POST /api/invoices
export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNo,
      date,
      term,
      buyerDetails,
      items,
      isInterState,
      status,
    } = req.body;

    if (!buyerDetails || !buyerDetails.name) {
      return res.status(400).json({ success: false, message: 'Buyer Name is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required' });
    }

    // Process line items and compute exact totals
    let totalQty = 0;
    let totalBeforeTax = 0;

    const processedItems = items.map((item, index) => {
      const sn = item.sn || index + 1;
      const qty = Number(item.qty) || 1;
      const mrp = Number(item.mrp) || 0;
      const rate = Number(item.rate) || 0;
      const disPercent = Number(item.disPercent) || 0;
      const color = item.color ? item.color.trim().toUpperCase() : 'BLACK';
      const size = item.size ? item.size.trim() : '6-10';
      const modelName = item.modelName ? item.modelName.trim().toUpperCase() : (item.description ? item.description.trim().toUpperCase() : 'FOOTWEAR ITEM');

      const gross = qty * rate;
      const disAmount = Number(((gross * disPercent) / 100).toFixed(2));
      const amount = Number((gross - disAmount).toFixed(2));

      totalQty += qty;
      totalBeforeTax += amount;

      // Construct descriptive text if not explicitly formatted with color & size
      let description = item.description ? item.description.trim().toUpperCase() : modelName;

      return {
        sn,
        itemId: item.itemId || null,
        modelName,
        color,
        size,
        description,
        hsn: item.hsn || '6402',
        qty,
        mrp,
        rate,
        disPercent,
        disAmount,
        amount,
      };
    });

    totalBeforeTax = Number(totalBeforeTax.toFixed(2));

    // Determine state & Inter-State GST vs Intra-State (Tamil Nadu = 33)
    const buyerStateCode = buyerDetails.stateCode || (buyerDetails.gstin ? buyerDetails.gstin.substring(0, 2) : '33');
    const interState = isInterState !== undefined ? Boolean(isInterState) : buyerStateCode !== '33';

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (interState) {
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
    const amountInWords = numberToWordsRupees(netTotal);

    const finalInvoiceNo = invoiceNo && invoiceNo.trim() ? invoiceNo.trim().toUpperCase() : await getNextInvoiceNumber();

    // Strict backend stock availability verification before proceeding
    const stockCheck = await verifyStockAvailability(processedItems);
    if (!stockCheck.available) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
      });
    }

    const invoiceData = {
      invoiceNo: finalInvoiceNo,
      date: date ? new Date(date) : new Date(),
      term: term || '30 Days',
      placeOfSupply: interState ? `${buyerDetails.state || 'Other State'} (${buyerStateCode})` : 'Tamil Nadu (33)',
      sellerDetails: {
        name: 'AS MARKETING',
        tagline: 'WHOLESALE FOOTWEAR DISTRIBUTOR',
        address: 'No. 14/B, Old Bus Stand Road, Near Flower Market, Thanjavur, Tamil Nadu - 613001',
        contact: 'Ph: +91 98424 55123, +91 94431 88290',
        email: 'asmarketingtnj@gmail.com',
        gstin: '33APDPM1586P1ZG',
        state: 'Tamil Nadu',
        stateCode: '33',
      },
      buyerDetails: {
        name: buyerDetails.name.trim().toUpperCase(),
        address: buyerDetails.address || '',
        contact: buyerDetails.contact || '',
        gstin: buyerDetails.gstin ? buyerDetails.gstin.trim().toUpperCase() : 'URP',
        state: buyerDetails.state || (interState ? 'Other State' : 'Tamil Nadu'),
        stateCode: buyerStateCode,
      },
      items: processedItems,
      totalQty,
      totalBeforeTax,
      isInterState: interState,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalGst,
      roundOff,
      netTotal,
      amountInWords,
      bankDetails: {
        accountName: 'JAS MARKETING',
        bankName: 'SOUTH INDIAN BANK',
        accountNo: '0076073000010634',
        ifsc: 'SIBL0000076',
        branch: 'Thanjavur Branch',
      },
      terms: [
        'Goods once sold will not be taken back or exchanged after 15 days.',
        'Interest @ 18% p.a. will be charged on overdue payments beyond due date.',
        'Subject to Thanjavur Jurisdiction only.',
      ],
      status: status || 'PAID',
    };

    if (isDbConnected()) {
      const createdInvoice = await Invoice.create(invoiceData);
      // Auto-deduct stock
      await deductStockForItems(processedItems);
      return res.status(201).json({ success: true, data: createdInvoice });
    } else {
      const createdInvoice = {
        _id: 'inv_mem_' + Date.now(),
        ...invoiceData,
        createdAt: new Date(),
      };
      memoryInvoices.unshift(createdInvoice);
      await deductStockForItems(processedItems);
      return res.status(201).json({ success: true, data: createdInvoice, mode: 'memory' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice status or details
// @route   PUT /api/invoices/:id
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (isDbConnected()) {
      const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true });
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
      return res.status(200).json({ success: true, data: invoice });
    } else {
      const idx = memoryInvoices.findIndex((i) => i._id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Invoice not found' });
      memoryInvoices[idx].status = status;
      return res.status(200).json({ success: true, data: memoryInvoices[idx] });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
