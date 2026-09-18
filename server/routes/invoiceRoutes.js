import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  getNextInvoiceNo,
  updateInvoiceStatus,
} from '../controllers/invoiceController.js';

const router = express.Router();

router.route('/').get(getInvoices).post(createInvoice);
router.route('/next-number').get(getNextInvoiceNo);
router.route('/:id').get(getInvoiceById).put(updateInvoiceStatus);

export default router;
