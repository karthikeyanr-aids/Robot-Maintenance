const express = require('express');
const router = express.Router();
const Component = require('../models/Component');
const Robot = require('../models/Robot');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/components
// @desc    Get all components with optional filters
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { robotId, type, status } = req.query;
    const query = {};

    if (robotId) query.robotId = robotId;
    if (type) query.type = type;
    if (status) query.status = status;

    const components = await Component.find(query)
      .populate('robotId', 'robotId name model location status')
      .sort({ remainingLifePercent: 1 });

    res.json({
      success: true,
      count: components.length,
      data: components,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/components/:id
// @desc    Get single component
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const component = await Component.findById(req.params.id).populate('robotId', 'robotId name model location');
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }
    res.json({ success: true, data: component });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/components
// @desc    Create a new component
// @access  Private (ADMIN)
router.post('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { robotId, name, type, expectedLifeHours, usedLifeHours, lastMaintenance } = req.body;

    if (!robotId || !name) {
      return res.status(400).json({ success: false, message: 'Please provide robotId and component name' });
    }

    const robot = await Robot.findById(robotId);
    if (!robot) {
      return res.status(404).json({ success: false, message: 'Referenced robot not found' });
    }

    const component = new Component({
      robotId,
      name,
      type: type || 'Motor',
      expectedLifeHours: expectedLifeHours || 10000,
      usedLifeHours: usedLifeHours || 0,
      lastMaintenance: lastMaintenance || Date.now(),
    });

    await component.save();

    res.status(201).json({
      success: true,
      message: 'Component added successfully',
      data: component,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/components/:id
// @desc    Update a component
// @access  Private (ADMIN, TECHNICIAN)
router.put('/:id', protect, async (req, res, next) => {
  try {
    let component = await Component.findById(req.params.id);
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }

    Object.assign(component, req.body);
    await component.save();

    res.json({
      success: true,
      message: 'Component updated successfully',
      data: component,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/components/:id
// @desc    Delete a component
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const component = await Component.findByIdAndDelete(req.params.id);
    if (!component) {
      return res.status(404).json({ success: false, message: 'Component not found' });
    }
    res.json({ success: true, message: 'Component deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
