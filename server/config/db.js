import mongoose from 'mongoose';
import Item from '../models/Item.js';
import Invoice from '../models/Invoice.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);

    // Sync indexes to remove old unique constraints (e.g. modelName_1) and apply new compound index (modelName_1_color_1_size_1)
    try {
      await Item.syncIndexes();
      await Invoice.syncIndexes();
      console.log('[DATABASE] Item & Invoice indexes synchronized successfully.');
    } catch (idxErr) {
      console.warn('[DATABASE WARNING] Index sync warning:', idxErr.message);
    }
  } catch (error) {
    console.error(`[DATABASE ERROR] MongoDB Connection Failed: ${error.message}`);
    console.log('[DATABASE INFO] Running in in-memory / fallback mode if MongoDB service is not running.');
  }
};
