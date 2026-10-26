const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');
const Robot = require('../models/Robot');
const { protect } = require('../middleware/auth');

// @route   GET /api/errors
// @desc    Get all error logs with filters & pagination
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { robotId, severity, resolved, page = 1, limit = 50 } = req.query;
    const query = {};

    if (robotId) query.robotId = robotId;
    if (severity && severity !== 'ALL') query.severity = severity;
    if (resolved !== undefined && resolved !== 'ALL') {
      query.resolved = resolved === 'true';
    }

    const total = await ErrorLog.countDocuments(query);
    const errors = await ErrorLog.find(query)
      .populate('robotId', 'robotId name model location status')
      .populate('componentId', 'name type')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: errors.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: errors,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/errors
// @desc    Log a new robot error / alarm
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { robotId, componentId, errorCode, errorType, description, severity } = req.body;

    if (!robotId || !errorCode || !errorType || !description) {
      return res.status(400).json({ success: false, message: 'Please provide all required error log fields' });
    }

    const errorLog = await ErrorLog.create({
      robotId,
      componentId,
      errorCode,
      errorType,
      description,
      severity: severity || 'MEDIUM',
      timestamp: Date.now(),
      resolved: false,
    });

    // If critical or high error, update robot status to WARNING / CRITICAL
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      await Robot.findByIdAndUpdate(robotId, {
        status: severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Error logged successfully',
      data: errorLog,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/errors/:id
// @desc    Resolve or update error log
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { resolved, resolution } = req.body;

    const errorLog = await ErrorLog.findById(req.params.id);
    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }

    if (resolved !== undefined) {
      errorLog.resolved = resolved;
      if (resolved) {
        errorLog.resolvedAt = Date.now();
      }
    }
    if (resolution !== undefined) {
      errorLog.resolution = resolution;
    }

    await errorLog.save();

    res.json({
      success: true,
      message: 'Error log updated successfully',
      data: errorLog,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/errors/:id
// @desc    Delete error log
// @access  Private (ADMIN)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const errorLog = await ErrorLog.findByIdAndDelete(req.params.id);
    if (!errorLog) {
      return res.status(404).json({ success: false, message: 'Error log not found' });
    }
    res.json({ success: true, message: 'Error log removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
