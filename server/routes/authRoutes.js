import express from 'express';
import {
  login,
  getMe,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public authentication routes (Registration disabled)
router.post('/login', login);

// Protected profile routes
router.get('/me', protect, getMe);

export default router;
