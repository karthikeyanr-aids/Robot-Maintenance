const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users/technicians
// @desc    Get all users with TECHNICIAN or MANAGER role for task assignments
// @access  Private
router.get('/technicians', protect, async (req, res, next) => {
  try {
    const technicians = await User.find({ role: { $in: ['TECHNICIAN', 'MAINTENANCE_ENGINEER', 'ADMIN'] } }).select('-password');
    res.json({ success: true, count: technicians.length, data: technicians });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (ADMIN)
router.get('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users
// @desc    Create a user (Admin only)
// @access  Private (ADMIN)
router.post('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, username, identifier, password, role, department } = req.body;
    const rawId = (identifier || email || username || '').trim();
    if (!name || !rawId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, username/email, and password' });
    }

    let finalEmail = '';
    let finalUsername = '';

    if (rawId.includes('@')) {
      finalEmail = rawId.toLowerCase();
      finalUsername = (username || rawId.split('@')[0]).trim().toLowerCase();
    } else {
      finalUsername = rawId.toLowerCase();
      finalEmail = email ? email.trim().toLowerCase() : `${finalUsername}@robocare.local`;
    }

    const existing = await User.findOne({
      $or: [
        { email: finalEmail },
        { username: finalUsername }
      ]
    });

    if (existing) {
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

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
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

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private (ADMIN)
router.put('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, role, department } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (department) user.department = department;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
