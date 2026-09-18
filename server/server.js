import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    app: 'AS MARKETING Footwear Warehouse API',
    timestamp: new Date().toISOString(),
    gstin: '33APDPM1586P1ZG',
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` [AS MARKETING] Footwear Warehouse Server Running on Port ${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(` Inventory API: http://localhost:${PORT}/api/inventory`);
  console.log(` Invoices API:  http://localhost:${PORT}/api/invoices`);
  console.log(`=======================================================`);
});
