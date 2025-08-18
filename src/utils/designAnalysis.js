// Removed axios since we're not using Picsart API anymore

/**
 * Analyzes a website for colors and fonts using Puppeteer and Picsart API
 * @param {string} url - Website URL to analyze
 * @param {object} puppeteerPage - Existing Puppeteer page instance (optional)
 * @returns {object} Analysis results with colors and fonts
 */
const analyzeSiteDesign = async (url, existingPage = null) => {
  let browser, page;
  let shouldCloseBrowser = false;
  
  try {
    if (existingPage) {
      page = existingPage;
      console.log('✅ Using existing page for design analysis');
    } else {
      console.log('🚀 Launching new browser for design analysis');
      browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
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
      
      page = await browser.newPage();
      shouldCloseBrowser = true;
      
      // Set realistic user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
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
    }
    
    // Extract fonts from the page
    const fonts = await extractFonts(page);
    
    // Extract colors using CSS analysis
    const colors = await extractColorsWithPicsart(page);
    
    return {
      success: true,
      url: url,
      analysis: {
        colors: colors,
        fonts: fonts,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Design analysis error:', error);
    return {
      success: false,
      error: error.message,
      url: url
    };
  } finally {
    if (shouldCloseBrowser && browser) {
      await browser.close();
    }
  }
};

/**
 * Extracts font information from the page
 */
const extractFonts = async (page) => {
  try {
    const fontData = await page.evaluate(() => {
      const fontData = {
        unique: new Set(),
        detailed: [],
        totalCount: 0
      };
      
      // Get all text elements with more specific selectors
      const textSelectors = 'h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea, label, li, td, th';
      const textElements = document.querySelectorAll(textSelectors);
      
      textElements.forEach(el => {
        try {
          const computedStyle = window.getComputedStyle(el);
          const fontFamily = computedStyle.fontFamily;
          const fontSize = computedStyle.fontSize;
          const fontWeight = computedStyle.fontWeight;
          const color = computedStyle.color;
          const textContent = el.textContent?.trim();
          
          if (fontFamily && textContent && textContent.length > 0) {
            // Clean up font family - get the first font
            const primaryFont = fontFamily
              .split(',')[0]
              .trim()
              .replace(/['"]/g, '');
            
            // Skip system/generic fonts
            const systemFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'inherit', 'initial', 'unset'];
            if (!systemFonts.includes(primaryFont.toLowerCase())) {
              fontData.unique.add(primaryFont);
              
              // Add detailed info for headings and important elements
              if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
                fontData.detailed.push({
                  fontFamily: primaryFont,
                  fontSize: fontSize,
                  fontWeight: fontWeight,
                  color: color,
                  element: el.tagName.toLowerCase(),
                  sampleText: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : '')
                });
              }
            }
          }
        } catch (e) {
          // Skip elements with errors
        }
      });
      
      fontData.totalCount = fontData.unique.size;
      fontData.unique = Array.from(fontData.unique);
      
      return fontData;
    });
    
    console.log('Font extraction result:', fontData);
    return fontData;
  } catch (error) {
    console.error('Font extraction failed:', error);
    return { unique: [], detailed: [], totalCount: 0 };
  }
};

/**
 * Extracts colors using CSS analysis
 */
const extractColorsWithPicsart = async (page) => {
  try {
    console.log('Using CSS color extraction...');
    return await extractColorsFromCSS(page);
    
  } catch (error) {
    console.error('Color extraction failed:', error);
    return { unique: [], detailed: [], dominantColors: [] };
  }
};

/**
 * Extract colors from CSS styles
 */
const extractColorsFromCSS = async (page) => {
  try {
    const colorData = await page.evaluate(() => {
      const colors = {
        unique: new Set(),
        detailed: [],
        dominantColors: []
      };
      
      // Get all elements with computed styles
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach(el => {
        try {
          const computedStyle = window.getComputedStyle(el);
          
          // Extract colors from different CSS properties
          const colorProperties = [
            'backgroundColor',
            'color', 
            'borderColor',
            'borderTopColor',
            'borderRightColor',
            'borderBottomColor',
            'borderLeftColor',
            'outlineColor'
          ];
          
          colorProperties.forEach(prop => {
            const cssColor = computedStyle[prop];
            
            // Filter out transparent, inherit, and invalid colors
            if (cssColor && 
                cssColor !== 'rgba(0, 0, 0, 0)' && 
                cssColor !== 'transparent' &&
                cssColor !== 'inherit' &&
                cssColor !== 'initial' &&
                cssColor !== 'unset' &&
                cssColor !== 'currentColor' &&
                !cssColor.includes('var(')) {
              
              colors.unique.add(cssColor);
              
              // Add to detailed list for important elements
              if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'P'].includes(el.tagName)) {
                const existingDetail = colors.detailed.find(d => d.color === cssColor);
                if (!existingDetail) {
                  colors.detailed.push({
                    color: cssColor,
                    element: el.tagName.toLowerCase(),
                    property: prop,
                    sampleText: el.textContent?.substring(0, 30) || ''
                  });
                }
              }
            }
          });
        } catch (e) {
          // Skip elements with errors
        }
      });
      
      // Convert to arrays and create dominant colors
      const uniqueColors = Array.from(colors.unique);
      colors.dominantColors = uniqueColors.slice(0, 10); // Top 10 colors
      colors.unique = uniqueColors;
      
      return colors;
    });
    
    console.log('CSS fallback color extraction result:', colorData);
    return colorData;
  } catch (error) {
    console.error('CSS fallback color extraction failed:', error);
    return { unique: [], detailed: [], dominantColors: [] };
  }
};

module.exports = {
  analyzeSiteDesign,
  extractFonts,
  extractColorsWithPicsart
};
