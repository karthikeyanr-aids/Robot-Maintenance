const express = require('express');
const router = express.Router();
const Robot = require('../models/Robot');
const Component = require('../models/Component');
const ErrorLog = require('../models/ErrorLog');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Prediction = require('../models/Prediction');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/analytics/dashboard
// @desc    Get consolidated dashboard metrics, charts data & live feeds
// @access  Private
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    const robots = await Robot.find().sort({ robotId: 1 });
    const totalRobots = robots.length;

    const healthyCount = robots.filter((r) => r.status === 'HEALTHY').length;
    const warningCount = robots.filter((r) => r.status === 'WARNING').length;
    const criticalCount = robots.filter((r) => r.status === 'CRITICAL').length;
    const maintenanceCount = robots.filter((r) => r.status === 'MAINTENANCE').length;

    const avgHealthScore =
      totalRobots > 0
        ? Math.round(robots.reduce((sum, r) => sum + (r.healthScore || 0), 0) / totalRobots)
        : 100;

    // Risk distribution calculation from latest predictions or robot statuses
    const predictions = await Prediction.find()
      .populate('robotId', 'robotId name status')
      .populate('componentId', 'name type')
      .sort({ createdAt: -1 });

    const riskCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    robots.forEach((r) => {
      if (r.healthScore >= 70) riskCounts.LOW++;
      else if (r.healthScore >= 40) riskCounts.MEDIUM++;
      else if (r.healthScore >= 20) riskCounts.HIGH++;
      else riskCounts.CRITICAL++;
    });

    const riskDistribution = [
      { name: 'Low Risk', value: riskCounts.LOW, color: '#10b981' },
      { name: 'Medium Risk', value: riskCounts.MEDIUM, color: '#f59e0b' },
      { name: 'High Risk', value: riskCounts.HIGH, color: '#f97316' },
      { name: 'Critical Risk', value: riskCounts.CRITICAL, color: '#ef4444' },
    ];

    // High risk predictions (most recent)
    const recentHighRiskPredictions = predictions
      .filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
      .slice(0, 5);

    // Runtime hours data for chart
    const runtimeDistribution = robots.slice(0, 8).map((r) => ({
      robotId: r.robotId,
      name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
      runtimeHours: r.runtimeHours,
      healthScore: r.healthScore,
    }));

    // Top Error Types aggregated
    const errorLogs = await ErrorLog.find().populate('robotId', 'robotId name');
    const errorTypeMap = {};
    errorLogs.forEach((err) => {
      errorTypeMap[err.errorType] = (errorTypeMap[err.errorType] || 0) + 1;
    });

    const topErrorTypes = Object.keys(errorTypeMap)
      .map((type) => ({ type, count: errorTypeMap[type] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Upcoming Maintenance
    const upcomingMaintenance = await MaintenanceRecord.find({
      status: { $in: ['SCHEDULED', 'PENDING', 'IN_PROGRESS'] },
    })
      .populate('robotId', 'robotId name location')
      .populate('componentId', 'name type')
      .populate('technicianId', 'name email')
      .sort({ scheduledDate: 1 })
      .limit(6);

    // Recent Errors
    const recentErrors = await ErrorLog.find()
      .populate('robotId', 'robotId name')
      .sort({ timestamp: -1 })
      .limit(6);

    // Recent Maintenance
    const recentMaintenance = await MaintenanceRecord.find()
      .populate('robotId', 'robotId name')
      .populate('technicianId', 'name')
      .sort({ scheduledDate: -1 })
      .limit(6);

    // Recent Alerts
    const recentAlerts = await Notification.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        kpis: {
          totalRobots,
          healthy: healthyCount,
          warning: warningCount,
          critical: criticalCount,
          maintenance: maintenanceCount,
          averageHealthScore: avgHealthScore,
        },
        robotHealthOverview: robots.map((r) => ({
          _id: r._id,
          robotId: r.robotId,
          name: r.name,
          location: r.location,
          healthScore: r.healthScore,
          status: r.status,
          temperature: r.temperature,
          vibration: r.vibration,
        })),
        riskDistribution,
        recentHighRiskPredictions,
        runtimeDistribution,
        topErrorTypes,
        upcomingMaintenance,
        recentErrors,
        recentMaintenance,
        recentAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/analytics/trends
// @desc    Get detailed telemetry trends and reliability metrics
// @access  Private
router.get('/trends', protect, async (req, res, next) => {
  try {
    const robots = await Robot.find().sort({ healthScore: 1 });
    const components = await Component.find().populate('robotId', 'robotId name');
    const maintenance = await MaintenanceRecord.find();
    const errorLogs = await ErrorLog.find();
    const predictions = await Prediction.find().populate('robotId', 'robotId name');

    // Total maintenance cost and downtime
    const totalCost = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalDowntime = maintenance.reduce((sum, m) => sum + (m.downtime || 0), 0);

    // Component health distribution by component type
    const componentHealthByType = {};
    components.forEach((c) => {
      if (!componentHealthByType[c.type]) {
        componentHealthByType[c.type] = { total: 0, sumLife: 0, count: 0 };
      }
      componentHealthByType[c.type].sumLife += c.remainingLifePercent;
      componentHealthByType[c.type].count++;
    });

    const componentStats = Object.keys(componentHealthByType).map((type) => ({
      type,
      avgRemainingLife: Math.round(componentHealthByType[type].sumLife / componentHealthByType[type].count),
      count: componentHealthByType[type].count,
    }));

    // Error severity breakdown
    const errorSeverityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    errorLogs.forEach((err) => {
      if (errorSeverityMap[err.severity] !== undefined) {
        errorSeverityMap[err.severity]++;
      }
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCost,
          totalDowntime,
          totalErrors: errorLogs.length,
          totalMaintenance: maintenance.length,
          totalPredictions: predictions.length,
        },
        robotHealthRanking: robots.map((r) => ({
          robotId: r.robotId,
          name: r.name,
          healthScore: r.healthScore,
          runtimeHours: r.runtimeHours,
          temperature: r.temperature,
          vibration: r.vibration,
          status: r.status,
        })),
        componentStats,
        errorSeverityDistribution: [
          { name: 'Low', value: errorSeverityMap.LOW, color: '#38bdf8' },
          { name: 'Medium', value: errorSeverityMap.MEDIUM, color: '#f59e0b' },
          { name: 'High', value: errorSeverityMap.HIGH, color: '#f97316' },
          { name: 'Critical', value: errorSeverityMap.CRITICAL, color: '#ef4444' },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
