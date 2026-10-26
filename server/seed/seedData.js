const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Robot = require('../models/Robot');
const Component = require('../models/Component');
const ErrorLog = require('../models/ErrorLog');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const Prediction = require('../models/Prediction');
const Notification = require('../models/Notification');
const { predictFailure, initModel } = require('../services/predictionService');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/robocare_db');
    console.log(`[Seed] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[Seed Error]:`, err.message);
    process.exit(1);
  }
};

const robotTemplates = [
  {
    robotId: 'RBT-001',
    name: 'Heavy Payload Articulated Robot 01',
    model: 'FANUC M-900iB/700',
    manufacturer: 'FANUC',
    location: 'Body Shop Welding Cell A1',
    runtimeHours: 8940,
    temperature: 78.5,
    vibration: 7.2,
    status: 'CRITICAL',
    healthScore: 18,
    daysSinceMaint: 145,
  },
  {
    robotId: 'RBT-002',
    name: 'Precision Arc Welding Robot 02',
    model: 'ABB IRB 2600',
    manufacturer: 'ABB',
    location: 'Chassis Welding Cell B3',
    runtimeHours: 3200,
    temperature: 46.2,
    vibration: 1.6,
    status: 'HEALTHY',
    healthScore: 92,
    daysSinceMaint: 28,
  },
  {
    robotId: 'RBT-003',
    name: 'High-Speed Palletizing Robot 03',
    model: 'KUKA KR 300 PA',
    manufacturer: 'KUKA',
    location: 'Packaging & Palletizing Bay 1',
    runtimeHours: 7420,
    temperature: 68.4,
    vibration: 5.8,
    status: 'WARNING',
    healthScore: 54,
    daysSinceMaint: 95,
  },
  {
    robotId: 'RBT-004',
    name: 'Collaborative Assembly Arm 04',
    model: 'Universal Robots UR10e',
    manufacturer: 'Universal Robots',
    location: 'Final Assembly Line 2',
    runtimeHours: 1850,
    temperature: 41.5,
    vibration: 1.1,
    status: 'HEALTHY',
    healthScore: 96,
    daysSinceMaint: 15,
  },
  {
    robotId: 'RBT-005',
    name: 'Spot Welding Gantry Robot 05',
    model: 'Yaskawa Motoman SP180-120',
    manufacturer: 'Yaskawa',
    location: 'Body Framing Line C',
    runtimeHours: 11400,
    temperature: 82.3,
    vibration: 8.4,
    status: 'CRITICAL',
    healthScore: 12,
    daysSinceMaint: 180,
  },
  {
    robotId: 'RBT-006',
    name: 'Precision Painting Atomizer 06',
    model: 'Staubli TX2-90 Paint',
    manufacturer: 'Staubli',
    location: 'Automated Paint Booth 4',
    runtimeHours: 4100,
    temperature: 52.0,
    vibration: 2.3,
    status: 'HEALTHY',
    healthScore: 88,
    daysSinceMaint: 40,
  },
  {
    robotId: 'RBT-007',
    name: 'CNC Machine Tending Robot 07',
    model: 'FANUC LR Mate 200iD',
    manufacturer: 'FANUC',
    location: 'Machining Center Unit 5',
    runtimeHours: 6200,
    temperature: 63.8,
    vibration: 4.9,
    status: 'WARNING',
    healthScore: 62,
    daysSinceMaint: 75,
  },
  {
    robotId: 'RBT-008',
    name: 'Cleanroom Wafer Handler 08',
    model: 'KUKA KR 6 AGILUS Cleanroom',
    manufacturer: 'KUKA',
    location: 'Electronics Cleanroom Bay',
    runtimeHours: 2100,
    temperature: 39.8,
    vibration: 0.9,
    status: 'HEALTHY',
    healthScore: 98,
    daysSinceMaint: 10,
  },
  {
    robotId: 'RBT-009',
    name: 'Laser Cutting Robot 09',
    model: 'ABB IRB 4600',
    manufacturer: 'ABB',
    location: 'Sheet Metal Fabrication 1',
    runtimeHours: 9850,
    temperature: 74.6,
    vibration: 6.8,
    status: 'CRITICAL',
    healthScore: 24,
    daysSinceMaint: 130,
  },
  {
    robotId: 'RBT-010',
    name: 'Heavy Foundry Die-Cast Robot 10',
    model: 'Yaskawa Motoman GP180',
    manufacturer: 'Yaskawa',
    location: 'Die Casting Foundry Line 2',
    runtimeHours: 8500,
    temperature: 71.0,
    vibration: 5.5,
    status: 'WARNING',
    healthScore: 48,
    daysSinceMaint: 88,
  },
  {
    robotId: 'RBT-011',
    name: 'Delta Pick & Place Sorter 11',
    model: 'ABB IRB 360 FlexPicker',
    manufacturer: 'ABB',
    location: 'High Speed Sorting Line A',
    runtimeHours: 3600,
    temperature: 44.5,
    vibration: 1.8,
    status: 'HEALTHY',
    healthScore: 91,
    daysSinceMaint: 35,
  },
  {
    robotId: 'RBT-012',
    name: 'Adhesive Dispensing Robot 12',
    model: 'FANUC CRX-10iA Cobot',
    manufacturer: 'FANUC',
    location: 'Windshield Sealing Station',
    runtimeHours: 5400,
    temperature: 58.2,
    vibration: 3.7,
    status: 'HEALTHY',
    healthScore: 78,
    daysSinceMaint: 55,
  },
  {
    robotId: 'RBT-013',
    name: 'Heavy Forging Press Feeder 13',
    model: 'KUKA KR 1000 titan',
    manufacturer: 'KUKA',
    location: 'Heavy Forging Plant East',
    runtimeHours: 12800,
    temperature: 88.0,
    vibration: 9.6,
    status: 'CRITICAL',
    healthScore: 8,
    daysSinceMaint: 210,
  },
  {
    robotId: 'RBT-014',
    name: 'Inspection & Vision Gaging 14',
    model: 'Universal Robots UR5e',
    manufacturer: 'Universal Robots',
    location: 'Quality Control Gate 3',
    runtimeHours: 1950,
    temperature: 42.0,
    vibration: 1.2,
    status: 'HEALTHY',
    healthScore: 95,
    daysSinceMaint: 20,
  },
  {
    robotId: 'RBT-015',
    name: 'Engine Block Deburring Robot 15',
    model: 'Staubli TX2-140',
    manufacturer: 'Staubli',
    location: 'Powertrain Machining Cell',
    runtimeHours: 7100,
    temperature: 65.5,
    vibration: 5.1,
    status: 'WARNING',
    healthScore: 58,
    daysSinceMaint: 80,
  },
  {
    robotId: 'RBT-016',
    name: 'Component Transfer Overhead Gantry 16',
    model: 'FANUC M-20iD/25',
    manufacturer: 'FANUC',
    location: 'Sub-Assembly Conveyor 4',
    runtimeHours: 4900,
    temperature: 49.0,
    vibration: 2.1,
    status: 'HEALTHY',
    healthScore: 86,
    daysSinceMaint: 45,
  },
];

async function seedDatabase() {
  console.log('====================================================');
  console.log('  ROBOCARE - Seeding MongoDB with Industrial Data');
  console.log('====================================================');

  await connectDB();
  await initModel();

  // 1. Clear existing collections
  console.log('[1/7] Clearing previous collection data...');
  await User.deleteMany({});
  await Robot.deleteMany({});
  await Component.deleteMany({});
  await ErrorLog.deleteMany({});
  await MaintenanceRecord.deleteMany({});
  await Prediction.deleteMany({});
  await Notification.deleteMany({});

  // 2. Seed Users
  console.log('[2/7] Seeding Users with demo accounts (Admin, Technicians)...');
  const demoPassword = 'Admin@123';

  const createdAdmin = await User.create({
    name: 'Chief Admin',
    username: 'admin',
    email: 'admin@robocare.com',
    password: demoPassword,
    role: 'ADMIN',
    department: 'Plant Engineering & Infrastructure',
  });

  const createdTech1 = await User.create({
    name: 'Maintenance Engineer',
    username: 'technician',
    email: 'technician@robocare.com',
    password: demoPassword,
    role: 'TECHNICIAN',
    department: 'Robotics Maintenance Team Alpha',
  });

  const createdTech2 = await User.create({
    name: 'Alex Vance',
    username: 'alex.tech',
    email: 'alex.tech@robocare.com',
    password: demoPassword,
    role: 'TECHNICIAN',
    department: 'Mechanical Drives & Actuators',
  });

  const createdTech3 = await User.create({
    name: 'Sarah Connor',
    username: 'sarah.tech',
    email: 'sarah.tech@robocare.com',
    password: demoPassword,
    role: 'TECHNICIAN',
    department: 'Electrical & Controller Systems',
  });

  const allTechnicians = [createdTech1, createdTech2, createdTech3];

  // 3. Seed Robots
  console.log('[3/7] Seeding 16 Industrial Robots with diverse operating conditions...');
  const createdRobots = [];

  for (const template of robotTemplates) {
    const installDate = new Date(Date.now() - (template.runtimeHours / 16) * 24 * 60 * 60 * 1000);
    const lastMaint = new Date(Date.now() - template.daysSinceMaint * 24 * 60 * 60 * 1000);
    const nextMaint = new Date(Date.now() + (template.status === 'CRITICAL' ? 2 : template.status === 'WARNING' ? 7 : 45) * 24 * 60 * 60 * 1000);

    const robot = await Robot.create({
      robotId: template.robotId,
      name: template.name,
      model: template.model,
      manufacturer: template.manufacturer,
      location: template.location,
      installationDate: installDate,
      runtimeHours: template.runtimeHours,
      temperature: template.temperature,
      vibration: template.vibration,
      status: template.status,
      healthScore: template.healthScore,
      lastMaintenance: lastMaint,
      nextMaintenance: nextMaint,
    });
    createdRobots.push(robot);
  }

  // 4. Seed Components for each Robot
  console.log('[4/7] Seeding 2-5 Critical Components per Robot...');
  const createdComponents = [];

  const componentNames = [
    { name: 'Axis 1 Primary Servo Motor', type: 'Motor', expectedLife: 15000 },
    { name: 'Axis 2 Harmonic Drive Gearbox', type: 'Gearbox', expectedLife: 12000 },
    { name: 'Main Spindle Bearings', type: 'Bearing', expectedLife: 8000 },
    { name: 'High-Pressure Hydraulic Valve', type: 'Hydraulic System', expectedLife: 10000 },
    { name: 'Multi-Axis Absolute Optical Encoder', type: 'Sensor', expectedLife: 20000 },
  ];

  for (const robot of createdRobots) {
    const isCritical = robot.status === 'CRITICAL';
    const isWarning = robot.status === 'WARNING';

    for (let cIdx = 0; cIdx < 4; cIdx++) {
      const template = componentNames[cIdx];
      let usedHours = Math.round((robot.runtimeHours * (0.6 + Math.random() * 0.4)));
      if (isCritical && cIdx <= 1) {
        usedHours = Math.round(template.expectedLife * 0.92); // Component nearly exhausted
      } else if (isWarning && cIdx === 0) {
        usedHours = Math.round(template.expectedLife * 0.72);
      }

      const comp = new Component({
        robotId: robot._id,
        name: template.name,
        type: template.type,
        installationDate: robot.installationDate,
        expectedLifeHours: template.expectedLife,
        usedLifeHours: Math.min(usedHours, template.expectedLife),
        lastMaintenance: robot.lastMaintenance,
      });

      await comp.save();
      createdComponents.push(comp);
    }
  }

  // 5. Seed Error Logs
  console.log('[5/7] Seeding historical and active error logs...');
  const errorTemplates = [
    { code: 'ERR-TMP-401', type: 'Thermal Exceedance Alarm', desc: 'Operating temperature breached upper safety boundary (>75°C)', severity: 'CRITICAL' },
    { code: 'ERR-VIB-802', type: 'Harmonic Vibration Anomaly', desc: 'Harmonic peak amplitude exceeded RMS 6.5 mm/s tolerance', severity: 'HIGH' },
    { code: 'ERR-ENC-103', type: 'Optical Encoder Position Lag', desc: 'Axis 2 angular position tracking error exceeds 0.05 degrees', severity: 'MEDIUM' },
    { code: 'ERR-HYD-504', type: 'Hydraulic Pressure Variance', desc: 'Auxiliary line pressure drop detected during clamping phase', severity: 'HIGH' },
    { code: 'ERR-CUR-205', type: 'Motor Overcurrent Ripple', desc: 'Phase current spikes detected during high acceleration profile', severity: 'MEDIUM' },
    { code: 'ERR-CAN-010', type: 'Fieldbus Comm Jitter', desc: 'Intermittent packet retry on EtherCAT communication ring', severity: 'LOW' },
  ];

  for (const robot of createdRobots) {
    const errorCount = robot.status === 'CRITICAL' ? 4 : robot.status === 'WARNING' ? 2 : 1;

    for (let eIdx = 0; eIdx < errorCount; eIdx++) {
      const template = errorTemplates[Math.floor(Math.random() * errorTemplates.length)];
      const isResolved = robot.status === 'HEALTHY' || (robot.status === 'WARNING' && eIdx > 0);
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000);

      await ErrorLog.create({
        robotId: robot._id,
        errorCode: template.code,
        errorType: template.type,
        description: `${template.desc} on ${robot.robotId}`,
        severity: template.severity,
        timestamp,
        resolved: isResolved,
        resolution: isResolved ? 'Recalibrated and reset via technician terminal' : '',
        resolvedAt: isResolved ? new Date(timestamp.getTime() + 4 * 60 * 60 * 1000) : null,
      });
    }
  }

  // 6. Seed Maintenance Records
  console.log('[6/7] Seeding maintenance records (Scheduled, In-Progress, Completed)...');
  const problems = [
    'Annual 8,000-hour comprehensive overhaul and grease replenishment',
    'Investigate abnormal gear mesh vibration and replace worn seals',
    'Emergency inspection of servo drive cooling fan failure',
    'Re-tightening and dynamic balancing of end-effector mounting flange',
    'Replacement of worn Axis 1 motor bearings and harmonic drive',
  ];

  for (let i = 0; i < createdRobots.length; i++) {
    const robot = createdRobots[i];
    const tech = allTechnicians[i % allTechnicians.length];

    // Past completed maintenance
    await MaintenanceRecord.create({
      robotId: robot._id,
      technicianId: tech._id,
      problem: problems[0],
      actionTaken: 'Flushed old lubricant, replaced seals, recalibrated zero offsets.',
      scheduledDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      priority: 'MEDIUM',
      cost: 1450,
      downtime: 6.5,
      notes: 'Completed without issues. Normal wear pattern observed.',
    });

    // Upcoming or Active maintenance
    if (robot.status === 'CRITICAL') {
      await MaintenanceRecord.create({
        robotId: robot._id,
        technicianId: tech._id,
        problem: 'Emergency high thermal and severe mechanical vibration inspection',
        actionTaken: '',
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        priority: 'CRITICAL',
        cost: 2800,
        downtime: 8.0,
        notes: 'Assigned as highest priority. Prepare backup servo motor.',
      });
    } else if (robot.status === 'WARNING') {
      await MaintenanceRecord.create({
        robotId: robot._id,
        technicianId: tech._id,
        problem: 'Preventive inspection of degrading gearbox backlash and encoder check',
        actionTaken: '',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
        priority: 'HIGH',
        cost: 1200,
        downtime: 4.0,
        notes: 'Schedule during Saturday non-production shift.',
      });
    }
  }

  // 7. Seed Initial ML Predictions & Notifications for each robot
  console.log('[7/7] Computing initial ML predictions and notifications for all robots...');
  for (const robot of createdRobots) {
    const comps = await Component.find({ robotId: robot._id });
    const errors = await ErrorLog.find({ robotId: robot._id, resolved: false });
    const pastMaint = await MaintenanceRecord.find({ robotId: robot._id, status: 'COMPLETED' });

    let lowestCompLife = 100;
    let worstComp = null;
    if (comps.length > 0) {
      worstComp = comps.reduce((prev, curr) => (prev.remainingLifePercent < curr.remainingLifePercent ? prev : curr));
      lowestCompLife = worstComp.remainingLifePercent;
    }

    const lastMaintTime = robot.lastMaintenance ? new Date(robot.lastMaintenance).getTime() : Date.now();
    const daysSinceMaint = Math.round(Math.max(0, Date.now() - lastMaintTime) / (1000 * 60 * 60 * 24));

    const features = {
      runtimeHours: robot.runtimeHours,
      errorCount: errors.length,
      temperature: robot.temperature,
      vibration: robot.vibration,
      componentLifePercent: lowestCompLife,
      daysSinceMaintenance: daysSinceMaint,
      previousFailures: pastMaint.length,
    };

    const predResult = await predictFailure(features);

    const prediction = await Prediction.create({
      robotId: robot._id,
      componentId: worstComp ? worstComp._id : null,
      failureProbability: predResult.failureProbability,
      failurePercentage: predResult.failurePercentage,
      riskLevel: predResult.riskLevel,
      healthScore: predResult.healthScore,
      features: predResult.features,
      recommendation: predResult.recommendation,
      reasons: predResult.reasons,
      createdAt: new Date(),
    });

    // Update robot health score to match prediction
    robot.healthScore = predResult.healthScore;
    await robot.save();

    if (predResult.riskLevel === 'HIGH' || predResult.riskLevel === 'CRITICAL') {
      await Notification.create({
        robotId: robot._id,
        userId: createdAdmin._id,
        message: `High risk detected for ${robot.robotId} (${robot.name}): ${predResult.failurePercentage}% failure probability. ${predResult.recommendation}`,
        severity: predResult.riskLevel,
        read: false,
        link: `/robots/${robot.robotId}`,
      });
    }
  }

  console.log('====================================================');
  console.log('  Database Seeding Completed Successfully!');
  console.log('  Default Accounts:');
  console.log('  - Admin:      admin@robocare.com      (pwd: Admin@123)');
  console.log('  - Maintenance Engineer: technician@robocare.com (pwd: Admin@123)');
  console.log('====================================================');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
