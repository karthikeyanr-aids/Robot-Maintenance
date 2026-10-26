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

  // Ensure failureProbability is within [0, 1]
  failureProbability = Math.min(Math.max(failureProbability, 0.01), 0.99);
  const failurePercentage = Math.round(failureProbability * 100);
  const healthScore = Math.max(0, Math.min(100, Math.round((1 - failureProbability) * 100)));

  // Risk Classification
  let riskLevel = 'LOW';
  if (failurePercentage >= 85) {
    riskLevel = 'CRITICAL';
  } else if (failurePercentage >= 70) {
    riskLevel = 'HIGH';
  } else if (failurePercentage >= 40) {
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
};
