const { screenshotQueue } = require('../server');
const { captureAndAnalyze } = require('./screenshotWorker');

// Process jobs with concurrency of 2
screenshotQueue.process('capture-and-analyze', 2, async (job) => {
  return await captureAndAnalyze(job);
});

// Event listeners
screenshotQueue.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed for ${job.data.url}`);
});

screenshotQueue.on('failed', (job, err) => {
  console.log(`❌ Job ${job.id} failed: ${err.message}`);
});

screenshotQueue.on('active', (job) => {
  console.log(`🔄 Job ${job.id} started processing ${job.data.url}`);
});

console.log('🔧 Screenshot workers started');

