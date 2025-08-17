# Task: Add Design Analysis Feature to Existing App

## Overview
Add a design analysis feature that extracts color palettes and fonts from websites using the existing Puppeteer setup. This feature should integrate seamlessly with the current screenshot functionality.

## Requirements

### 1. Install Required Dependencies
Add these packages to your project:
```bash
npm install node-vibrant colorthief canvas
```

### 2. Create Design Analysis Module

Create `src/utils/designAnalysis.js`:
```javascript
const Vibrant = require('node-vibrant');

/**
 * Analyzes a website for colors and fonts using Puppeteer
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
    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({ headless: true });
      page = await browser.newPage();
      shouldCloseBrowser = true;
    }
    
    // Navigate to URL
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Extract fonts from the page
    const fonts = await extractFonts(page);
    
    // Take screenshot for color analysis
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'png'
    });
    
    // Extract colors from screenshot
    const colors = await extractColors(screenshot);
    
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
  return await page.evaluate(() => {
    const fontData = {
      unique: new Set(),
      detailed: []
    };
    
    // Get all text elements
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, input, textarea');
    
    textElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const fontFamily = computedStyle.fontFamily;
      const fontSize = computedStyle.fontSize;
      const fontWeight = computedStyle.fontWeight;
      const color = computedStyle.color;
      const textContent = el.textContent?.trim();
      
      if (fontFamily && textContent && textContent.length > 0) {
        // Clean up font family
        const primaryFont = fontFamily
          .split(',')[0]
          .trim()
          .replace(/['"]/g, '');
        
        // Skip system/generic fonts
        if (!['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(primaryFont.toLowerCase())) {
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
    });
    
    return {
      unique: Array.from(fontData.unique),
      detailed: fontData.detailed,
      totalCount: fontData.unique.size
    };
  });
};

/**
 * Extracts color palette from screenshot buffer
 */
const extractColors = async (screenshotBuffer) => {
  try {
    const palette = await Vibrant.from(screenshotBuffer).getPalette();
    
    const colors = {};
    Object.entries(palette).forEach(([name, color]) => {
      if (color) {
        colors[name] = {
          hex: color.hex,
          rgb: color.rgb,
          population: color.population,
          hsl: color.hsl
        };
      }
    });
    
    // Add dominant colors array for easier use
    colors.dominantColors = Object.values(colors)
      .sort((a, b) => b.population - a.population)
      .slice(0, 5)
      .map(color => color.hex);
    
    return colors;
  } catch (error) {
    console.error('Color extraction failed:', error);
    return { error: 'Failed to extract colors' };
  }
};

module.exports = {
  analyzeSiteDesign,
  extractFonts,
  extractColors
};
```

### 3. Update Screenshot Service

Modify your existing screenshot service to include design analysis:

```javascript
// In your existing screenshot service file
const { analyzeSiteDesign } = require('./designAnalysis');

// Add this method to your existing screenshot service
const captureWithDesignAnalysis = async (url, options = {}) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Your existing screenshot logic
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: options.fullPage || true
    });
    
    // Add design analysis
    const designAnalysis = await analyzeSiteDesign(url, page);
    
    return {
      screenshot: screenshot,
      designAnalysis: designAnalysis.analysis,
      success: true
    };
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  } finally {
    await browser.close();
  }
};
```

### 4. Create React Component

Create `src/components/DesignAnalysisPanel.jsx`:
```jsx
import React, { useState } from 'react';
import './DesignAnalysisPanel.css';

const DesignAnalysisPanel = ({ analysisData, isLoading }) => {
  const [activeTab, setActiveTab] = useState('colors');
  
  if (isLoading) {
    return (
      <div className="analysis-panel loading">
        <div className="loading-spinner">Analyzing design...</div>
      </div>
    );
  }
  
  if (!analysisData) {
    return (
      <div className="analysis-panel empty">
        <p>No analysis data available. Capture a screenshot first.</p>
      </div>
    );
  }
  
  const { colors, fonts } = analysisData;
  
  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h3>Design Analysis</h3>
        <div className="tab-buttons">
          <button 
            className={activeTab === 'colors' ? 'active' : ''}
            onClick={() => setActiveTab('colors')}
          >
            Colors ({colors?.dominantColors?.length || 0})
          </button>
          <button 
            className={activeTab === 'fonts' ? 'active' : ''}
            onClick={() => setActiveTab('fonts')}
          >
            Fonts ({fonts?.totalCount || 0})
          </button>
        </div>
      </div>
      
      <div className="panel-content">
        {activeTab === 'colors' && (
          <ColorPalette colors={colors} />
        )}
        {activeTab === 'fonts' && (
          <FontList fonts={fonts} />
        )}
      </div>
    </div>
  );
};

const ColorPalette = ({ colors }) => {
  if (!colors || colors.error) {
    return <div className="error">Failed to extract colors</div>;
  }
  
  return (
    <div className="color-palette">
      <div className="dominant-colors">
        <h4>Dominant Colors</h4>
        <div className="color-grid">
          {colors.dominantColors?.map((color, index) => (
            <div key={index} className="color-swatch">
              <div 
                className="color-circle"
                style={{ backgroundColor: color }}
                title={color}
              ></div>
              <span className="color-hex">{color}</span>
              <button 
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(color)}
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="color-details">
        <h4>Color Analysis</h4>
        {Object.entries(colors).map(([name, colorData]) => {
          if (name === 'dominantColors' || !colorData.hex) return null;
          return (
            <div key={name} className="color-detail">
              <div 
                className="color-preview" 
                style={{ backgroundColor: colorData.hex }}
              ></div>
              <div className="color-info">
                <strong>{name.replace(/([A-Z])/g, ' $1')}</strong>
                <div>Hex: {colorData.hex}</div>
                <div>RGB: {colorData.rgb?.join(', ')}</div>
                <div>Population: {colorData.population}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FontList = ({ fonts }) => {
  if (!fonts || fonts.totalCount === 0) {
    return <div className="no-fonts">No fonts detected</div>;
  }
  
  return (
    <div className="font-list">
      <div className="font-summary">
        <h4>Detected Fonts ({fonts.totalCount})</h4>
        <div className="font-chips">
          {fonts.unique?.map((font, index) => (
            <span key={index} className="font-chip">
              {font}
            </span>
          ))}
        </div>
      </div>
      
      {fonts.detailed && fonts.detailed.length > 0 && (
        <div className="font-details">
          <h4>Font Usage</h4>
          {fonts.detailed.map((font, index) => (
            <div key={index} className="font-detail">
              <div className="font-preview" style={{ 
                fontFamily: `"${font.fontFamily}", sans-serif`,
                fontSize: font.fontSize,
                fontWeight: font.fontWeight,
                color: font.color
              }}>
                {font.sampleText}
              </div>
              <div className="font-meta">
                <span className="font-name">{font.fontFamily}</span>
                <span className="font-size">{font.fontSize}</span>
                <span className="font-weight">{font.fontWeight}</span>
                <span className="font-element">{font.element}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignAnalysisPanel;
```

### 5. Add Styles

Create `src/components/DesignAnalysisPanel.css`:
```css
.analysis-panel {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 20px;
  background: white;
  overflow: hidden;
}

.panel-header {
  background: #f8f9fa;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.panel-header h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.tab-buttons {
  display: flex;
  gap: 8px;
}

.tab-buttons button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-buttons button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.panel-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin: 16px 0;
}

.color-swatch {
  text-align: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.color-circle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 0 auto 8px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.color-hex {
  display: block;
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 8px;
}

.copy-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
}

.font-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.font-chip {
  background: #e9ecef;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  color: #495057;
}

.font-detail {
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 12px;
}

.font-preview {
  margin-bottom: 8px;
  line-height: 1.4;
}

.font-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
  flex-wrap: wrap;
}

.font-meta span {
  padding: 2px 6px;
  background: #f8f9fa;
  border-radius: 3px;
}

.loading-spinner {
  text-align: center;
  padding: 40px;
  color: #666;
}
```

### 6. Integration Instructions

1. **Import the component** in your main app:
```jsx
import DesignAnalysisPanel from './components/DesignAnalysisPanel';
```

2. **Add state management** for analysis data:
```jsx
const [analysisData, setAnalysisData] = useState(null);
const [isAnalyzing, setIsAnalyzing] = useState(false);
```

3. **Update your screenshot capture function** to include analysis:
```jsx
const captureScreenshot = async (url) => {
  setIsAnalyzing(true);
  try {
    const result = await fetch('/api/capture-with-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    }).then(res => res.json());
    
    if (result.success) {
      setAnalysisData(result.designAnalysis);
    }
  } catch (error) {
    console.error('Analysis failed:', error);
  }
  setIsAnalyzing(false);
};
```

4. **Add the component to your render**:
```jsx
<DesignAnalysisPanel 
  analysisData={analysisData}
  isLoading={isAnalyzing}
/>
```

## Expected Outcome

After implementing this feature, users will be able to:
- Extract color palettes from any website screenshot
- View dominant colors with hex codes and copy functionality
- See detailed color analysis (RGB, HSL, population)
- Detect fonts used on the website
- View font usage with sample text and styling information
- Export color palettes and font lists for design reference

The feature integrates seamlessly with your existing Puppeteer screenshot functionality and provides valuable design insights for template creation and style matching.