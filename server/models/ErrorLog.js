const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema(
  {
    robotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Robot',
      required: [true, 'Robot reference is required for error log'],
    },
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
    },
    errorCode: {
      type: String,
      required: [true, 'Error code is required'],
      trim: true,
    },
    errorType: {
      type: String,
      required: [true, 'Error type is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Error description is required'],
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolution: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ErrorLog', errorLogSchema);
