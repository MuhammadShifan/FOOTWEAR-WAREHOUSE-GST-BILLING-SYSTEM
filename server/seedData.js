import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Item from './models/Item.js';
import Invoice from './models/Invoice.js';

const sampleItems = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
    modelName: 'AEROWALK-NV58',
    brand: 'AEROWALK',
    category: 'GENTS CHAPPAL',
    color: 'BLACK',
    size: '42',
    sizeRange: '40-45',
    hsn: '6402',
    mrp: 399,
    rate: 240,
    stockQty: 150,
    minStockAlert: 20,
  },
  {
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
  },
  {
    modelName: 'VKC-PRIDE-7014',
    brand: 'VKC',
    category: 'GENTS CHAPPAL',
    color: 'BROWN',
    size: '8',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: 449,
    rate: 280,
    stockQty: 210,
    minStockAlert: 25,
  },
  {
    modelName: 'VKC-PRIDE-7014',
    brand: 'VKC',
    category: 'GENTS CHAPPAL',
    color: 'BLACK',
    size: '8',
    sizeRange: '6-10',
    hsn: '6402',
    mrp: 449,
    rate: 280,
    stockQty: 95,
    minStockAlert: 25,
  },
  {
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
    minStockAlert: 15,
  },
  {
    modelName: 'PARAGON-VERTEX-9211',
    brand: 'PARAGON',
    category: 'PU SANDAL',
    color: 'TAN',
    size: '9',
    sizeRange: '7-10',
    hsn: '6404',
    mrp: 499,
    rate: 310,
    stockQty: 30,
    minStockAlert: 15,
  },
  {
    modelName: 'AEROWALK-LADIES-FLIP-L62',
    brand: 'AEROWALK',
    category: 'LADIES CHAPPAL',
    color: 'PINK',
    size: '6',
    sizeRange: '4-8',
    hsn: '6402',
    mrp: 299,
    rate: 180,
    stockQty: 110,
    minStockAlert: 15,
  },
  {
    modelName: 'AURA-COMFORT-G99',
    brand: 'AURA',
    category: 'EVA CHAPPAL',
    color: 'NAVY',
    size: '7',
    sizeRange: '6-9',
    hsn: '6402',
    mrp: 199,
    rate: 115,
    stockQty: 300,
    minStockAlert: 30,
  },
  {
    modelName: 'WALKAROO-KIDS-K201',
    brand: 'WALKAROO',
    category: 'KIDS CHAPPAL',
    color: 'NAVY',
    size: '12',
    sizeRange: '11-1',
    hsn: '6402',
    mrp: 249,
    rate: 145,
    stockQty: 4,
    minStockAlert: 10,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await Item.deleteMany({});
    console.log('Cleared existing items.');

    const created = await Item.insertMany(sampleItems);
    console.log(`Successfully seeded ${created.length} footwear inventory models!`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
