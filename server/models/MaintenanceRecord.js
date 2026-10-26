const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema(
  {
    robotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Robot',
      required: [true, 'Robot reference is required for maintenance record'],
    },
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    problem: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true,
    },
    actionTaken: {
      type: String,
      default: '',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
      default: Date.now,
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    downtime: {
      type: Number,
      default: 0, // hours
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
