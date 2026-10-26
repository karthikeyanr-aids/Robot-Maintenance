/**
 * Synthetic Dataset Generator for Industrial Robot Predictive Maintenance
 * Note: This generates synthetic prototype data for academic demonstration purposes.
 * It simulates realistic multi-axial robot sensor telemetry and physical stress patterns.
 */

function gaussianRandom(mean = 0, stdev = 1) {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function generateSyntheticDataset(sampleCount = 3000) {
  const dataset = [];

  for (let i = 0; i < sampleCount; i++) {
    // 1. Runtime Hours (100 to 14,000 hrs)
    const runtimeHours = Math.round(clamp(Math.random() * 13900 + 100, 100, 15000));

    // 2. Days Since Maintenance (0 to 360 days)
    const daysSinceMaintenance = Math.round(clamp(Math.random() * 360, 0, 365));

    // 3. Previous Failures (0 to 8)
    const previousFailures = Math.round(clamp(Math.random() * (runtimeHours / 2000) + gaussianRandom(0, 1), 0, 8));

    // 4. Component Life Percent (5% to 100%, inversely correlated with runtime & days since maintenance)
    const lifeDegradation = (runtimeHours / 15000) * 60 + (daysSinceMaintenance / 365) * 30 + gaussianRandom(0, 5);
    const componentLifePercent = Math.round(clamp(100 - lifeDegradation, 5, 100));

    // 5. Operating Temperature (35°C normal up to 95°C under high stress / worn bearing)
    const tempBase = 42 + (runtimeHours / 15000) * 15 + (100 - componentLifePercent) * 0.25;
    const temperature = parseFloat(clamp(tempBase + gaussianRandom(0, 4), 35.0, 95.0).toFixed(1));

    // 6. Vibration RMS Velocity (0.5 to 14.0 mm/s)
    const vibBase = 1.2 + (runtimeHours / 15000) * 3.5 + (100 - componentLifePercent) * 0.06;
    const vibration = parseFloat(clamp(vibBase + gaussianRandom(0, 1.2), 0.5, 14.0).toFixed(2));

    // 7. Error Count (0 to 25 recent alarms)
    const errBase = (temperature > 72 ? 4 : 0) + (vibration > 6.5 ? 4 : 0) + (componentLifePercent < 25 ? 5 : 0) + previousFailures * 0.8;
    const errorCount = Math.round(clamp(errBase + gaussianRandom(0, 2), 0, 25));

    // Calculate synthetic ground-truth physical failure risk probability
    let riskIndex = 0;
    // Runtime factor (0 - 0.20)
    riskIndex += (runtimeHours / 15000) * 0.20;
    // Error count factor (0 - 0.25)
    riskIndex += Math.min(errorCount / 15, 1.0) * 0.25;
    // Temperature factor (0 - 0.25, threshold > 65C)
    if (temperature > 65) {
      riskIndex += ((temperature - 65) / 30) * 0.25;
    }
    // Vibration factor (0 - 0.30, threshold > 4.5 mm/s)
    if (vibration > 4.5) {
      riskIndex += ((vibration - 4.5) / 9.5) * 0.30;
    }
    // Component life factor (0 - 0.30, critical below 35%)
    if (componentLifePercent < 40) {
      riskIndex += ((40 - componentLifePercent) / 40) * 0.30;
    }
    // Days since maintenance factor (0 - 0.15)
    riskIndex += (daysSinceMaintenance / 365) * 0.15;
    // Previous failures factor (0 - 0.15)
    riskIndex += Math.min(previousFailures / 5, 1.0) * 0.15;

    // Add mild stochastic variance
    const noisyRisk = riskIndex + gaussianRandom(0, 0.06);

    // Binary failure label: 1 if high likelihood of failure/maintenance needed soon, 0 otherwise
    const failure = noisyRisk >= 0.52 ? 1 : 0;

    dataset.push({
      runtimeHours,
      errorCount,
      temperature,
      vibration,
      componentLifePercent,
      daysSinceMaintenance,
      previousFailures,
      failure,
    });
  }

  return dataset;
}

module.exports = { generateSyntheticDataset };
