import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * Generate JWT token helper
 */
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'as_marketing_footwear_jwt_secret_2026';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

/**
 * Generate random 6-digit OTP
 */
const generate6DigitOtp = () => {
  // Using crypto for cryptographically secure random number
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  const otp = (num % 900000 + 100000).toString();
  return otp;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'admin',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Register Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error during registration.',
    });
  }
};

// @desc    Authenticate user & login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    // Find user by email and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password match using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
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

// @desc    Forgot Password - Generate & Send 6-digit OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    // Generate 6-digit OTP
    const otp = generate6DigitOtp();

    // Set OTP expiration to 10 minutes from now
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    // Save to user document
    user.resetOtp = otp;
    user.resetOtpExpire = otpExpire;
    user.isOtpVerified = false;
    await user.save();

    // Send email with OTP via Nodemailer
    try {
      const emailResult = await sendEmail({
        email: user.email,
        subject: `AS MARKETING - ${otp} is your Password Reset OTP`,
        otp,
      });

      return res.status(200).json({
        success: true,
        message: '6-digit OTP sent to your registered email. Valid for 10 minutes.',
        expiresAt: otpExpire,
        // Include dev OTP preview if in development or console mode
        devOtp: emailResult?.mode === 'dev_console' ? otp : undefined,
      });
    } catch (emailErr) {
      console.error('Email Dispatch Error:', emailErr);
      // Even if SMTP fails, keep the OTP for dev testing or retry
      return res.status(200).json({
        success: true,
        message: 'OTP generated. Check your email (or server log if in dev mode).',
        expiresAt: otpExpire,
        devOtp: otp,
      });
    }
  } catch (err) {
    console.error('Forgot Password Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error generating OTP.',
    });
  }
};

// @desc    Verify OTP for Password Reset
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both registered email and the 6-digit OTP.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address.',
      });
    }

    // Check if OTP matches
    if (!user.resetOtp || user.resetOtp.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please verify the 6 digits and try again.',
      });
    }

    // Check if OTP has expired
    if (!user.resetOtpExpire || new Date() > new Date(user.resetOtpExpire)) {
      return res.status(400).json({
        success: false,
        message: 'OTP code has expired. Please request a new OTP.',
      });
    }

    // Mark OTP as verified
    user.isOtpVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now enter your new password.',
    });
  } catch (err) {
    console.error('Verify OTP Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error verifying OTP.',
    });
  }
};

// @desc    Reset Password with verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, OTP, and the new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address.',
      });
    }

    // Validate OTP
    if (!user.resetOtp || user.resetOtp.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Password reset aborted.',
      });
    }

    // Check expiration
    if (!user.resetOtpExpire || new Date() > new Date(user.resetOtpExpire)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a fresh OTP.',
      });
    }

    // Update password (pre-save hook in User model will hash it with bcrypt)
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpire = null;
    user.isOtpVerified = false;
    await user.save();

    // Automatically issue a token so user is logged in
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You are now logged in.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error resetting password.',
    });
  }
};

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Server error retrieving profile.',
    });
  }
};
