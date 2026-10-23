import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[SECURITY ERROR] JWT_SECRET is not configured on the server.');
      return res.status(500).json({
        success: false,
        message: 'Authentication configuration error on server.',
      });
    }

    const decoded = jwt.verify(token, secret);

    // If admin token from .env
    if (decoded.id === 'admin') {
      req.user = {
        _id: 'admin',
        name: 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@asmarketing.com',
        role: 'admin',
      };
      return next();
    }

    // Fallback if legacy user in MongoDB exists (if DB is connected)
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      message: 'The user belonging to this token no longer exists.',
    });
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};
