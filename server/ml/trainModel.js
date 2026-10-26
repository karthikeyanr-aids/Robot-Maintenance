const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const { generateSyntheticDataset } = require('./generateData');

async function trainAndSaveModel() {
  console.log('====================================================');
  console.log('  ROBOCARE - Industrial Robot ML Model Training');
  console.log('====================================================');

  const modelDir = path.join(__dirname, 'model');
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  // 1. Generate Synthetic Dataset (~3,000 records)
  console.log('[1/5] Generating synthetic sensor telemetry dataset (3,000 records)...');
  const rawData = generateSyntheticDataset(3000);

  const featureKeys = [
    'runtimeHours',
    'errorCount',
    'temperature',
    'vibration',
    'componentLifePercent',
    'daysSinceMaintenance',
    'previousFailures',
  ];

  // 2. Compute Mean & StdDev for Z-Score Normalization
  console.log('[2/5] Computing normalization parameters (Z-Score Standardization)...');
  const stats = {};
  featureKeys.forEach((key) => {
    const values = rawData.map((d) => d[key]);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance) || 1.0;
    stats[key] = { mean, stdDev };
  });

  // Save scaler parameters to scaler.json
  const scalerPath = path.join(modelDir, 'scaler.json');
  fs.writeFileSync(scalerPath, JSON.stringify(stats, null, 2));
  console.log(`      Scaler parameters saved to: ${scalerPath}`);

  // 3. Normalize Dataset
  const normalizedFeatures = rawData.map((d) => {
    return featureKeys.map((key) => (d[key] - stats[key].mean) / stats[key].stdDev);
  });
  const labels = rawData.map((d) => [d.failure]);

  // Train / Validation split (80% train, 20% validation)
  const splitIndex = Math.floor(rawData.length * 0.8);
  const trainX = tf.tensor2d(normalizedFeatures.slice(0, splitIndex));
  const trainY = tf.tensor2d(labels.slice(0, splitIndex));
  const valX = tf.tensor2d(normalizedFeatures.slice(splitIndex));
  const valY = tf.tensor2d(labels.slice(splitIndex));

  // 4. Construct TensorFlow.js Neural Network
  console.log('[3/5] Constructing Neural Network Architecture...');
  console.log('      Input: 7 features -> Dense(16, ReLU) -> Dense(8, ReLU) -> Dense(1, Sigmoid)');

  const model = tf.sequential();
  model.add(
    tf.layers.dense({
      inputShape: [7],
      units: 16,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
    })
  );
  model.add(
    tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'glorotUniform',
    })
  );
  model.add(
    tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
      kernelInitializer: 'glorotUniform',
    })
  );

  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy'],
  });

  // 5. Model Training
  console.log('[4/5] Training model (35 epochs, batch size 32)...');
  const history = await model.fit(trainX, trainY, {
    epochs: 35,
    batchSize: 32,
    validationData: [valX, valY],
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if ((epoch + 1) % 7 === 0 || epoch === 34) {
          console.log(
            `      Epoch ${(epoch + 1).toString().padStart(2, ' ')}/35 | Loss: ${logs.loss.toFixed(4)} | Acc: ${(logs.acc * 100).toFixed(1)}% | Val Loss: ${logs.val_loss.toFixed(4)} | Val Acc: ${(logs.val_acc * 100).toFixed(1)}%`
          );
        }
      },
    },
  });

  // 6. Save Model to local filesystem
  console.log('[5/5] Saving model weights and topology to server/ml/model/...');
  await model.save(
    tf.io.withSaveHandler(async (artifacts) => {
      fs.writeFileSync(path.join(modelDir, 'model.json'), JSON.stringify(artifacts.modelTopology, null, 2));
      fs.writeFileSync(path.join(modelDir, 'weights_manifest.json'), JSON.stringify(artifacts.weightSpecs, null, 2));
      fs.writeFileSync(path.join(modelDir, 'weights.bin'), Buffer.from(artifacts.weightData));
      return {
        modelArtifactsInfo: {
          dateSaved: new Date(),
          modelTopologyType: 'JSON',
          weightDataBytes: artifacts.weightData ? artifacts.weightData.byteLength : 0,
        },
      };
    })
  );

  console.log('====================================================');
  console.log('  Model Training Completed Successfully!');
  console.log(`  Artifacts saved in: ${modelDir}`);
  console.log('====================================================');

  // Clean up tensors
  trainX.dispose();
  trainY.dispose();
  valX.dispose();
  valY.dispose();
}

if (require.main === module) {
  trainAndSaveModel().catch((err) => {
    console.error('Fatal error during model training:', err);
    process.exit(1);
  });
}

module.exports = { trainAndSaveModel };
