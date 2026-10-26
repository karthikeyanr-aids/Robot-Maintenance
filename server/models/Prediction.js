const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    robotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Robot',
      required: [true, 'Robot reference is required for prediction'],
    },
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
    },
    failureProbability: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    failurePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    healthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    features: {
      runtimeHours: { type: Number, default: 0 },
      errorCount: { type: Number, default: 0 },
      temperature: { type: Number, default: 45 },
      vibration: { type: Number, default: 1.5 },
      componentLifePercent: { type: Number, default: 100 },
      daysSinceMaintenance: { type: Number, default: 0 },
      previousFailures: { type: Number, default: 0 },
    },
    recommendation: {
      type: String,
      required: true,
    },
    reasons: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Prediction', predictionSchema);
