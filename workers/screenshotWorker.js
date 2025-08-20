const puppeteer = require('puppeteer');

// Device presets for mobile emulation
const DEVICE_PRESETS = {
  'iPhone 12': {
    name: 'iPhone 12',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    devicePixelRatio: 3
  },
  'iPhone 12 Pro': {
    name: 'iPhone 12 Pro',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    devicePixelRatio: 3
  },
  'Samsung Galaxy S21': {
    name: 'Samsung Galaxy S21',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    viewport: { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    devicePixelRatio: 3
  },
  'iPad Pro': {
    name: 'iPad Pro',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
    viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false, hasTouch: true },
    devicePixelRatio: 2
  },
  'Google Pixel 5': {
    name: 'Google Pixel 5',
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    viewport: { width: 393, height: 851, deviceScaleFactor: 2.75, isMobile: true, hasTouch: true },
    devicePixelRatio: 2.75
  }
};

const captureAndAnalyze = async (job) => {
  const { url, options } = job.data;
  let browser = null;
  
  try {
    job.progress(5);
    console.log(`📸 Starting capture for: ${url}`);
    console.log(`📱 Capture mode: ${options.captureMode || 'both'}`);
    
    // Launch Puppeteer
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
        '--disable-ipc-flooding-protection'
      ]
    });
    
    job.progress(15);
    
    const page = await browser.newPage();
    
    // Set default desktop viewport and user agent
    const defaultDesktopViewport = { 
      width: options.width || 1920, 
      height: options.height || 1080,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    };
    
    const defaultDesktopUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    await page.setViewport(defaultDesktopViewport);
    await page.setUserAgent(defaultDesktopUserAgent);
    
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
    
    job.progress(25);
    
    console.log(`🌐 Loading page: ${url}`);
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    // Wait longer for Cloudflare challenges
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
      } catch (error) {
        console.log(`⚠️  Cloudflare challenge may still be active, proceeding anyway...`);
      }
    }
    
    job.progress(40);
    
    // Wait for page to be fully loaded
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      console.log(`⚠️  Network idle timeout, proceeding anyway...`);
    }
    
    // Extract fonts if requested
    let desktopFonts = null;
    if (options.captureFonts) {
      console.log(`🔤 Analyzing desktop fonts...`);
      desktopFonts = await page.evaluate(() => {
        const fontSet = new Set();
        const fontDetails = [];
        
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontFamily = style.fontFamily;
          
          if (fontFamily && fontFamily !== 'initial' && fontFamily !== 'inherit') {
            fontSet.add(fontFamily);
            fontDetails.push({
              family: fontFamily,
              element: el.tagName.toLowerCase(),
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              fontStyle: style.fontStyle,
              sampleText: el.textContent?.trim().substring(0, 50) || ''
            });
          }
        });
        
        return {
          uniqueFonts: Array.from(fontSet),
          detailed: fontDetails,
          totalCount: fontSet.size
        };
      });
    }
    
    job.progress(50);
    
    // Capture desktop screenshot
    console.log(`🖥️ Capturing desktop screenshot...`);
    const desktopScreenshotOptions = {
      type: 'png',
      fullPage: options.fullPage || false,
      quality: 90
    };
    
    if (!options.fullPage) {
      desktopScreenshotOptions.clip = { 
        x: 0, 
        y: 0, 
        width: options.width || 1920, 
        height: options.height || 1080 
      };
    }
    
    const desktopScreenshot = await page.screenshot(desktopScreenshotOptions);
    
    // Initialize mobile screenshots array
    const mobileScreenshots = [];
    const mobileFonts = [];
    const mobileColors = [];
    
    // Capture mobile screenshots if requested
    if (options.captureMode === 'mobile' || options.captureMode === 'both') {
      console.log(`📱 Capturing mobile screenshots...`);
      
      // Get selected device or use default mobile devices
      const selectedDevices = options.mobileDevices || ['iPhone 12', 'Samsung Galaxy S21'];
      
      for (const deviceKey of selectedDevices) {
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
        const mobileScreenshotOptions = {
          type: 'png',
          fullPage: options.fullPage || false,
          quality: 90
        };
        
        if (!options.fullPage) {
          mobileScreenshotOptions.clip = { 
            x: 0, 
            y: 0, 
            width: device.viewport.width, 
            height: device.viewport.height 
          };
        }
        
        const mobileScreenshot = await page.screenshot(mobileScreenshotOptions);
        
        // Extract mobile fonts if requested
        let deviceFonts = null;
        if (options.captureFonts) {
          console.log(`🔤 Analyzing fonts for ${device.name}...`);
          deviceFonts = await page.evaluate(() => {
            const fontSet = new Set();
            const fontDetails = [];
            
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
              const style = window.getComputedStyle(el);
              const fontFamily = style.fontFamily;
              
              if (fontFamily && fontFamily !== 'initial' && fontFamily !== 'inherit') {
                fontSet.add(fontFamily);
                fontDetails.push({
                  family: fontFamily,
                  element: el.tagName.toLowerCase(),
                  fontSize: style.fontSize,
                  fontWeight: style.fontWeight,
                  fontStyle: style.fontStyle,
                  sampleText: el.textContent?.trim().substring(0, 50) || ''
                });
              }
            });
            
            return {
              uniqueFonts: Array.from(fontSet),
              detailed: fontDetails,
              totalCount: fontSet.size
            };
          });
        }
        
        // Extract mobile colors if requested
        let deviceColors = null;
        if (options.captureColors) {
          console.log(`🎨 Analyzing colors for ${device.name}...`);
          deviceColors = await page.evaluate(() => {
            const colorSet = new Set();
            const colorDetails = [];
            
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
              const style = window.getComputedStyle(el);
              const properties = ['color', 'backgroundColor', 'borderColor'];
              
              properties.forEach(prop => {
                const value = style[prop];
                if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)' && value !== 'initial' && value !== 'inherit') {
                  colorSet.add(value);
                  colorDetails.push({
                    color: value,
                    element: el.tagName.toLowerCase(),
                    property: prop,
                    sampleText: el.textContent?.trim().substring(0, 30) || ''
                  });
                }
              });
            });
            
            return {
              dominantColors: Array.from(colorSet).slice(0, 8),
              detailed: colorDetails.slice(0, 20),
              totalCount: colorSet.size
            };
          });
        }

        // Analyze mobile screenshot pixels for color distribution
        let devicePixelAnalysis = null;
        if (options.captureColors) {
          console.log(`🔍 Analyzing mobile screenshot pixels for ${device.name}...`);
          devicePixelAnalysis = await analyzeScreenshotPixels(page, mobileScreenshot);
        }
        
        mobileScreenshots.push({
          device: device.name,
          screenshot: mobileScreenshot.toString('base64'),
          viewport: device.viewport,
          userAgent: device.userAgent,
          devicePixelRatio: device.devicePixelRatio,
          fonts: deviceFonts,
          colors: deviceColors,
          pixelAnalysis: devicePixelAnalysis
        });
        
        mobileFonts.push(deviceFonts);
        mobileColors.push(deviceColors);
      }
    }
    
    job.progress(80);
    
    // Extract desktop colors if requested
    let desktopColors = null;
    if (options.captureColors) {
      console.log(`🎨 Analyzing desktop colors...`);
      desktopColors = await page.evaluate(() => {
        const colorSet = new Set();
        const colorDetails = [];
        
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const properties = ['color', 'backgroundColor', 'borderColor'];
          
          properties.forEach(prop => {
            const value = style[prop];
            if (value && value !== 'transparent' && value !== 'rgba(0, 0, 0, 0)' && value !== 'initial' && value !== 'inherit') {
              colorSet.add(value);
              colorDetails.push({
                color: value,
                element: el.tagName.toLowerCase(),
                property: prop,
                sampleText: el.textContent?.trim().substring(0, 30) || ''
              });
            }
          });
        });
        
        return {
          dominantColors: Array.from(colorSet).slice(0, 8),
          detailed: colorDetails.slice(0, 20),
          totalCount: colorSet.size
        };
      });
    }

    // Analyze desktop screenshot pixels for color distribution
    let desktopPixelAnalysis = null;
    if (options.captureColors) {
      console.log(`🔍 Analyzing desktop screenshot pixels...`);
      desktopPixelAnalysis = await analyzeScreenshotPixels(page, desktopScreenshot);
    }
    
    job.progress(95);
    
    // Get page metadata
    const metadata = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        favicon: document.querySelector('link[rel*="icon"]')?.href || '',
        viewport: document.querySelector('meta[name="viewport"]')?.content || '',
        mobileOptimized: document.querySelector('meta[name="MobileOptimized"]')?.content || '',
        handheldFriendly: document.querySelector('meta[name="HandheldFriendly"]')?.content || ''
      };
    });
    
    const result = {
      success: true,
      url,
      captureMode: options.captureMode || 'both',
      screenshots: {
        desktop: {
          base64: desktopScreenshot.toString('base64'),
          format: 'png',
          size: {
            width: options.width || 1920,
            height: options.fullPage ? 'auto' : (options.height || 1080)
          },
          viewport: defaultDesktopViewport,
          userAgent: defaultDesktopUserAgent
        },
        mobile: mobileScreenshots
      },
      analysis: {
        desktop: {
          colors: desktopColors,
          fonts: desktopFonts,
          pixelAnalysis: desktopPixelAnalysis
        },
        mobile: mobileScreenshots.map((device, index) => ({
          device: device.device,
          colors: device.colors,
          fonts: device.fonts,
          pixelAnalysis: device.pixelAnalysis
        })),
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

/**
 * Analyze screenshot pixels to extract color distribution
 */
const analyzeScreenshotPixels = async (page, screenshotBuffer) => {
  try {
    console.log('🔍 Starting pixel analysis...');
    
    // Use Canvas API to analyze pixels
    const pixelData = await page.evaluate((screenshotBase64) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;
          
          // Sample pixels (every 3rd pixel for performance)
          const sampleRate = 3;
          const colorCounts = {};
          const totalPixels = Math.floor(pixels.length / 4 / sampleRate);
          
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
          
          // Calculate percentages and sort by frequency
          const colorArray = Object.values(colorCounts)
            .map(color => ({
              ...color,
              percentage: (color.count / totalPixels) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Top 20 colors
          
          resolve({
            totalPixels,
            colors: colorArray
          });
        };
        
        img.src = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(screenshotBase64)));
      });
    }, Buffer.from(screenshotBuffer));
    
    console.log('✅ Pixel analysis complete:', {
      totalPixels: pixelData?.totalPixels || 0,
      colorCount: pixelData?.colors?.length || 0
    });
    
    return pixelData;
    
  } catch (error) {
    console.error('❌ Pixel analysis failed:', error);
    return null;
  }
};

module.exports = { captureAndAnalyze, DEVICE_PRESETS };
