/**
 * Diagnostic Recommendation Engine
 * Analyzes operational telemetry and failure predictions to generate actionable maintenance plans.
 */

function generateRecommendationsAndReasons(features, riskLevel, components = []) {
  const reasons = [];
  const specificActions = [];

  const {
    runtimeHours = 0,
    errorCount = 0,
    temperature = 45,
    vibration = 1.5,
    componentLifePercent = 100,
    daysSinceMaintenance = 0,
    previousFailures = 0,
  } = features;

  // Root cause reason extraction
  if (temperature >= 72) {
    reasons.push(`Critical thermal stress detected (${temperature.toFixed(1)}°C)`);
    specificActions.push('Inspect motor cooling fans, thermal paste, and heat dissipation jackets.');
  } else if (temperature >= 62) {
    reasons.push(`Elevated operating temperature (${temperature.toFixed(1)}°C)`);
  }

  if (vibration >= 6.0) {
    reasons.push(`Severe harmonic vibration detected (${vibration.toFixed(2)} mm/s RMS)`);
    specificActions.push('Check harmonic drive gearboxes, axis bearings, and mounting bolts for abnormal mechanical backlash.');
  } else if (vibration >= 4.0) {
    reasons.push(`Moderate mechanical vibration (${vibration.toFixed(2)} mm/s RMS)`);
  }

  if (componentLifePercent <= 25) {
    reasons.push(`Critical component life exhaustion (${componentLifePercent}% remaining)`);
    specificActions.push('Schedule immediate replacement for degraded high-wear components.');
  } else if (componentLifePercent <= 45) {
    reasons.push(`Component life degraded below normal threshold (${componentLifePercent}% remaining)`);
  }

  if (errorCount >= 6) {
    reasons.push(`Frequent recent fault codes and alarms (${errorCount} occurrences)`);
    specificActions.push('Review recent controller error logs and execute electrical & encoder signal diagnostics.');
  } else if (errorCount >= 2) {
    reasons.push(`Intermittent error logs detected (${errorCount} occurrences)`);
  }

  if (daysSinceMaintenance >= 120) {
    reasons.push(`Overdue maintenance cycle (${daysSinceMaintenance} days since last service)`);
    specificActions.push('Perform comprehensive periodic lubrication and calibration.');
  }

  if (previousFailures >= 3) {
    reasons.push(`High historical failure recurrence (${previousFailures} past incidents)`);
  }

  if (runtimeHours >= 9000) {
    reasons.push(`High cumulative operating hours (${runtimeHours.toLocaleString()} hrs)`);
  }

  if (reasons.length === 0) {
    reasons.push('All telemetry parameters operating within optimal factory tolerances');
  }

  // Primary recommendation synthesis based on risk level
  let primaryRec = '';
  if (riskLevel === 'CRITICAL') {
    primaryRec = 'Immediate maintenance inspection recommended within 3 days. Reduce robot cycle load to prevent unexpected production stoppage.';
  } else if (riskLevel === 'HIGH') {
    primaryRec = 'Schedule preventive maintenance within 7 days. Prepare replacement parts and assign senior technician.';
  } else if (riskLevel === 'MEDIUM') {
    primaryRec = 'Monitor telemetry trends closely. Conduct diagnostic inspection during the next scheduled shift maintenance window.';
  } else {
    primaryRec = 'System healthy. Continue standard continuous operational monitoring.';
  }

  if (specificActions.length > 0) {
    primaryRec += ' ' + specificActions.slice(0, 2).join(' ');
  }

  return {
    recommendation: primaryRec,
    reasons,
  };
}

module.exports = { generateRecommendationsAndReasons };
