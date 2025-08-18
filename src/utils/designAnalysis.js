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
      console.log('🎨 Using existing page for design analysis');
    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({ headless: true });
      page = await browser.newPage();
      shouldCloseBrowser = true;
      
      // Navigate to URL only if we created a new page
      console.log(`🌐 Navigating to URL for design analysis: ${url}`);
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait a bit for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
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
