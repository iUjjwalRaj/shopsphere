import crypto from 'crypto';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  address: user.address,
  token: generateToken(user._id),
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('Email already registered');
  }

  const user = await User.create({ name, email, password });
  res.status(201).json(userResponse(user));
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json(userResponse(user));
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// PUT /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const { name, address } = req.body;
  if (name) req.user.name = name;
  if (address) req.user.address = address;
  const saved = await req.user.save();
  res.json(saved);
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Generic response to prevent email / account enumeration
  const genericResponse = {
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  // Generate a cryptographically secure random token (32 bytes = 64 hex chars)
  const rawResetToken = crypto.randomBytes(32).toString('hex');

  // Hash token with SHA-256 before saving to database
  const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

  // Set expiration to 15 minutes
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawResetToken}`;

  const messageText = `You are receiving this email because you (or someone else) requested a password reset for your ShopSphere account.\n\nPlease click the link below or paste it into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 15 minutes.\n\nIf you did not request this, please ignore this email and your password will remain unchanged.`;

  const messageHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4ee; border-radius: 8px;">
      <h2 style="color: #5b3cc4; margin-top: 0;">Password Reset Request</h2>
      <p>You are receiving this email because a password reset was requested for your ShopSphere account.</p>
      <p>Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #5b3cc4; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p style="color: #6b6b80; font-size: 0.9em;">If the button above does not work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #5b3cc4; font-size: 0.85em;">${resetUrl}</p>
      <hr style="border: none; border-top: 1px solid #e4e4ee; margin: 20px 0;" />
      <p style="color: #6b6b80; font-size: 0.85em;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'ShopSphere Password Reset Request',
      text: messageText,
      html: messageHtml,
    });
  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(500);
    throw new Error('Failed to send password reset email. Please try again later.');
  }

  res.status(200).json(genericResponse);
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    res.status(400);
    throw new Error('Reset token is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Hash the incoming token using SHA-256 to compare with the database stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  // Update password and invalidate the reset token immediately to prevent reuse
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.status(200).json({
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
});
