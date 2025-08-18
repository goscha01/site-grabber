const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const { analyzeSiteDesign } = require('./src/utils/designAnalysis');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Screenshot endpoint
app.post('/api/screenshot', async (req, res) => {
  const { url, width = 1200, height = 800, fullPage = false } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Debug: Log the received parameters
  console.log('📋 Received parameters:', { url, width, height, fullPage, fullPageType: typeof fullPage });

  let browser;
  try {
    console.log(`🚀 Starting screenshot capture of: ${url}`);
    
    // Launch browser with better error handling
    console.log('📱 Launching Puppeteer browser...');
    
    // Check if Puppeteer is available
    if (!puppeteer) {
      throw new Error('Puppeteer library not loaded');
    }
    
    // Log Puppeteer version for debugging
    console.log(`📦 Puppeteer version: ${puppeteer.version || 'unknown'}`);
    
    // Check for compatibility issues
    if (puppeteer.version && parseInt(puppeteer.version.split('.')[0]) >= 24) {
      console.log('✅ Using Puppeteer 24+ - modern API detected');
    }
    
    // Try different launch configurations
    let launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    };
    
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchError) {
      console.log('⚠️ First launch attempt failed, trying alternative config...');
      
      // Try with fewer flags
      launchOptions.args = [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ];
      
      try {
        browser = await puppeteer.launch(launchOptions);
      } catch (secondError) {
        console.error('❌ All launch attempts failed');
        throw new Error(`Browser launch failed: ${launchError.message}. Second attempt: ${secondError.message}`);
      }
    }

    console.log('✅ Browser launched successfully');
    const page = await browser.newPage();
    
    // Set viewport
    console.log(`📐 Setting viewport to ${width}x${height}`);
    await page.setViewport({ width: parseInt(width), height: parseInt(height) });
    
    // Log screenshot mode
    console.log(`📸 Screenshot mode: ${fullPage ? 'Full Page' : 'Viewport Only'}`);
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to URL with timeout
    console.log('🌐 Navigating to URL...');
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    }).catch(err => {
      console.error('❌ Navigation failed:', err);
      throw new Error(`Navigation failed: ${err.message}`);
    });

    console.log('⏳ Waiting for content to load...');
    // Wait a bit for any dynamic content - use setTimeout for compatibility
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    console.log('📸 Taking screenshot...');
    
    // Screenshot options - quality is not supported for PNG in newer versions
    const screenshotOptions = {
      type: 'png',
      fullPage: Boolean(fullPage) // Ensure boolean conversion
    };
    
    // Debug: Log screenshot options
    console.log('📸 Screenshot options:', screenshotOptions);
    
    // Only add quality for JPEG (not PNG)
    if (screenshotOptions.type === 'jpeg') {
      screenshotOptions.quality = 100;
    }
    
    const screenshot = await page.screenshot(screenshotOptions).catch(err => {
      console.error('❌ Screenshot capture failed:', err);
      throw new Error(`Screenshot capture failed: ${err.message}`);
    });

    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="screenshot_${Date.now()}.png"`);
    
    // Send screenshot
    res.send(screenshot);
    
    console.log(`✅ Screenshot captured successfully for: ${url}`);
    
    // Complete design analysis before closing browser
    console.log(`🎨 Starting design analysis for: ${url}`);
    try {
      const result = await analyzeSiteDesign(url, page);
      if (result.success) {
        analysisResults.set(url, result);
        console.log(`✅ Design analysis completed and stored for: ${url}`);
      }
    } catch (err) {
      console.error('❌ Design analysis failed:', err);
    }
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    console.error('Error stack:', error.stack);
    
    // Send detailed error response
    res.status(500).json({ 
      error: 'Failed to capture screenshot',
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
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

// Store analysis results in memory (in production, use Redis or database)
const analysisResults = new Map();

// Design analysis endpoint
app.post('/api/analyze-design', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  console.log(`🎨 Starting design analysis for: ${url}`);
  
  try {
    const analysisResult = await analyzeSiteDesign(url);
    
    if (analysisResult.success) {
      // Store the result
      analysisResults.set(url, analysisResult);
      res.json(analysisResult);
    } else {
      res.status(500).json({ error: analysisResult.error });
    }
  } catch (error) {
    console.error('❌ Design analysis failed:', error);
    res.status(500).json({ 
      error: 'Failed to analyze design',
      details: error.message 
    });
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Screenshot server is running',
    timestamp: new Date().toISOString(),
    puppeteer: puppeteer.version || 'unknown'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is responding',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Test screenshot endpoint with hardcoded fullPage
app.post('/api/test-screenshot', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  let browser;
  try {
    console.log(`🧪 Test screenshot with FORCED fullPage=true for: ${url}`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Force fullPage to true for testing
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: true // Force this to true
    });
    
    res.setHeader('Content-Type', 'image/png');
    res.send(screenshot);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Screenshot server running on port ${PORT}`);
  console.log(`📸 Screenshot endpoint: http://localhost:${PORT}/api/screenshot`);
});
