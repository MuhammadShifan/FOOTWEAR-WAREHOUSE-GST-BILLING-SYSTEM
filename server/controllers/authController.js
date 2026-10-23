import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Generate JWT token helper
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured on the server.');
  }
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// @desc    Authenticate user & login (supports admin .env credentials and registered database users)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let authenticatedUser = null;

    // 1. Verify against server environment administrator credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (
      adminEmail &&
      adminPassword &&
      normalizedEmail === adminEmail.toLowerCase().trim()
    ) {
      const isPasswordMatch = adminPassword.startsWith('$2')
        ? await bcrypt.compare(password, adminPassword)
        : password === adminPassword;

      if (isPasswordMatch) {
        authenticatedUser = {
          _id: 'admin',
          name: 'Administrator',
          email: adminEmail,
          role: 'admin',
        };
      }
    }

    // 2. If not matched with env admin, verify against MongoDB database users (if DB connected)
    if (!authenticatedUser && mongoose.connection.readyState === 1) {
      try {
        const dbUser = await User.findOne({ email: normalizedEmail }).select('+password');
        if (dbUser) {
          const isDbPasswordMatch = await dbUser.matchPassword(password);
          if (isDbPasswordMatch) {
            authenticatedUser = {
              _id: dbUser._id.toString(),
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role || 'admin',
            };
          }
        }
      } catch (dbErr) {
        // Fallback gracefully if database is in offline / in-memory mode
        console.warn('[AUTH WARNING] MongoDB user verification skipped:', dbErr.message);
      }
    }

    // If neither matched, reject login
    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = generateToken(authenticatedUser._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: authenticatedUser,
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
    });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    console.error('Get Profile Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving profile.',
    });
  }
};

