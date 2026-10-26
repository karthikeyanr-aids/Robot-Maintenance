const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'robocare_jwt_secret_key_2026_fsd_super_secure', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user (supports username and/or email)
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, username, identifier, password, role, department } = req.body;

    const rawId = (identifier || email || username || '').trim();
    if (!name || !rawId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, username/email, and password' });
    }

    // Determine email and username from input
    let finalEmail = '';
    let finalUsername = '';

    if (rawId.includes('@')) {
      finalEmail = rawId.toLowerCase();
      finalUsername = (username || rawId.split('@')[0]).trim().toLowerCase();
    } else {
      finalUsername = rawId.toLowerCase();
      finalEmail = email ? email.trim().toLowerCase() : `${finalUsername}@robocare.local`;
    }

    // Check if user already exists by email or username
    const userExists = await User.findOne({
      $or: [
        { email: finalEmail },
        { username: finalUsername }
      ]
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this username or email' });
    }

    const user = await User.create({
      name: name.trim(),
      username: finalUsername,
      email: finalEmail,
      password,
      role: role || 'TECHNICIAN',
      department: department || 'Maintenance & Robotics',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user via username OR email & get token
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, username, identifier, password } = req.body;
    const rawId = (identifier || email || username || '').trim().toLowerCase();

    if (!rawId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username or email and password' });
    }

    // Match either email or username
    const user = await User.findOne({
      $or: [
        { email: rawId },
        { username: rawId }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile & password
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, department, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (department !== undefined) {
      user.department = department.trim();
    }
    if (email && email.trim() && email.trim().toLowerCase() !== user.email) {
      const emailExists = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email address already in use by another account' });
      }
      user.email = email.trim().toLowerCase();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
      }
      user.password = newPassword;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
