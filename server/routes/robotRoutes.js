const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Robot = require('../models/Robot');
const Component = require('../models/Component');
const ErrorLog = require('../models/ErrorLog');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Prediction = require('../models/Prediction');
const { predictFailure } = require('../services/predictionService');
const { protect, authorize } = require('../middleware/auth');

// Helper to check valid ObjectId or find by robotId
const findRobotByIdOrCode = async (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return await Robot.findById(param);
  }
  return await Robot.findOne({ robotId: param.toUpperCase() });
};

// @route   GET /api/robots
// @desc    Get all robots with optional filter, search, sort & pagination
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, search, sort = '-createdAt', page = 1, limit = 50 } = req.query;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { robotId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Robot.countDocuments(query);
    const robots = await Robot.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Attach latest prediction summary and component count for each robot
    const enhancedRobots = await Promise.all(
      robots.map(async (robot) => {
        const componentCount = await Component.countDocuments({ robotId: robot._id });
        const activeErrors = await ErrorLog.countDocuments({ robotId: robot._id, resolved: false });
        const latestPrediction = await Prediction.findOne({ robotId: robot._id }).sort({ createdAt: -1 });

        return {
          ...robot.toObject(),
          componentCount,
          activeErrors,
          latestPrediction: latestPrediction
            ? {
                failurePercentage: latestPrediction.failurePercentage,
                riskLevel: latestPrediction.riskLevel,
                healthScore: latestPrediction.healthScore,
                recommendation: latestPrediction.recommendation,
                createdAt: latestPrediction.createdAt,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      count: enhancedRobots.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: enhancedRobots,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/robots/:id
// @desc    Get single robot with full details, components, errors, maintenance and latest prediction
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const robot = await findRobotByIdOrCode(req.params.id);
    if (!robot) {
      return res.status(404).json({ success: false, message: 'Robot not found' });
    }

    const components = await Component.find({ robotId: robot._id }).sort({ remainingLifePercent: 1 });
    const errorLogs = await ErrorLog.find({ robotId: robot._id }).sort({ timestamp: -1 }).limit(20);
    const maintenanceRecords = await MaintenanceRecord.find({ robotId: robot._id })
      .populate('technicianId', 'name email role')
      .populate('componentId', 'name type')
      .sort({ scheduledDate: -1 })
      .limit(20);
    const predictions = await Prediction.find({ robotId: robot._id }).sort({ createdAt: -1 }).limit(10);
    const latestPrediction = predictions.length > 0 ? predictions[0] : null;

    res.json({
      success: true,
      data: {
        ...robot.toObject(),
        components,
        errorLogs,
        maintenanceRecords,
        predictions,
        latestPrediction,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/robots
// @desc    Create a new robot
// @access  Private (ADMIN)
router.post('/', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const {
      robotId,
      name,
      model,
      manufacturer,
      location,
      installationDate,
      runtimeHours,
      temperature,
      vibration,
      status,
      healthScore,
    } = req.body;

    if (!robotId || !name || !model || !manufacturer || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required robot fields' });
    }

    const existingRobot = await Robot.findOne({ robotId: robotId.toUpperCase() });
    if (existingRobot) {
      return res.status(400).json({ success: false, message: `Robot with ID ${robotId.toUpperCase()} already exists` });
    }

    const parsedHours = Number(runtimeHours) || 0;
    const parsedTemp = Number(temperature) || 45.0;
    const parsedVib = Number(vibration) || 1.5;

    // Run prediction to dynamically determine initial healthScore and status based on physical telemetry
    const initialFeatures = {
      runtimeHours: parsedHours,
      temperature: parsedTemp,
      vibration: parsedVib,
      status: status && status !== 'AUTO' ? status.toUpperCase() : undefined,
    };

    const initialPrediction = await predictFailure(initialFeatures);

    // Determine final status
    let finalStatus = 'HEALTHY';
    if (status && status !== 'AUTO' && ['HEALTHY', 'WARNING', 'CRITICAL', 'MAINTENANCE'].includes(status.toUpperCase())) {
      finalStatus = status.toUpperCase();
    } else {
      if (initialPrediction.riskLevel === 'CRITICAL') finalStatus = 'CRITICAL';
      else if (initialPrediction.riskLevel === 'HIGH' || initialPrediction.riskLevel === 'MEDIUM') finalStatus = 'WARNING';
      else finalStatus = 'HEALTHY';
    }

    const finalHealthScore = typeof healthScore === 'number'
      ? healthScore
      : initialPrediction.healthScore;

    const robot = await Robot.create({
      robotId: robotId.toUpperCase(),
      name,
      model,
      manufacturer,
      location,
      installationDate: installationDate || Date.now(),
      runtimeHours: parsedHours,
      temperature: parsedTemp,
      vibration: parsedVib,
      status: finalStatus,
      healthScore: finalHealthScore,
    });

    // Create baseline prediction record
    await Prediction.create({
      robotId: robot._id,
      failureProbability: initialPrediction.failureProbability,
      failurePercentage: initialPrediction.failurePercentage,
      riskLevel: initialPrediction.riskLevel,
      healthScore: finalHealthScore,
      features: initialFeatures,
      recommendation: initialPrediction.recommendation,
      reasons: initialPrediction.reasons,
    });

    res.status(201).json({
      success: true,
      message: 'Robot created successfully with calibrated health index',
      data: robot,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/robots/:id
// @desc    Update a robot
// @access  Private (ADMIN, MANAGER, TECHNICIAN)
router.put('/:id', protect, async (req, res, next) => {
  try {
    let robot = await findRobotByIdOrCode(req.params.id);
    if (!robot) {
      return res.status(404).json({ success: false, message: 'Robot not found' });
    }

    const updatedData = { ...req.body };

    // If telemetry (temperature, vibration, runtimeHours, status) changed and healthScore was not explicitly set,
    // recalculate healthScore dynamically!
    if (
      (updatedData.temperature !== undefined || updatedData.vibration !== undefined || updatedData.runtimeHours !== undefined || updatedData.status !== undefined) &&
      updatedData.healthScore === undefined
    ) {
      const pred = await predictFailure({
        temperature: updatedData.temperature ?? robot.temperature,
        vibration: updatedData.vibration ?? robot.vibration,
        runtimeHours: updatedData.runtimeHours ?? robot.runtimeHours,
        status: updatedData.status ?? robot.status,
      });

      updatedData.healthScore = pred.healthScore;
      if (!updatedData.status || updatedData.status === 'AUTO') {
        if (pred.riskLevel === 'CRITICAL') updatedData.status = 'CRITICAL';
        else if (pred.riskLevel === 'HIGH' || pred.riskLevel === 'MEDIUM') updatedData.status = 'WARNING';
        else updatedData.status = 'HEALTHY';
      }
    }

    robot = await Robot.findByIdAndUpdate(robot._id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Robot updated successfully',
      data: robot,
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/robots/:id
// @desc    Delete a robot and cascade delete subdocuments
// @access  Private (ADMIN)
router.delete('/:id', protect, authorize('ADMIN'), async (req, res, next) => {
  try {
    const robot = await findRobotByIdOrCode(req.params.id);
    if (!robot) {
      return res.status(404).json({ success: false, message: 'Robot not found' });
    }

    await Component.deleteMany({ robotId: robot._id });
    await ErrorLog.deleteMany({ robotId: robot._id });
    await MaintenanceRecord.deleteMany({ robotId: robot._id });
    await Prediction.deleteMany({ robotId: robot._id });
    await Robot.findByIdAndDelete(robot._id);

    res.json({
      success: true,
      message: `Robot ${robot.robotId} and all associated records deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
