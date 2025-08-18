const puppeteer = require('puppeteer');

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
    
    job.progress(15);
    
    const page = await browser.newPage();
    
    // Set realistic user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ 
      width: options.width || 1920, 
      height: options.height || 1080 
    });
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
    // Extract colors if requested (CSS-based approach)
    let colors = null;
    if (options.captureColors) {
      console.log(`🎨 Analyzing colors...`);
      colors = await page.evaluate(() => {
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
