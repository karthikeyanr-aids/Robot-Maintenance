const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Prediction = require('../models/Prediction');
const Robot = require('../models/Robot');
const Component = require('../models/Component');
const ErrorLog = require('../models/ErrorLog');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Notification = require('../models/Notification');
const { predictFailure } = require('../services/predictionService');
const { syncErrorLogsFromTelemetry } = require('../services/errorSyncService');
const { protect } = require('../middleware/auth');

// Helper to resolve robot
const findRobot = async (param) => {
  if (mongoose.Types.ObjectId.isValid(param)) {
    return await Robot.findById(param);
  }
  return await Robot.findOne({ robotId: param.toUpperCase() });
};

// @route   GET /api/predictions
// @desc    Get all predictions with filters & pagination
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { robotId, riskLevel, page = 1, limit = 50 } = req.query;
    const query = {};

    if (robotId) query.robotId = robotId;
    if (riskLevel && riskLevel !== 'ALL') query.riskLevel = riskLevel;

    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .populate('robotId', 'robotId name model location status healthScore')
      .populate('componentId', 'name type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: predictions.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/predictions/:robotId
// @desc    Get prediction history for a specific robot
// @access  Private
router.get('/:robotId', protect, async (req, res, next) => {
  try {
    const robot = await findRobot(req.params.robotId);
    if (!robot) {
      return res.status(404).json({ success: false, message: 'Robot not found' });
    }

    const predictions = await Prediction.find({ robotId: robot._id })
      .populate('componentId', 'name type')
      .sort({ createdAt: -1 })
      .limit(25);

    res.json({
      success: true,
      robot: {
        id: robot._id,
        robotId: robot.robotId,
        name: robot.name,
        healthScore: robot.healthScore,
        status: robot.status,
      },
      count: predictions.length,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/predictions/analyze/:robotId
// @desc    CORE PREDICTION ENDPOINT: Extract 7 features, run ML model, save prediction & notify
// @access  Private
router.post('/analyze/:robotId', protect, async (req, res, next) => {
  try {
    // 1. Find the robot
    const robot = await findRobot(req.params.robotId);
    if (!robot) {
      return res.status(404).json({ success: false, message: 'Robot not found' });
    }

    // 2. Find relevant components
    const components = await Component.find({ robotId: robot._id });

    // 3. Get recent error logs
    const recentErrors = await ErrorLog.find({ robotId: robot._id, resolved: false });
    const errorCount = recentErrors.length;

    // 4. Get maintenance history
    const maintenanceHistory = await MaintenanceRecord.find({ robotId: robot._id, status: 'COMPLETED' });
    const previousFailures = maintenanceHistory.length;

    // Calculate days since last maintenance
    const lastMaintDate = robot.lastMaintenance ? new Date(robot.lastMaintenance) : new Date(robot.installationDate);
    const diffMs = Math.max(0, Date.now() - lastMaintDate.getTime());
    const daysSinceMaintenance = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Calculate lowest component life percent
    let componentLifePercent = 100;
    let worstComponent = null;
    if (components.length > 0) {
      worstComponent = components.reduce((prev, curr) =>
        prev.remainingLifePercent < curr.remainingLifePercent ? prev : curr
      );
      componentLifePercent = worstComponent.remainingLifePercent;
    }

    // 5. Extract the exact 7 ML features
    const features = {
      runtimeHours: robot.runtimeHours || 0,
      errorCount,
      temperature: robot.temperature || 45.0,
      vibration: robot.vibration || 1.5,
      componentLifePercent,
      daysSinceMaintenance,
      previousFailures,
    };

    // Allow manual feature override from request body for interactive simulation/testing if provided
    if (req.body.overrideFeatures) {
      Object.assign(features, req.body.overrideFeatures);
    }

    // 6. Run ML prediction through predictionService
    const predictionResult = await predictFailure(features);

    // 7. Save prediction to MongoDB
    const prediction = await Prediction.create({
      robotId: robot._id,
      componentId: worstComponent ? worstComponent._id : null,
      failureProbability: predictionResult.failureProbability,
      failurePercentage: predictionResult.failurePercentage,
      riskLevel: predictionResult.riskLevel,
      healthScore: predictionResult.healthScore,
      features: predictionResult.features,
      recommendation: predictionResult.recommendation,
      reasons: predictionResult.reasons,
    });

    // 8. Update Robot healthScore and status in MongoDB
    robot.healthScore = predictionResult.healthScore;
    if (predictionResult.riskLevel === 'CRITICAL') {
      robot.status = 'CRITICAL';
    } else if (predictionResult.riskLevel === 'HIGH' || predictionResult.riskLevel === 'MEDIUM') {
      if (robot.status !== 'MAINTENANCE') {
        robot.status = 'WARNING';
      }
    } else {
      if (robot.status !== 'MAINTENANCE') {
        robot.status = 'HEALTHY';
      }
    }
    await robot.save();

    // 9. Sync prediction root causes to active ErrorLog entries so they appear on Error Logs page
    const createdErrors = await syncErrorLogsFromTelemetry(
      robot,
      features,
      predictionResult,
      worstComponent ? worstComponent._id : null
    );

    // 10. Create Notification if risk is HIGH or CRITICAL
    if (predictionResult.riskLevel === 'HIGH' || predictionResult.riskLevel === 'CRITICAL') {
      await Notification.create({
        robotId: robot._id,
        userId: req.user ? req.user._id : null,
        message: `High risk detected for ${robot.robotId} (${robot.name}): ${predictionResult.failurePercentage}% failure probability. ${predictionResult.recommendation}`,
        severity: predictionResult.riskLevel,
        read: false,
        link: `/robots/${robot.robotId}`,
      });
    }

    // 11. Return complete structured response matching prompt specification
    res.status(200).json({
      success: true,
      predictionId: prediction._id,
      robotId: robot.robotId,
      robotName: robot.name,
      failureProbability: predictionResult.failureProbability,
      failurePercentage: predictionResult.failurePercentage,
      healthScore: predictionResult.healthScore,
      riskLevel: predictionResult.riskLevel,
      recommendation: predictionResult.recommendation,
      reasons: predictionResult.reasons,
      features: predictionResult.features,
      affectedComponent: worstComponent ? worstComponent.name : 'System Overall',
      newErrorsLogged: createdErrors.length,
      createdAt: prediction.createdAt,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
