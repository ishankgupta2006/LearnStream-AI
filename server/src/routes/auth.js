const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, generateTokens } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        code: 'DUPLICATE_ERROR'
      });
    }
    
    // Create user
    const user = await User.create({ 
      email, 
      password, 
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
    });
    
    // Generate tokens
    const { token, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();
    
    res.status(201).json({
      success: true,
      user: user.toJSON(),
      token,
      refreshToken
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'AUTH_FAILED'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        code: 'AUTH_FAILED'
      });
    }
    
    // Check if active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is disabled',
        code: 'ACCOUNT_DISABLED'
      });
    }
    
    // Generate tokens
    const { token, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    user.refreshTokens.push(refreshToken);
    user.stats.lastActiveDate = new Date();
    await user.save();
    
    res.json({
      success: true,
      user: user.toJSON(),
      token,
      refreshToken
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );
    
    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.userId,
      refreshTokens: refreshToken
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'TOKEN_INVALID'
      });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Replace old refresh token
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    
    res.json(tokens);
    
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, (req, res) => {
  res.json({ 
    success: true,
    user: req.user.toJSON() 
  });
});

/**
 * PATCH /api/auth/profile
 * Update user profile
 */
router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    
    if (name !== undefined) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Name must be between 2 and 50 characters',
          code: 'VALIDATION_ERROR'
        });
      }
      updates.name = name;
    }
    
    if (avatar !== undefined) {
      updates.avatar = avatar;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      user: user.toJSON()
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate refresh token
 */
router.post('/logout', authenticateToken, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      req.user.refreshTokens = req.user.refreshTokens.filter(t => t !== refreshToken);
      await req.user.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
        code: 'VALIDATION_ERROR'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Verify current password
    const isMatch = await req.user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'AUTH_FAILED'
      });
    }
    
    // Update password
    req.user.password = newPassword;
    req.user.refreshTokens = []; // Invalidate all sessions
    await req.user.save();
    
    // Generate new tokens
    const tokens = generateTokens(req.user._id);
    req.user.refreshTokens.push(tokens.refreshToken);
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      ...tokens
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
