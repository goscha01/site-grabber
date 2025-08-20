// Load environment variables
require('dotenv').config();

console.log('🔧 === SERVER STARTUP DEBUG ===');
console.log('🔧 Current working directory:', process.cwd());
console.log('🔧 Node version:', process.version);
console.log('🔧 Platform:', process.platform);
console.log('🔧 Architecture:', process.arch);
console.log('🔧 Environment variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - PWD:', process.env.PWD);
console.log('  - HOME:', process.env.HOME);
console.log('🔧 === END DEBUG ===');

// Check available modules
console.log('🔧 === MODULE AVAILABILITY CHECK ===');
try {
  require('express');
  console.log('✅ express: available');
} catch (e) {
  console.log('❌ express: NOT available');
}

try {
  require('cors');
  console.log('✅ cors: available');
} catch (e) {
  console.log('❌ cors: NOT available');
}

try {
  require('puppeteer');
  console.log('✅ puppeteer: available');
} catch (e) {
  console.log('❌ puppeteer: NOT available');
}

console.log('🔧 === END MODULE CHECK ===');

const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
// const helmet = require('helmet'); // Removed for Railway compatibility
// const morgan = require('morgan'); // Removed for Railway compatibility

console.log('✅ All modules loaded successfully');

const { analyzeSiteDesign } = require('./src/utils/designAnalysis');

const app = express();
const PORT = process.env.PORT || 5000;
console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`🔌 Port type: ${typeof PORT}`);
console.log(`🔌 Port parsed: ${parseInt(PORT)}`);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Server readiness flag (must be declared before routes)
let serverReady = false;

// Function to check if server is properly initialized
const isServerReady = () => {
  try {
    // Check if server exists
    if (!server) {
      return false;
    }
    
    // Check if server is listening
    if (!server.listening) {
      return false;
    }
    
    // Check if port is bound (but don't fail if address() returns null during startup)
    try {
      const addr = server.address();
      if (addr && addr.port !== PORT) {
        return false;
      }
    } catch (addrError) {
      // Address might not be available immediately, that's okay
      console.log('ℹ️  Server address not yet available, continuing...');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Server readiness check failed:', error);
    return false;
  }
};

// Simple in-memory queue system (temporary replacement for Redis/Bull)
console.log('🔧 Using in-memory queue system');

class SimpleQueue {
  constructor() {
    this.jobs = new Map();
    this.nextJobId = 1;
    this.processing = false;
  }

  add(type, data, options = {}) {
    const jobId = this.nextJobId++;
    
    // Create job object with methods to match Bull interface
    const job = {
      id: jobId,
      type,
      data,
      status: 'waiting',
      createdAt: Date.now(),
      _progress: 0,
      result: null,
      error: null,
      
      // Progress method to match Bull interface
      progress: function() {
        return this._progress;
      },
      
      // Set progress method
      setProgress: function(value) {
        this._progress = value;
      },
      
      // Get state method to match Bull interface
      getState: function() {
        return this.status;
      }
    };
    
    this.jobs.set(jobId, job);
    
    // Process job immediately if not already processing
    if (!this.processing) {
      this.processNextJob();
    }
    
    return job;
  }

  async processNextJob() {
    if (this.processing) return;
    
    this.processing = true;
    
    // Find next waiting job
    const waitingJob = Array.from(this.jobs.values()).find(job => job.status === 'waiting');
    
    if (waitingJob) {
      try {
        waitingJob.status = 'active';
        waitingJob.startedAt = Date.now();
        waitingJob.setProgress(25);
        
        // Import worker function
        const { captureAndAnalyze } = require('./workers/screenshotWorker');
        
        // Update progress
        waitingJob.setProgress(50);
        
        // Process the job
        const result = await captureAndAnalyze(waitingJob);
        
        waitingJob.status = 'completed';
        waitingJob.result = result;
        waitingJob.completedAt = Date.now();
        waitingJob.finishedOn = Date.now();
        waitingJob.processedOn = Date.now();
        waitingJob.setProgress(100);
        
        console.log(`✅ Job ${waitingJob.id} completed for ${waitingJob.data.url}`);
        
      } catch (error) {
        waitingJob.status = 'failed';
        waitingJob.error = error.message;
        waitingJob.failedAt = Date.now();
        waitingJob.failedOn = Date.now();
        waitingJob.failedReason = error.message;
        
        console.log(`❌ Job ${waitingJob.id} failed: ${error.message}`);
      }
    }
    
    this.processing = false;
    
    // Check if there are more jobs to process
    if (Array.from(this.jobs.values()).some(job => job.status === 'waiting')) {
      this.processNextJob();
    }
  }

  getJob(jobId) {
    // Convert jobId to number if it's a string
    const id = parseInt(jobId, 10);
    return this.jobs.get(id);
  }

  getWaiting() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'waiting');
  }

  getActive() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'active');
  }

  getCompleted() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'completed');
  }

  getFailed() {
    return Array.from(this.jobs.values()).filter(job => job.status === 'failed');
  }

  // Add progress method to match Bull queue interface
  progress() {
    return this.progress || 0;
  }
}

const screenshotQueue = new SimpleQueue();
console.log('🔧 In-memory screenshot queue started');



// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Store analysis results in memory (in production, use Redis or database)
const analysisResults = new Map();

// Simple root endpoint for basic health check
app.get('/', (req, res) => {
  console.log('🏠 === ROOT ENDPOINT CALLED ===');
  console.log('🏠 Time:', new Date().toISOString());
  console.log('🏠 Server ready:', serverReady);
  console.log('🏠 === END ROOT ===');
  
  if (!serverReady) {
    return res.status(503).json({
      status: 'starting',
      message: 'Server is starting up...',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Simple health check endpoint (always responds, no dependencies)
app.get('/health', (req, res) => {
  console.log('❤️  === SIMPLE HEALTH CHECK ===');
  console.log('❤️  Time:', new Date().toISOString());
  console.log('❤️  === END HEALTH ===');
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simple health check responding',
    uptime: process.uptime()
  });
});

// Simple test endpoint (always responds, no server readiness check)
app.get('/api/test', (req, res) => {
  console.log('🧪 === TEST ENDPOINT CALLED ===');
  console.log('🧪 Time:', new Date().toISOString());
  console.log('🧪 Server ready flag:', serverReady);
  console.log('🧪 === END TEST ===');
  
  res.status(200).json({
    status: 'test-ok',
    timestamp: new Date().toISOString(),
    message: 'Test endpoint responding',
    serverReady: serverReady,
    uptime: process.uptime()
  });
});

// Simple ping endpoint (always available)
app.get('/api/ping', (req, res) => {
  try {
    const timestamp = new Date().toISOString();
    console.log(`🏓 === PING REQUEST RECEIVED ===`);
    console.log(`🏓 Time: ${timestamp}`);
    console.log(`🏓 Request IP: ${req.ip}`);
    console.log(`🏓 Request headers:`, req.headers);
    console.log(`🏓 Request method: ${req.method}`);
    console.log(`🏓 Request URL: ${req.url}`);
    console.log(`🏓 Server ready: ${serverReady}`);
    console.log(`🏓 Server listening: ${server ? server.listening : 'NO SERVER'}`);
    console.log(`🏓 === END PING REQUEST ===`);
    
    res.status(200).json({
      status: 'pong',
      timestamp: timestamp,
      message: 'Server is responding',
      port: PORT,
      environment: NODE_ENV,
      uptime: process.uptime(),
      ready: true,
      serverListening: server ? server.listening : false,
      serverAddress: server ? server.address() : null
    });
  } catch (error) {
    console.error('❌ === ERROR IN PING ENDPOINT ===');
    console.error('❌ Error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ === END ERROR ===');
    
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Server error in ping endpoint',
      error: error.message,
      stack: error.stack
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    queue: 'in-memory',
    port: PORT,
    environment: NODE_ENV,
    uptime: process.uptime()
  });
});

// Simple queue status endpoint
app.get('/api/queue/status', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    queue: 'in-memory screenshot capture',
    jobs: screenshotQueue.jobs.size
  });
});

// Startup endpoint for Railway (always available)
app.get('/api/startup', (req, res) => {
  const uptime = process.uptime();
  const isStarting = uptime < 10;
  
  res.json({
    status: isStarting ? 'starting' : 'ready',
    timestamp: new Date().toISOString(),
    message: isStarting ? 'Server is starting up...' : 'Server is ready',
    port: PORT,
    environment: NODE_ENV,
    uptime: uptime,
    ready: !isStarting
  });
});

// Railway-specific health check endpoint
app.get('/api/railway-health', (req, res) => {
  // Always respond to Railway health checks, even during startup
  const uptime = process.uptime();
  const isStarting = uptime < 10; // Consider starting if less than 10 seconds
  
  if (isStarting) {
    return res.status(503).json({
      status: 'starting',
      timestamp: new Date().toISOString(),
      message: 'Server is starting up...',
      port: PORT,
      environment: NODE_ENV,
      uptime: uptime,
      ready: false
    });
  }
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Railway health check passed',
    port: PORT,
    environment: NODE_ENV,
    uptime: uptime,
    memory: process.memoryUsage(),
    queue: 'in-memory',
    ready: true
  });
});

// NEW: Async screenshot endpoint
app.post('/api/screenshot-async', async (req, res) => {
  try {
    // Check if queue is ready
    if (!screenshotQueue) {
      return res.status(503).json({ 
        error: 'Queue not ready',
        details: 'Redis connection or queue initialization in progress. Please try again in a few seconds.'
      });
    }

    const { url, options = {} } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Add job to queue
    const job = await screenshotQueue.add('capture-and-analyze', { 
      url, 
      options: {
        fullPage: options.fullPage || true,
        captureColors: options.captureColors !== false,
        captureFonts: options.captureFonts !== false,
        ...options
      }
    });
    
    res.status(200).json({
      success: true,
      jobId: job.id,
      status: 'queued',
      estimatedTime: '10-20 seconds',
      statusEndpoint: `/api/job/${job.id}`,
      url: url
    });
    
  } catch (error) {
    console.error('Error creating screenshot job:', error);
    res.status(500).json({ 
      error: 'Failed to start screenshot capture',
      details: error.message 
    });
  }
});

// Job status endpoint
app.get('/api/job/:jobId', async (req, res) => {
  try {
    // Check if queue is ready
    if (!screenshotQueue) {
      return res.status(503).json({ 
        error: 'Queue not ready',
        details: 'Redis connection or queue initialization in progress. Please try again in a few seconds.'
      });
    }

    const { jobId } = req.params;
    const job = await screenshotQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const jobState = await job.getState();
    
    let response = {
      jobId: job.id,
      status: jobState,
      data: job.data,
      progress: job.progress(),
      createdAt: new Date(job.createdAt).toISOString(),
    };
    
    if (jobState === 'completed') {
      response.result = job.result;
      response.completedAt = new Date(job.completedAt).toISOString();
      if (job.processedOn && job.finishedOn) {
        response.processingTime = `${(job.finishedOn - job.processedOn) / 1000}s`;
      }
    }
    
    if (jobState === 'failed') {
      response.error = job.error;
      response.failedAt = new Date(job.failedAt).toISOString();
    }
    
    if (jobState === 'active') {
      response.startedAt = new Date(job.startedAt).toISOString();
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ 
      error: 'Failed to get job status',
      details: error.message 
    });
  }
});

// Batch screenshot endpoint
app.post('/api/batch-screenshot', async (req, res) => {
  try {
    // Check if queue is ready
    if (!screenshotQueue) {
      return res.status(503).json({ 
        error: 'Queue not ready',
        details: 'Redis connection or queue initialization in progress. Please try again in a few seconds.'
      });
    }

    const { urls, options = {} } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }
    
    if (urls.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 URLs allowed per batch' });
    }
    
    // Validate all URLs
    const invalidUrls = [];
    urls.forEach((url, index) => {
      try {
        new URL(url);
      } catch {
        invalidUrls.push({ index, url });
      }
    });
    
    if (invalidUrls.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid URLs found',
        invalidUrls 
      });
    }
    
    // Create jobs for all URLs
    const jobs = await Promise.all(
      urls.map((url, index) => 
        screenshotQueue.add('capture-and-analyze', { 
          url, 
          options 
        }, {
          delay: index * 2000, // Stagger jobs by 2 seconds
        })
      )
    );
    
    const batchId = `batch-${Date.now()}`;
    
    res.status(200).json({
      success: true,
      batchId,
      jobs: jobs.map((job, index) => ({
        jobId: job.id,
        url: urls[index],
        status: 'queued',
        statusEndpoint: `/api/job/${job.id}`
      })),
      totalJobs: jobs.length,
      estimatedTime: `${urls.length * 15}-${urls.length * 25} seconds`
    });
    
  } catch (error) {
    console.error('Batch screenshot error:', error);
    res.status(500).json({ 
      error: 'Failed to create batch screenshot job',
      details: error.message 
    });
  }
});

// Queue statistics
app.get('/api/queue/stats', async (req, res) => {
  try {
    // Check if queue is initialized
    if (!screenshotQueue) {
      return res.status(503).json({ 
        error: 'Queue not ready',
        details: 'Redis connection or queue initialization in progress'
      });
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Queue stats timeout')), 5000);
    });

    const statsPromise = Promise.all([
      screenshotQueue.getWaiting(),
      screenshotQueue.getActive(),
      screenshotQueue.getCompleted(),
      screenshotQueue.getFailed()
    ]);

    const [waiting, active, completed, failed] = await Promise.race([
      statsPromise,
      timeoutPromise
    ]);
    
    res.json({
      queue: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      }
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get queue stats',
      details: error.message 
    });
  }
});

// Screenshot endpoint (existing functionality - keep for backwards compatibility)
app.post('/api/screenshot', async (req, res) => {
  const { 
    url, 
    width = 1200, 
    height = 800, 
    fullPage = false,
    captureMode = 'both',
    mobileDevices = ['iPhone 12', 'Samsung Galaxy S21'],
    captureFonts = true,
    captureColors = true
  } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  let browser = null;
  
  try {
    console.log(`📸 Starting screenshot capture for: ${url}`);
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--memory-pressure-off',
        '--max_old_space_size=460',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-popup-blocking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width, height });
    
    // Set additional headers to look more human
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      delete navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait a bit longer for Cloudflare challenges
    console.log(`⏳ Waiting for page to fully load...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if there's a Cloudflare challenge
    const cloudflareCheck = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('checking your browser') || 
             bodyText.includes('verify you are human') ||
             bodyText.includes('cloudflare') ||
             bodyText.includes('captcha');
    });
    
    if (cloudflareCheck) {
      console.log(`⚠️  Cloudflare challenge detected, waiting longer...`);
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      // Try to wait for the challenge to complete
      try {
        await page.waitForFunction(() => {
          const bodyText = document.body.innerText.toLowerCase();
          return !bodyText.includes('checking your browser') && 
                 !bodyText.includes('verify you are human') &&
                 !bodyText.includes('cloudflare') &&
                 !bodyText.includes('captcha');
        }, { timeout: 30000 });
        console.log(`✅ Cloudflare challenge completed`);
      } catch (waitError) {
        console.log(`⚠️  Still waiting for challenge, proceeding anyway...`);
      }
    }
    
    // Wait for network to be idle
    try {
      await page.waitForFunction(() => {
        return document.readyState === 'complete';
      }, { timeout: 10000 });
      console.log(`✅ Page fully loaded`);
    } catch (readyError) {
      console.log(`⚠️  Page ready state timeout, proceeding...`);
    }
    
    // Capture desktop screenshot
    console.log(`📱 Capturing desktop screenshot...`);
    const desktopScreenshot = await page.screenshot({
      type: 'png',
      fullPage: fullPage
    });
    
    // Initialize mobile screenshots array
    const mobileScreenshots = [];
    
    // Capture mobile screenshots if requested
    if (captureMode === 'mobile' || captureMode === 'both') {
      console.log(`📱 Capturing mobile screenshots...`);
      
      // Device presets for mobile emulation
      const DEVICE_PRESETS = {
        'iPhone 12': {
          name: 'iPhone 12',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
          viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
        },
        'Samsung Galaxy S21': {
          name: 'Samsung Galaxy S21',
          userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
          viewport: { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
        }
      };
      
      for (const deviceKey of mobileDevices) {
        const device = DEVICE_PRESETS[deviceKey];
        if (!device) {
          console.log(`⚠️  Unknown device: ${deviceKey}, skipping...`);
          continue;
        }
        
        console.log(`📱 Emulating ${device.name}...`);
        
        // Emulate the device
        await page.emulate(device);
        
        // Wait for mobile layout to adjust
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for mobile-specific redirects
        const currentUrl = page.url();
        if (currentUrl !== url) {
          console.log(`🔄 Mobile redirect detected: ${currentUrl}`);
        }
        
        // Wait for mobile-specific elements to load
        try {
          await page.waitForFunction(() => {
            return document.readyState === 'complete';
          }, { timeout: 10000 });
        } catch (error) {
          console.log(`⚠️  Mobile page load timeout for ${device.name}, proceeding...`);
        }
        
        // Capture mobile screenshot
        const mobileScreenshot = await page.screenshot({
          type: 'png',
          fullPage: fullPage
        });
        
        mobileScreenshots.push({
          device: device.name,
          screenshot: mobileScreenshot.toString('base64'),
          viewport: device.viewport,
          userAgent: device.userAgent
        });
      }
    }
    
    // Add pixel analysis for desktop screenshot FIRST (before design analysis)
    let desktopPixelAnalysis = null;
    if (captureColors) {
      try {
        console.log(`🔍 Analyzing desktop screenshot pixels...`);
        console.log(`🔍 Screenshot type:`, typeof desktopScreenshot);
        console.log(`🔍 Screenshot length:`, desktopScreenshot?.length || 'undefined');
        console.log(`🔍 Page object available:`, !!page);
        
        desktopPixelAnalysis = await analyzeScreenshotPixels(page, desktopScreenshot);
        console.log(`✅ Desktop pixel analysis completed:`, {
          totalPixels: desktopPixelAnalysis?.totalPixels || 0,
          colorCount: desktopPixelAnalysis?.colors?.length || 0
        });
      } catch (err) {
        console.error('❌ Desktop pixel analysis failed:', err);
        console.error('❌ Error details:', err.message);
        console.error('❌ Error stack:', err.stack);
      }
    } else {
      console.log(`⚠️  Pixel analysis skipped - captureColors is ${captureColors}`);
    }

    // Add pixel analysis for mobile screenshots
    const mobilePixelAnalysis = [];
    if (captureColors && mobileScreenshots.length > 0) {
      for (let i = 0; i < mobileScreenshots.length; i++) {
        try {
          console.log(`🔍 Analyzing mobile screenshot pixels for device ${i + 1}...`);
          // Reset to desktop viewport first
          await page.setViewport({ width, height });
          await page.emulate({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width, height, deviceScaleFactor: 1, isMobile: false, hasTouch: false }
          });
          
          // Emulate the mobile device again
          const deviceKey = mobileDevices[i];
          const DEVICE_PRESETS = {
            'iPhone 12': {
              name: 'iPhone 12',
              userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
              viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
            },
            'Samsung Galaxy S21': {
              name: 'Samsung Galaxy S21',
              userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
              viewport: { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
            }
          };
          
          const device = DEVICE_PRESETS[deviceKey];
          if (device) {
            await page.emulate(device);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const mobileScreenshot = await page.screenshot({
              type: 'png',
              fullPage: fullPage
            });
            
            const pixelAnalysis = await analyzeScreenshotPixels(page, mobileScreenshot);
            mobilePixelAnalysis.push(pixelAnalysis);
            console.log(`✅ Mobile pixel analysis completed for device ${i + 1}:`, {
              totalPixels: pixelAnalysis?.totalPixels || 0,
              colorCount: pixelAnalysis?.colors?.length || 0
            });
          }
        } catch (err) {
          console.error(`❌ Mobile pixel analysis failed for device ${i + 1}:`, err);
          mobilePixelAnalysis.push(null);
        }
      }
    }

    // Complete design analysis AFTER pixel analysis
    console.log(`🎨 Starting design analysis for: ${url}`);
    let designAnalysis = null;
    try {
      const result = await analyzeSiteDesign(url, page); // Pass page
      if (result.success) {
        designAnalysis = result.analysis; // This is correct - result.analysis contains {colors, fonts, timestamp}
        
        // Add pixel analysis to the design analysis
        if (designAnalysis && designAnalysis.colors) {
          designAnalysis.colors.pixelAnalysis = desktopPixelAnalysis;
          designAnalysis.colors.mobilePixelAnalysis = mobilePixelAnalysis;
          console.log(`✅ Pixel analysis added to design analysis:`, {
            desktop: !!desktopPixelAnalysis,
            mobile: mobilePixelAnalysis.length,
            totalMobileColors: mobilePixelAnalysis.reduce((sum, analysis) => sum + (analysis?.colors?.length || 0), 0)
          });
        }
        
        analysisResults.set(url, result);
        console.log(`✅ Design analysis completed for: ${url}`);
      }
    } catch (err) {
      console.error('❌ Design analysis failed:', err);
    }
    
    // Convert screenshots to base64 for JSON response
    const base64DesktopScreenshot = desktopScreenshot.toString('base64');
    
    res.json({
      success: true,
      screenshots: {
        desktop: {
          base64: base64DesktopScreenshot,
          format: 'png',
          size: {
            width: width,
            height: fullPage ? 'auto' : height
          },
          viewport: { width, height, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        mobile: mobileScreenshots
      },
      url: url,
      timestamp: new Date().toISOString(),
      designAnalysis: designAnalysis,
      captureMode: captureMode,
      mobileDevices: mobileDevices
    });
    
    console.log(`✅ Screenshot captured successfully for: ${url}`);
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Screenshot capture failed',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      try {
        console.log('🧹 Closing browser...');
        await browser.close();
        console.log('✅ Browser closed successfully');
      } catch (closeError) {
        console.error('❌ Error closing browser:', closeError);
      }
    }
  }
});

// Get analysis results endpoint
app.get('/api/analysis-results/:url', (req, res) => {
  const url = decodeURIComponent(req.params.url);
  const result = analysisResults.get(url);
  
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Analysis results not found' });
  }
});

// Serve React app for any route not handled by API (must be last)
app.get('*', (req, res) => {
  if (!serverReady) {
    return res.status(503).json({
      status: 'starting',
      message: 'Server is starting up...',
      timestamp: new Date().toISOString()
    });
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

/**
 * Analyze screenshot pixels to extract color distribution
 */
const analyzeScreenshotPixels = async (page, screenshotBuffer) => {
  try {
    console.log('🔍 Starting pixel analysis...');
    console.log('🔍 Screenshot buffer type:', typeof screenshotBuffer);
    console.log('🔍 Screenshot buffer length:', screenshotBuffer?.length || 'undefined');
    
    // Convert screenshot buffer to base64 first
    const screenshotBase64 = screenshotBuffer.toString('base64');
    console.log('🔍 Screenshot converted to base64, length:', screenshotBase64.length);
    
    // Use Canvas API to analyze pixels
    const pixelData = await page.evaluate((base64String) => {
      console.log('🔍 Inside page.evaluate, starting pixel analysis...');
      console.log('🔍 Base64 string length:', base64String.length);
      
      return new Promise((resolve, reject) => {
        try {
          const img = new Image();
          
          img.onload = () => {
            try {
              console.log('🔍 Image loaded, dimensions:', img.width, 'x', img.height);
              
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) {
                console.error('❌ Could not get canvas context');
                reject(new Error('Canvas context not available'));
                return;
              }
              
              canvas.width = img.width;
              canvas.height = img.height;
              
              console.log('🔍 Canvas created, drawing image...');
              ctx.drawImage(img, 0, 0);
              
              console.log('🔍 Getting image data...');
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const pixels = imageData.data;
              
              console.log('🔍 Image data obtained, pixels length:', pixels.length);
              
              // Sample pixels (every 3rd pixel for performance)
              const sampleRate = 3;
              const colorCounts = {};
              const totalPixels = Math.floor(pixels.length / 4 / sampleRate);
              
              console.log('🔍 Starting pixel sampling, total pixels to sample:', totalPixels);
              
              for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                
                // Skip transparent pixels
                if (a < 128) continue;
                
                // Group similar colors (within ±5 RGB units for more precise grouping)
                const colorKey = `${Math.floor(r/5)*5},${Math.floor(g/5)*5},${Math.floor(b/5)*5}`;
                
                if (!colorCounts[colorKey]) {
                  colorCounts[colorKey] = {
                    r: Math.floor(r/5)*5,
                    g: Math.floor(g/5)*5,
                    b: Math.floor(b/5)*5,
                    count: 0,
                    percentage: 0
                  };
                }
                
                colorCounts[colorKey].count++;
              }
              
              console.log('🔍 Pixel sampling complete, unique colors found:', Object.keys(colorCounts).length);
              
              // Calculate percentages and sort by frequency
              const colorArray = Object.values(colorCounts)
                .map(color => ({
                  ...color,
                  percentage: (color.count / totalPixels) * 100
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 20); // Top 20 colors
              
              console.log('🔍 Color analysis complete, top colors:', colorArray.slice(0, 3).map(c => `${c.r},${c.g},${c.b} (${c.percentage.toFixed(1)}%)`));
              
              resolve({
                totalPixels,
                colors: colorArray
              });
            } catch (canvasError) {
              console.error('❌ Canvas processing error:', canvasError);
              reject(canvasError);
            }
          };
          
          img.onerror = (error) => {
            console.error('❌ Image loading error:', error);
            console.error('❌ Image error details:', error);
            reject(new Error('Failed to load image'));
          };
          
          console.log('🔍 Setting image source...');
          img.src = 'data:image/png;base64,' + base64String;
          
        } catch (setupError) {
          console.error('❌ Setup error:', setupError);
          reject(setupError);
        }
      });
    }, screenshotBase64);
    
    console.log('✅ Pixel analysis complete:', {
      totalPixels: pixelData?.totalPixels || 0,
      colorCount: pixelData?.colors?.length || 0
    });
    
    return pixelData;
    
  } catch (error) {
    console.error('❌ Pixel analysis failed:', error);
    console.error('❌ Error stack:', error.stack);
    return null;
  }
};



// Server readiness flag (already declared above)

// Start server
console.log('🚀 === STARTING SERVER ===');
console.log(`🚀 Attempting to bind to port ${PORT}`);
console.log(`🚀 Binding to address: 0.0.0.0`);
console.log(`🚀 Current time: ${new Date().toISOString()}`);

const server = app.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ === SERVER STARTUP FAILED ===');
    console.error('❌ Error details:', err);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ === END ERROR ===');
    process.exit(1);
  }
  
  console.log('✅ === SERVER STARTUP SUCCESS ===');
  console.log(`✅ Server successfully bound to port ${PORT}`);
  console.log(`✅ Server address:`, server.address());
  console.log(`✅ Server listening:`, server.listening);
  console.log(`✅ Server maxConnections:`, server.maxConnections);
  console.log(`✅ === END SUCCESS ===`);
  
  console.log(`🚀 Web Capture API running on port ${PORT}`);
  console.log(`📊 Queue stats: http://localhost:${PORT}/api/queue/stats`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Server bound to 0.0.0.0:${PORT}`);
  console.log(`🔧 Railway health: http://localhost:${PORT}/api/railway-health`);
  console.log(`🚀 Startup endpoint: http://localhost:${PORT}/api/startup`);
  console.log(`🏓 Ping endpoint: http://localhost:${PORT}/api/ping`);
  
  // Mark server as ready immediately for health checks
  serverReady = true;
  console.log('✅ Server is now ready to accept requests');
  console.log('✅ Health check endpoints are now responding');
  console.log(`✅ Server ready at: ${new Date().toISOString()}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ === SERVER ERROR EVENT ===');
  console.error('❌ Error details:', err);
  console.error('❌ Error code:', err.code);
  console.error('❌ Error message:', err.message);
  console.error('❌ Error stack:', err.stack);
  console.error('❌ Server state:', {
    listening: server.listening,
    address: server.address(),
    maxConnections: server.maxConnections
  });
  console.error('❌ === END SERVER ERROR ===');
  
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else if (err.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${PORT}`);
  } else if (err.code === 'EADDRNOTAVAIL') {
    console.error(`❌ Address not available for binding`);
  }
  console.error('❌ Server startup failed, exiting...');
  process.exit(1);
});

// Handle server listening event
server.on('listening', () => {
  const addr = server.address();
  console.log('🎯 === SERVER LISTENING EVENT ===');
  console.log(`🎯 Server listening on ${addr.address}:${addr.port}`);
  console.log(`🎯 Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`🎯 Server state:`, {
    listening: server.listening,
    address: addr,
    maxConnections: server.maxConnections
  });
  console.log('🎯 === END LISTENING EVENT ===');
});

// Process exit handlers for debugging
process.on('exit', (code) => {
  console.log('🔄 === PROCESS EXIT ===');
  console.log(`🔄 Exit code: ${code}`);
  console.log(`🔄 Time: ${new Date().toISOString()}`);
  console.log('🔄 === END EXIT ===');
});

process.on('uncaughtException', (error) => {
  console.error('💥 === UNCAUGHT EXCEPTION ===');
  console.error('💥 Error:', error);
  console.error('💥 Error message:', error.message);
  console.error('💥 Error stack:', error.stack);
  console.error('💥 Time:', new Date().toISOString());
  console.error('💥 === END UNCAUGHT EXCEPTION ===');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 === UNHANDLED REJECTION ===');
  console.error('💥 Reason:', reason);
  console.error('💥 Promise:', promise);
  console.error('💥 Time:', new Date().toISOString());
  console.error('💥 === END UNHANDLED REJECTION ===');
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, screenshotQueue };
