const express = require('express');
const router = express.Router();
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Robot = require('../models/Robot');
const Component = require('../models/Component');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/maintenance
// @desc    Get all maintenance records with filters
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, robotId, technicianId, priority } = req.query;
    const query = {};

    if (status && status !== 'ALL') query.status = status;
    if (robotId) query.robotId = robotId;
    if (technicianId) query.technicianId = technicianId;
    if (priority && priority !== 'ALL') query.priority = priority;

    const records = await MaintenanceRecord.find(query)
      .populate('robotId', 'robotId name model location status healthScore')
      .populate('componentId', 'name type remainingLifePercent')
      .populate('technicianId', 'name email role department')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/maintenance/:id
// @desc    Get single maintenance record
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id)
      .populate('robotId')
      .populate('componentId')
      .populate('technicianId', 'name email role department');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/maintenance
// @desc    Schedule new maintenance task
// @access  Private (ADMIN, MANAGER, TECHNICIAN)
router.post('/', protect, async (req, res, next) => {
  try {
    const { robotId, componentId, technicianId, problem, scheduledDate, priority, notes } = req.body;

    if (!robotId || !problem || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'Please provide robotId, problem, and scheduledDate' });
    }

    const record = await MaintenanceRecord.create({
      robotId,
      componentId: componentId || null,
      technicianId: technicianId || (req.user.role === 'TECHNICIAN' || req.user.role === 'MAINTENANCE_ENGINEER' ? req.user._id : null),
      problem,
      scheduledDate,
      priority: priority || 'MEDIUM',
      status: 'SCHEDULED',
      notes: notes || '',
    });

    // Update robot nextMaintenance date
    await Robot.findByIdAndUpdate(robotId, {
      nextMaintenance: scheduledDate,
      status: 'MAINTENANCE',
    });

    const populatedRecord = await MaintenanceRecord.findById(record._id)
      .populate('robotId', 'robotId name model location')
      .populate('componentId', 'name type')
      .populate('technicianId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Maintenance task scheduled successfully',
      data: populatedRecord,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/maintenance/:id
// @desc    Update maintenance record status or details
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { status, actionTaken, completedDate, cost, downtime, notes, technicianId } = req.body;

    let record = await MaintenanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    if (status) record.status = status;
    if (actionTaken !== undefined) record.actionTaken = actionTaken;
    if (cost !== undefined) record.cost = Number(cost);
    if (downtime !== undefined) record.downtime = Number(downtime);
    if (notes !== undefined) record.notes = notes;
    if (technicianId !== undefined) record.technicianId = technicianId;

    if (status === 'COMPLETED') {
      record.completedDate = completedDate || Date.now();

      // Reset robot status to HEALTHY and update lastMaintenance
      const robot = await Robot.findById(record.robotId);
      if (robot) {
        robot.lastMaintenance = record.completedDate;
        robot.status = 'HEALTHY';
        // reset temperature and vibration toward nominal
        robot.temperature = Math.max(38, robot.temperature - 15);
        robot.vibration = Math.max(1.2, robot.vibration - 3.5);
        robot.healthScore = Math.min(100, robot.healthScore + 30);
        await robot.save();
      }

      // If associated component, reset component usedLife or mark OK
      if (record.componentId) {
        const comp = await Component.findById(record.componentId);
        if (comp) {
          comp.lastMaintenance = record.completedDate;
          comp.usedLifeHours = Math.max(0, comp.usedLifeHours - 3000);
          await comp.save();
        }
      }
    } else if (status === 'IN_PROGRESS') {
      await Robot.findByIdAndUpdate(record.robotId, { status: 'MAINTENANCE' });
    }

    await record.save();

    const updatedRecord = await MaintenanceRecord.findById(record._id)
      .populate('robotId', 'robotId name model location status')
      .populate('componentId', 'name type')
      .populate('technicianId', 'name email role');

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/maintenance/:id
// @desc    Delete maintenance record
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }
    res.json({ success: true, message: 'Maintenance record deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
