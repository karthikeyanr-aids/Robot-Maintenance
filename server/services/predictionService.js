const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const { generateRecommendationsAndReasons } = require('./recommendationEngine');

let loadedModel = null;
let scalerParams = null;

const FEATURE_KEYS = [
  'runtimeHours',
  'errorCount',
  'temperature',
  'vibration',
  'componentLifePercent',
  'daysSinceMaintenance',
  'previousFailures',
];

/**
 * Initializes and loads the trained TensorFlow.js model and scaler parameters.
 */
async function initModel() {
  const modelDir = path.join(__dirname, '../ml/model');
  const modelJsonPath = path.join(modelDir, 'model.json');
  const weightsManifestPath = path.join(modelDir, 'weights_manifest.json');
  const weightsBinPath = path.join(modelDir, 'weights.bin');
  const scalerPath = path.join(modelDir, 'scaler.json');

  if (
    fs.existsSync(modelJsonPath) &&
    fs.existsSync(weightsManifestPath) &&
    fs.existsSync(weightsBinPath) &&
    fs.existsSync(scalerPath)
  ) {
    try {
      scalerParams = JSON.parse(fs.readFileSync(scalerPath, 'utf8'));
      const modelTopology = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
      const weightSpecs = JSON.parse(fs.readFileSync(weightsManifestPath, 'utf8'));
      const weightDataBuffer = fs.readFileSync(weightsBinPath);

      // Convert Node Buffer to ArrayBuffer
      const weightData = new Uint8Array(weightDataBuffer).buffer;

      loadedModel = await tf.loadLayersModel(
        tf.io.fromMemory({
          modelTopology,
          weightSpecs,
          weightData,
        })
      );
      console.log('[ML Service] TensorFlow.js model and normalization scaler loaded successfully');
      return true;
    } catch (err) {
      console.warn('[ML Service] Error loading saved model:', err.message);
    }
  } else {
    console.log('[ML Service] Saved model not found. ML fallback engine ready until model is trained.');
  }
  return false;
}

// Automatically attempt to load model on module load
initModel().catch((e) => console.warn('[ML Service] Init error:', e.message));

/**
 * Rule-based fallback calculation if ML model is unavailable or in bootstrap.
 */
function fallbackPredict(features) {
  const {
    runtimeHours = 0,
    errorCount = 0,
    temperature = 45,
    vibration = 1.5,
    componentLifePercent = 100,
    daysSinceMaintenance = 0,
    previousFailures = 0,
  } = features;

  let score = 0;
  score += Math.min(runtimeHours / 15000, 1.0) * 0.20;
  score += Math.min(errorCount / 15, 1.0) * 0.25;
  if (temperature > 60) score += Math.min((temperature - 60) / 35, 1.0) * 0.25;
  if (vibration > 4.0) score += Math.min((vibration - 4.0) / 10, 1.0) * 0.30;
  if (componentLifePercent < 50) score += ((50 - componentLifePercent) / 50) * 0.30;
  score += Math.min(daysSinceMaintenance / 365, 1.0) * 0.15;
  score += Math.min(previousFailures / 5, 1.0) * 0.15;

  return Math.min(Math.max(score, 0.02), 0.98);
}

/**
 * Calculates continuous, dynamic risk based on industrial telemetry thresholds
 */
function calculateDynamicTelemetryRisk(features) {
  const temp = Number(features.temperature) || 45;
  const vib = Number(features.vibration) || 1.5;
  const hours = Number(features.runtimeHours) || 0;
  const errors = Number(features.errorCount) || 0;
  const compLife = Number(features.componentLifePercent) !== undefined && !isNaN(Number(features.componentLifePercent)) ? Number(features.componentLifePercent) : 100;
  const daysSinceMaint = Number(features.daysSinceMaintenance) || 0;

  let risk = 0.02; // baseline 2% failure probability for brand-new healthy robot

  // 1. Temperature factor
  if (temp > 55) {
    if (temp >= 80) {
      risk += 0.45 + Math.min((temp - 80) / 20, 0.40); // 0.45 - 0.85
    } else if (temp >= 70) {
      risk += 0.25 + ((temp - 70) / 10) * 0.20; // 0.25 - 0.45
    } else {
      risk += ((temp - 55) / 15) * 0.20; // 0.0 - 0.20
    }
  }

  // 2. Vibration factor (RMS mm/s)
  if (vib > 2.5) {
    if (vib >= 6.0) {
      risk += 0.40 + Math.min((vib - 6.0) / 6.0, 0.45); // 0.40 - 0.85
    } else if (vib >= 4.0) {
      risk += 0.20 + ((vib - 4.0) / 2.0) * 0.20; // 0.20 - 0.40
    } else {
      risk += ((vib - 2.5) / 1.5) * 0.15; // 0.0 - 0.15
    }
  }

  // 3. Runtime factor
  if (hours > 2000) {
    risk += Math.min((hours - 2000) / 12000, 1.0) * 0.15;
  }

  // 4. Component wear & error logs
  if (compLife < 60) {
    risk += ((60 - compLife) / 60) * 0.25;
  }
  if (errors > 0) {
    risk += Math.min(errors / 10, 1.0) * 0.20;
  }
  if (daysSinceMaint > 90) {
    risk += Math.min((daysSinceMaint - 90) / 180, 1.0) * 0.10;
  }

  // Explicit status overrides or safeguards
  if (features.status === 'CRITICAL') {
    risk = Math.max(risk, 0.82);
  } else if (features.status === 'WARNING') {
    risk = Math.max(risk, 0.45);
  }

  return Math.min(Math.max(risk, 0.01), 0.99);
}

/**
 * Predicts failure probability and health metrics for a robot.
 */
async function predictFailure(features) {
  let failureProbability = 0;

  if (loadedModel && scalerParams) {
    try {
      // Normalize features using training scaler parameters
      const normalized = FEATURE_KEYS.map((key) => {
        const val = Number(features[key]) || 0;
        const mean = scalerParams[key]?.mean || 0;
        const stdDev = scalerParams[key]?.stdDev || 1;
        return (val - mean) / stdDev;
      });

      const inputTensor = tf.tensor2d([normalized]);
      const predictionTensor = loadedModel.predict(inputTensor);
      const predictionData = await predictionTensor.data();
      failureProbability = parseFloat(predictionData[0].toFixed(4));
       console.log('[ML MODEL] Input features:', features);
       console.log('[ML MODEL] Raw prediction:', predictionData[0])

      // Free tensors
      inputTensor.dispose();
      predictionTensor.dispose();
    } catch (err) {
      console.warn('[ML Service] Prediction failed with TensorFlow.js, applying fallback:', err.message);
      failureProbability = parseFloat(fallbackPredict(features).toFixed(4));
       console.log('[FALLBACK] Input features:', features);
       console.log('[FALLBACK] Failure probability:', failureProbability);
    }
  } else {
    failureProbability = parseFloat(fallbackPredict(features).toFixed(4));
    console.log('[FALLBACK] Input features:', features);
    console.log('[FALLBACK] Failure probability:', failureProbability);
  }

  // Dynamic telemetry degradation risk model based on physical thresholds
  const dynamicRisk = calculateDynamicTelemetryRisk(features);
  failureProbability = Math.max(failureProbability, dynamicRisk);

  // Ensure failureProbability is within [0, 1]
  failureProbability = Math.min(Math.max(failureProbability, 0.01), 0.99);
  const failurePercentage = Math.round(failureProbability * 100);
  const healthScore = Math.max(0, Math.min(100, Math.round((1 - failureProbability) * 100)));

  // Risk Classification
  let riskLevel = 'LOW';
  if (failurePercentage >= 80 || features.status === 'CRITICAL') {
    riskLevel = 'CRITICAL';
  } else if (failurePercentage >= 65) {
    riskLevel = 'HIGH';
  } else if (failurePercentage >= 35 || features.status === 'WARNING') {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  // Generate recommendations and root causes
  const { recommendation, reasons } = generateRecommendationsAndReasons(features, riskLevel);

  return {
    failureProbability,
    failurePercentage,
    healthScore,
    riskLevel,
    recommendation,
    reasons,
    features,
  };
}

module.exports = {
  predictFailure,
  initModel,
  calculateDynamicTelemetryRisk,
};
