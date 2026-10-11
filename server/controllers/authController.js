import jwt from 'jsonwebtoken';

/**
 * Generate JWT token helper
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'as_marketing_footwear_jwt_secret_2026';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// @desc    Authenticate admin user & login via .env credentials
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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@asmarketing.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Direct comparison with environment variables
    const isEmailMatch = email.toLowerCase().trim() === adminEmail.toLowerCase().trim();
    const isPasswordMatch = password === adminPassword;

    if (!isEmailMatch || !isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = generateToken('admin');

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: 'admin',
        name: 'Administrator',
        email: adminEmail,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error during login.',
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
    console.error('Get Profile Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving profile.',
    });
  }
};
