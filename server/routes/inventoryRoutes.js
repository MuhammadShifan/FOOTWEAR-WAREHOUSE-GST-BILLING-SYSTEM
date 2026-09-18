import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  adjustStock,
  deleteItem,
} from '../controllers/inventoryController.js';

const router = express.Router();

router.route('/').get(getItems).post(createItem);
router.route('/:id').get(getItemById).put(updateItem).delete(deleteItem);
router.route('/:id/stock').patch(adjustStock);

export default router;
