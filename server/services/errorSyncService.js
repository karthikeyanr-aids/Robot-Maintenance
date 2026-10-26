const ErrorLog = require('../models/ErrorLog');

/**
 * Automatically maps prediction anomalies & telemetry root causes to active ErrorLog entries.
 * Avoids duplicate active logs if an unresolved log with the same errorCode already exists for the robot.
 */
async function syncErrorLogsFromTelemetry(robot, features = {}, predictionResult = {}, componentId = null) {
  if (!robot || !robot._id) return [];

  const temp = Number(features.temperature) || Number(robot.temperature) || 45;
  const vib = Number(features.vibration) || Number(robot.vibration) || 1.5;
  const hours = Number(features.runtimeHours) || Number(robot.runtimeHours) || 0;
  const compLife = Number(features.componentLifePercent) !== undefined && !isNaN(Number(features.componentLifePercent))
    ? Number(features.componentLifePercent)
    : 100;

  const candidateErrors = [];

  // 1. Thermal Overload / Exceedance
  if (temp >= 70) {
    candidateErrors.push({
      errorCode: 'ERR-TMP-401',
      errorType: 'Thermal Exceedance Alarm',
      description: `Critical thermal stress detected on ${robot.robotId} (${robot.name}): Operating temperature at ${temp.toFixed(1)}°C exceeds safety limit.`,
      severity: temp >= 80 ? 'CRITICAL' : 'HIGH',
    });
  } else if (temp >= 60) {
    candidateErrors.push({
      errorCode: 'WARN-TMP-302',
      errorType: 'Elevated Temperature Warning',
      description: `Elevated operating temperature (${temp.toFixed(1)}°C) on ${robot.robotId}. Inspect motor cooling fans and thermal jackets.`,
      severity: 'MEDIUM',
    });
  }

  // 2. Harmonic Vibration Anomaly
  if (vib >= 4.5) {
    candidateErrors.push({
      errorCode: 'ERR-VIB-802',
      errorType: 'Harmonic Vibration Anomaly',
      description: `Severe harmonic mechanical vibration detected on ${robot.robotId}: ${vib.toFixed(2)} mm/s RMS indicates bearing wear or gearbox backlash.`,
      severity: vib >= 6.0 ? 'CRITICAL' : 'HIGH',
    });
  } else if (vib >= 3.5) {
    candidateErrors.push({
      errorCode: 'WARN-VIB-201',
      errorType: 'Mechanical Vibration Warning',
      description: `Moderate mechanical vibration detected on ${robot.robotId}: ${vib.toFixed(2)} mm/s RMS. Axis calibration and backlash check advised.`,
      severity: 'MEDIUM',
    });
  }

  // 3. High Cumulative Runtime
  if (hours >= 12000) {
    candidateErrors.push({
      errorCode: 'ERR-RNT-505',
      errorType: 'Duty Cycle Degradation',
      description: `High cumulative operating runtime: ${hours.toLocaleString()} hours exceeded recommended major overhaul threshold on ${robot.robotId}.`,
      severity: 'CRITICAL',
    });
  } else if (hours >= 9000) {
    candidateErrors.push({
      errorCode: 'WARN-RNT-501',
      errorType: 'High Operating Runtime',
      description: `Cumulative operating runtime reached ${hours.toLocaleString()} hours on ${robot.robotId}. Scheduled overhaul approaching.`,
      severity: 'MEDIUM',
    });
  }

  // 4. Critical Component Exhaustion
  if (compLife <= 25) {
    candidateErrors.push({
      errorCode: 'ERR-CMP-701',
      errorType: 'Component Exhaustion Alarm',
      description: `High-wear component life critically degraded (${compLife}% remaining) on ${robot.robotId}. Immediate replacement required.`,
      severity: 'CRITICAL',
    });
  }

  // 5. AI Predictive Critical Risk Alarm
  if (predictionResult && predictionResult.riskLevel === 'CRITICAL') {
    candidateErrors.push({
      errorCode: 'ERR-PRD-999',
      errorType: 'AI Predictive Failure Alarm',
      description: `AI Model flagged ${robot.robotId} with ${predictionResult.failurePercentage}% failure probability: ${predictionResult.recommendation || 'Immediate inspection required'}`,
      severity: 'CRITICAL',
    });
  }

  const createdLogs = [];

  for (const err of candidateErrors) {
    // Only create if there isn't already an unresolved error with this code for this robot
    const existing = await ErrorLog.findOne({
      robotId: robot._id,
      errorCode: err.errorCode,
      resolved: false,
    });

    if (!existing) {
      const newLog = await ErrorLog.create({
        robotId: robot._id,
        componentId: componentId || undefined,
        errorCode: err.errorCode,
        errorType: err.errorType,
        description: err.description,
        severity: err.severity,
        timestamp: new Date(),
        resolved: false,
      });
      createdLogs.push(newLog);
    }
  }

  return createdLogs;
}

module.exports = {
  syncErrorLogsFromTelemetry,
};
