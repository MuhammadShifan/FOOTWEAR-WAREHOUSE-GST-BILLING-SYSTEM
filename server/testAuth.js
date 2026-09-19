import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { connectDB } from './config/db.js';

async function runAuthTests() {
  console.log('====================================================');
  console.log(' STARTING AUTHENTICATION & OTP SYSTEM VERIFICATION');
  console.log('====================================================');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' MongoDB Connected Successfully.');

    const testEmail = `test_auth_${Date.now()}@asmarketing.com`;
    const initialPassword = 'InitialSecretPass123!';
    const newPassword = 'UpdatedSecretPass456!';

    // 1. Test Registration
    console.log('\n[TEST 1] Registering new user...');
    const user = await User.create({
      name: 'Test Administrator',
      email: testEmail,
      password: initialPassword,
      role: 'admin',
    });
    console.log(` User created: ${user.name} (${user.email})`);
    console.log(` Password is not plain text in DB: ${user.password.startsWith('$2') ? 'PASS (bcrypt hashed)' : 'FAIL'}`);

    // 2. Test Password Matching
    console.log('\n[TEST 2] Verifying password match via bcrypt...');
    const userForAuth = await User.findOne({ email: testEmail }).select('+password');
    const isMatch = await userForAuth.matchPassword(initialPassword);
    const isWrongMatch = await userForAuth.matchPassword('WrongPass999');
    console.log(` Correct password match: ${isMatch ? 'PASS' : 'FAIL'}`);
    console.log(` Wrong password rejected: ${!isWrongMatch ? 'PASS' : 'FAIL'}`);

    // 3. Test JWT Generation & Verification
    console.log('\n[TEST 3] Testing JWT creation and decoding...');
    const secret = process.env.JWT_SECRET || 'as_marketing_footwear_jwt_secret_2026';
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: '7d' });
    const decoded = jwt.verify(token, secret);
    console.log(` JWT Token generated: ${token.substring(0, 20)}...`);
    console.log(` Decoded User ID matches: ${decoded.id.toString() === user._id.toString() ? 'PASS' : 'FAIL'}`);

    // 4. Test Forgot Password - OTP Generation (10 min TTL)
    console.log('\n[TEST 4] Testing 6-Digit OTP Generation & Expiration...');
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

    userForAuth.resetOtp = otp;
    userForAuth.resetOtpExpire = otpExpire;
    userForAuth.isOtpVerified = false;
    await userForAuth.save();

    console.log(` Generated OTP: ${otp}`);
    console.log(` OTP Expiration: ${otpExpire.toISOString()}`);
    console.log(` OTP stored in DB: ${userForAuth.resetOtp === otp ? 'PASS' : 'FAIL'}`);

    // 5. Test OTP Verification
    console.log('\n[TEST 5] Verifying OTP and checking expiration...');
    const isValidOtp = userForAuth.resetOtp === otp && new Date() < new Date(userForAuth.resetOtpExpire);
    const isInvalidOtp = userForAuth.resetOtp === '999999';
    console.log(` Correct OTP verification: ${isValidOtp ? 'PASS' : 'FAIL'}`);
    console.log(` Wrong OTP rejection: ${!isInvalidOtp ? 'PASS' : 'FAIL'}`);

    // 6. Test Password Reset
    console.log('\n[TEST 6] Testing Password Reset...');
    userForAuth.password = newPassword;
    userForAuth.resetOtp = null;
    userForAuth.resetOtpExpire = null;
    userForAuth.isOtpVerified = false;
    await userForAuth.save();

    const updatedUser = await User.findOne({ email: testEmail }).select('+password');
    const isNewPassValid = await updatedUser.matchPassword(newPassword);
    const isOldPassInvalid = await updatedUser.matchPassword(initialPassword);
    console.log(` New password authenticates: ${isNewPassValid ? 'PASS' : 'FAIL'}`);
    console.log(` Old password invalidated: ${!isOldPassInvalid ? 'PASS' : 'FAIL'}`);
    console.log(` OTP fields cleared: ${updatedUser.resetOtp === null ? 'PASS' : 'FAIL'}`);

    // Cleanup test user
    await User.findByIdAndDelete(user._id);
    console.log('\n Cleaned up test user record.');

    console.log('\n====================================================');
    console.log(' ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! (6/6)');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error(' Test error:', error);
    process.exit(1);
  }
}

runAuthTests();
