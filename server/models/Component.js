const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    robotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Robot',
      required: [true, 'Component must be associated with a Robot'],
    },
    name: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Motor', 'Gearbox', 'Bearing', 'Sensor', 'Hydraulic System', 'Controller', 'Gripper', 'Other'],
      default: 'Motor',
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    expectedLifeHours: {
      type: Number,
      required: true,
      default: 10000,
      min: 1,
    },
    usedLifeHours: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    remainingLifePercent: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['OK', 'WARNING', 'CRITICAL'],
      default: 'OK',
    },
    lastMaintenance: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

componentSchema.pre('save', function (next) {
  if (this.expectedLifeHours > 0) {
    const rawPercent = ((this.expectedLifeHours - this.usedLifeHours) / this.expectedLifeHours) * 100;
    this.remainingLifePercent = Math.max(0, Math.min(100, Math.round(rawPercent)));
    
    if (this.remainingLifePercent <= 20) {
      this.status = 'CRITICAL';
    } else if (this.remainingLifePercent <= 45) {
      this.status = 'WARNING';
    } else {
      this.status = 'OK';
    }
  }
  next();
});

module.exports = mongoose.model('Component', componentSchema);
