# Task: Upgrade Existing Site Grabber to Async Processing

## Overview
Convert your existing synchronous website screenshot capture app to async job processing to handle 5-10 second operations gracefully.

## Step 1: Add Async Dependencies

Update your existing `package.json`:
```json
{
  "name": "website-screenshot-capture",
  "version": "1.0.0",
  "description": "A React app to capture screenshots of websites using Puppeteer backend",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "server": "node start-server.js",
    "server:dev": "nodemon start-server.js",
    "server:direct": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "file-saver": "^2.0.5",
    "nodemon": "^3.0.2",
    "puppeteer": "^24.9.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "5.0.1",
    
    // Add these new dependencies:
    "bull": "^4.11.4",
    "ioredis": "^5.3.2",
    "node-vibrant": "^3.2.0",
    "nanoid": "^4.0.2",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0"
  }
}
```

Install new dependencies:
```bash
npm install bull ioredis node-vibrant nanoid helmet morgan
```

## Step 2: Upgrade Your Backend Server

Replace or update your existing `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Bull = require('bull');
const Redis = require('ioredis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Bull queue for screenshot jobs
const screenshotQueue = new Bull('screenshot capture', process.env.REDIS_URL || 'redis://localhost:6379', {
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    redis: redis.status
  });
});

// NEW: Async screenshot endpoint
app.post('/api/screenshot-async', async (req, res) => {
  try {
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
      createdAt: new Date(job.timestamp).toISOString(),
    };
    
    if (jobState === 'completed') {
      response.result = job.returnvalue;
      response.completedAt = new Date(job.finishedOn).toISOString();
      response.processingTime = `${(job.finishedOn - job.processedOn) / 1000}s`;
    }
    
    if (jobState === 'failed') {
      response.error = job.failedReason;
      response.failedAt = new Date(job.failedOn).toISOString();
    }
    
    if (jobState === 'active') {
      response.startedAt = new Date(job.processedOn).toISOString();
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
    const waiting = await screenshotQueue.waiting();
    const active = await screenshotQueue.active();
    const completed = await screenshotQueue.completed();
    const failed = await screenshotQueue.failed();
    
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
    res.status(500).json({ error: error.message });
  }
});

// Keep your existing sync endpoint for backwards compatibility (optional)
app.post('/api/screenshot', async (req, res) => {
  // Your existing synchronous screenshot logic
  // You can keep this for simple use cases
});

// Serve React app
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Screenshot Capture API running on port ${PORT}`);
  console.log(`📊 Queue stats: http://localhost:${PORT}/api/queue/stats`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, screenshotQueue, redis };
```

## Step 3: Create Screenshot Worker

Create `workers/screenshotWorker.js`:

```javascript
const puppeteer = require('puppeteer');
const Vibrant = require('node-vibrant');

const captureAndAnalyze = async (job) => {
  const { url, options } = job.data;
  let browser = null;
  
  try {
    job.progress(5);
    console.log(`📸 Starting capture for: ${url}`);
    
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--memory-pressure-off',
        '--max_old_space_size=460'
      ]
    });
    
    job.progress(15);
    
    const page = await browser.newPage();
    await page.setViewport({ 
      width: options.width || 1920, 
      height: options.height || 1080 
    });
    
    job.progress(25);
    
    console.log(`🌐 Loading page: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    job.progress(40);
    
    // Extract fonts if requested
    let fonts = null;
    if (options.captureFonts) {
      console.log(`🔤 Extracting fonts...`);
      fonts = await page.evaluate(() => {
        const fontSet = new Set();
        const fontDetails = [];
        const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a');
        
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontFamily = style.fontFamily;
          const textContent = el.textContent?.trim();
          
          if (fontFamily && textContent && textContent.length > 0) {
            const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
            
            if (!['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'].includes(primaryFont.toLowerCase())) {
              fontSet.add(primaryFont);
              
              if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
                fontDetails.push({
                  fontFamily: primaryFont,
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  element: el.tagName.toLowerCase(),
                  sampleText: textContent.substring(0, 50)
                });
              }
            }
          }
        });
        
        return {
          unique: Array.from(fontSet),
          detailed: fontDetails.slice(0, 15),
          totalCount: fontSet.size
        };
      });
    }
    
    job.progress(60);
    
    // Take screenshot
    console.log(`📷 Capturing screenshot...`);
    await page.waitForTimeout(2000);
    
    const screenshotOptions = {
      type: 'png',
      fullPage: options.fullPage || false,
    };
    
    if (!options.fullPage) {
      screenshotOptions.clip = { 
        x: 0, 
        y: 0, 
        width: options.width || 1920, 
        height: options.height || 1080 
      };
    }
    
    const screenshot = await page.screenshot(screenshotOptions);
    
    job.progress(80);
    
    // Extract colors if requested
    let colors = null;
    if (options.captureColors) {
      console.log(`🎨 Analyzing colors...`);
      const palette = await Vibrant.from(screenshot).getPalette();
      
      colors = {};
      Object.entries(palette).forEach(([name, color]) => {
        if (color) {
          colors[name] = {
            hex: color.hex,
            rgb: color.rgb,
            hsl: color.hsl,
            population: color.population
          };
        }
      });
      
      colors.dominantColors = Object.values(colors)
        .filter(color => color.population > 0)
        .sort((a, b) => b.population - a.population)
        .slice(0, 8)
        .map(color => color.hex);
    }
    
    job.progress(95);
    
    // Get page metadata
    const metadata = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        favicon: document.querySelector('link[rel*="icon"]')?.href || '',
        viewport: document.querySelector('meta[name="viewport"]')?.content || ''
      };
    });
    
    const result = {
      success: true,
      url,
      screenshot: {
        base64: screenshot.toString('base64'),
        format: 'png',
        size: {
          width: options.width || 1920,
          height: options.fullPage ? 'auto' : (options.height || 1080)
        }
      },
      analysis: {
        colors: colors,
        fonts: fonts,
        metadata: metadata,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - job.timestamp
      },
      options: options
    };
    
    job.progress(100);
    console.log(`✅ Capture completed for: ${url}`);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Capture failed for ${url}:`, error);
    throw new Error(`Capture failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { captureAndAnalyze };
```

## Step 4: Initialize Workers

Create `workers/index.js`:

```javascript
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
```

## Step 5: Update Your Start Script

Update `start-server.js`:

```javascript
// Add workers to your existing server startup
const { screenshotQueue } = require('./server');

// Start workers
if (process.env.NODE_ENV !== 'test') {
  require('./workers');
}

// Your existing server startup code
```

## Step 6: Update React Frontend

Create `src/hooks/useAsyncScreenshot.js`:

```javascript
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? '' // Same domain in production
  : 'http://localhost:5000'; // Dev server

export const useAsyncScreenshot = () => {
  const [jobs, setJobs] = useState({});
  const [polling, setPolling] = useState(new Set());

  const captureScreenshot = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}/api/screenshot-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const jobId = data.jobId;
        
        setJobs(prev => ({
          ...prev,
          [jobId]: data
        }));
        
        setPolling(prev => new Set(prev).add(jobId));
        return jobId;
      }
      
      throw new Error(data.error || 'Failed to start capture');
    } catch (error) {
      console.error('Failed to start screenshot:', error);
      throw error;
    }
  }, []);

  const batchCapture = useCallback(async (urls, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}/api/batch-screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, options })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        data.jobs.forEach(job => {
          setJobs(prev => ({
            ...prev,
            [job.jobId]: job
          }));
          setPolling(prev => new Set(prev).add(job.jobId));
        });
        
        return data.jobs.map(job => job.jobId);
      }
      
      throw new Error(data.error || 'Failed to start batch capture');
    } catch (error) {
      console.error('Failed to start batch capture:', error);
      throw error;
    }
  }, []);

  // Polling effect
  useEffect(() => {
    if (polling.size === 0) return;

    const interval = setInterval(async () => {
      const activeJobs = Array.from(polling);
      
      for (const jobId of activeJobs) {
        try {
          const response = await fetch(`${API_BASE}/api/job/${jobId}`);
          
          if (response.ok) {
            const jobData = await response.json();
            
            setJobs(prev => ({
              ...prev,
              [jobId]: jobData
            }));
            
            if (['completed', 'failed'].includes(jobData.status)) {
              setPolling(prev => {
                const newSet = new Set(prev);
                newSet.delete(jobId);
                return newSet;
              });
            }
          }
        } catch (error) {
          console.error(`Failed to poll job ${jobId}:`, error);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [polling]);

  const getJob = useCallback((jobId) => jobs[jobId], [jobs]);
  
  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => {
      const filtered = {};
      Object.entries(prev).forEach(([jobId, job]) => {
        if (!['completed', 'failed'].includes(job.status)) {
          filtered[jobId] = job;
        }
      });
      return filtered;
    });
  }, []);

  return {
    jobs,
    isPolling: polling.size > 0,
    captureScreenshot,
    batchCapture,
    getJob,
    clearCompletedJobs,
    activeJobs: Object.values(jobs).filter(job => job.status === 'active').length,
    completedJobs: Object.values(jobs).filter(job => job.status === 'completed').length,
  };
};
```

## Step 7: Update Your React Component

Update your existing screenshot component to use async processing:

```jsx
import React, { useState } from 'react';
import { useAsyncScreenshot } from '../hooks/useAsyncScreenshot';

const AsyncScreenshotCapture = () => {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState({
    fullPage: true,
    captureColors: true,
    captureFonts: true,
    width: 1920,
    height: 1080
  });
  
  const { 
    jobs, 
    isPolling, 
    captureScreenshot, 
    batchCapture,
    activeJobs,
    completedJobs 
  } = useAsyncScreenshot();

  const handleSingleCapture = async () => {
    if (!url) return;
    
    try {
      await captureScreenshot(url, options);
    } catch (error) {
      alert(`Failed to start capture: ${error.message}`);
    }
  };

  const handleBatchCapture = async () => {
    const urls = url.split('\n').filter(u => u.trim());
    if (urls.length === 0) return;
    
    try {
      await batchCapture(urls, options);
    } catch (error) {
      alert(`Failed to start batch capture: ${error.message}`);
    }
  };

  return (
    <div className="async-screenshot-capture">
      <div className="capture-form">
        <div className="url-input">
          <label>URL(s) - one per line for batch:</label>
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            rows={5}
          />
        </div>
        
        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={options.fullPage}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                fullPage: e.target.checked
              }))}
            />
            Full Page Screenshot
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.captureColors}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                captureColors: e.target.checked
              }))}
            />
            Extract Color Palette
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.captureFonts}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                captureFonts: e.target.checked
              }))}
            />
            Detect Fonts
          </label>
        </div>
        
        <div className="actions">
          <button 
            onClick={handleSingleCapture}
            disabled={!url || isPolling}
          >
            Capture Screenshot
          </button>
          
          <button 
            onClick={handleBatchCapture}
            disabled={!url || isPolling}
          >
            Batch Capture
          </button>
        </div>
      </div>
      
      <div className="stats">
        <p>Active: {activeJobs} | Completed: {completedJobs}</p>
      </div>
      
      <div className="jobs-list">
        {Object.values(jobs).map(job => (
          <JobProgress key={job.jobId} job={job} />
        ))}
      </div>
    </div>
  );
};

const JobProgress = ({ job }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      case 'active': return '#007bff';
      default: return '#6c757d';
    }
  };

  const downloadScreenshot = () => {
    if (job.result?.screenshot?.base64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${job.result.screenshot.base64}`;
      link.download = `screenshot-${job.data.url.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.click();
    }
  };

  return (
    <div className="job-progress">
      <div className="job-header">
        <span className="job-url">{job.data?.url || job.url}</span>
        <span 
          className="job-status"
          style={{ color: getStatusColor(job.status) }}
        >
          {job.status}
        </span>
      </div>
      
      {job.progress !== undefined && job.status === 'active' && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${job.progress}%`,
              backgroundColor: getStatusColor(job.status)
            }}
          />
        </div>
      )}
      
      {job.status === 'completed' && job.result && (
        <div className="job-results">
          <div className="screenshot-preview">
            <img 
              src={`data:image/png;base64,${job.result.screenshot.base64}`}
              alt="Screenshot"
              style={{ maxWidth: '300px', maxHeight: '200px' }}
            />
            <button onClick={downloadScreenshot}>Download</button>
          </div>
          
          {job.result.analysis?.colors && (
            <div className="colors-preview">
              <h4>Colors:</h4>
              <div className="color-palette">
                {job.result.analysis.colors.dominantColors?.map((color, i) => (
                  <div 
                    key={i}
                    className="color-swatch"
                    style={{ 
                      backgroundColor: color,
                      width: '30px',
                      height: '30px',
                      display: 'inline-block',
                      margin: '2px'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
          
          {job.result.analysis?.fonts && (
            <div className="fonts-preview">
              <h4>Fonts ({job.result.analysis.fonts.totalCount}):</h4>
              <div className="fonts-list">
                {job.result.analysis.fonts.unique?.slice(0, 5).map((font, i) => (
                  <span key={i} className="font-tag">
                    {font}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {job.status === 'failed' && (
        <div className="error-details">
          Error: {job.error}
        </div>
      )}
    </div>
  );
};

export default AsyncScreenshotCapture;
```

## Step 8: Environment Setup

Create `.env` file:
```env
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
```

## Step 9: Railway Deployment

Create `railway.json`:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

Deploy to Railway:
```bash
npm install -g @railway/cli
railway login
railway init
railway add redis
railway up
```

## Expected Outcome

Your existing site grabber will now:
✅ **Handle 5-10 second operations smoothly** with progress bars  
✅ **Support batch processing** for multiple URLs  
✅ **Extract colors and fonts** asynchronously  
✅ **Provide real-time feedback** to users  
✅ **Scale to handle multiple requests** without blocking  
✅ **Deploy easily to Railway** for $5/month  

Users will see progress instead of waiting, and your app can handle multiple screenshot requests simultaneously!