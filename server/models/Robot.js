const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema(
  {
    robotId: {
      type: String,
      required: [true, 'Robot ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Robot name is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location/Workcell is required'],
      trim: true,
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    runtimeHours: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    temperature: {
      type: Number,
      required: true,
      default: 45.0, // Celsius
    },
    vibration: {
      type: Number,
      required: true,
      default: 1.5, // mm/s RMS
    },
    status: {
      type: String,
      enum: ['HEALTHY', 'WARNING', 'CRITICAL', 'MAINTENANCE'],
      default: 'HEALTHY',
    },
    healthScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    lastMaintenance: {
      type: Date,
      default: Date.now,
    },
    nextMaintenance: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Robot', robotSchema);
