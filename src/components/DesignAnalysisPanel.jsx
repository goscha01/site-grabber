import React, { useState, useEffect } from 'react';
import './DesignAnalysisPanel.css';

// Font parsing and mapping utilities
const FONT_WEIGHT_MAPPING = {
  // Light weights
  'thin': 100,
  'hairline': 100,
  'ultralight': 200,
  'extralight': 200,
  'light': 300,
  
  // Normal weights
  'normal': 400,
  'regular': 400,
  'medium': 500,
  
  // Bold weights
  'semibold': 600,
  'demibold': 600,
  'bold': 700,
  'extrabold': 800,
  'ultrabold': 800,
  'black': 900,
  'heavy': 900,
  'extrablack': 950,
  'ultrablack': 950
};

// Common Google Fonts variations mapping
const GOOGLE_FONTS_MAPPING = {
  // Cormorant variations
  'cormorantgaramond': 'Cormorant Garamond',
  'cormorant': 'Cormorant',
  'cormorant-unicase': 'Cormorant Unicase',
  
  // Open Sans variations
  'opensans': 'Open Sans',
  'opensanscondensed': 'Open Sans Condensed',
  
  // Roboto variations
  'roboto': 'Roboto',
  'robotomono': 'Roboto Mono',
  'robotoslab': 'Roboto Slab',
  'roboto-condensed': 'Roboto Condensed',
  
  // Lato variations
  'lato': 'Lato',
  'lato-light': 'Lato',
  'lato-bold': 'Lato',
  
  // Montserrat variations
  'montserrat': 'Montserrat',
  'montserrat-alternates': 'Montserrat Alternates',
  
  // Poppins variations
  'poppins': 'Poppins',
  
  // Inter variations
  'inter': 'Inter',
  
  // Nunito variations
  'nunito': 'Nunito',
  'nunito-sans': 'Nunito Sans',
  
  // Raleway variations
  'raleway': 'Raleway',
  
  // Ubuntu variations
  'ubuntu': 'Ubuntu',
  'ubuntu-condensed': 'Ubuntu Condensed',
  'ubuntu-mono': 'Ubuntu Mono',
  
  // Source Sans variations
  'sourcesanspro': 'Source Sans Pro',
  'sourceserifpro': 'Source Serif Pro',
  'sourcecodepro': 'Source Code Pro',
  
  // Playfair Display variations
  'playfairdisplay': 'Playfair Display',
  'playfair-display': 'Playfair Display',
  
  // Merriweather variations
  'merriweather': 'Merriweather',
  'merriweather-sans': 'Merriweather Sans',
  
  // Oswald variations
  'oswald': 'Oswald',
  
  // PT Sans variations
  'ptsans': 'PT Sans',
  'ptserif': 'PT Serif',
  'pt-sans': 'PT Sans',
  'pt-serif': 'PT Serif',
  
  // Noto variations
  'notosans': 'Noto Sans',
  'notoserif': 'Noto Serif',
  'noto-sans': 'Noto Sans',
  'noto-serif': 'Noto Serif',
  
  // Work Sans variations
  'worksans': 'Work Sans',
  'work-sans': 'Work Sans',
  
  // Fira variations
  'firasans': 'Fira Sans',
  'firaserif': 'Fira Serif',
  'fira-code': 'Fira Code',
  'fira-sans': 'Fira Sans',
  'fira-serif': 'Fira Serif',
  'fira-code': 'Fira Code'
};

// Font classification for similarity matching
const FONT_CLASSIFICATIONS = {
  'serif': [
    'Cormorant Garamond', 'Playfair Display', 'Merriweather', 'PT Serif', 
    'Noto Serif', 'Fira Serif', 'Source Serif Pro', 'Roboto Slab'
  ],
  'sans-serif': [
    'Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Poppins', 'Inter', 
    'Nunito', 'Raleway', 'Ubuntu', 'Source Sans Pro', 'Noto Sans', 
    'Work Sans', 'Fira Sans', 'PT Sans'
  ],
  'monospace': [
    'Roboto Mono', 'Ubuntu Mono', 'Source Code Pro', 'Fira Code', 'PT Mono'
  ]
};

// Helper function to parse font name and extract weight
const parseFontName = (fontFamily) => {
  if (!fontFamily) return { name: '', weight: 400, isParsed: false };
  
  const normalized = fontFamily.toLowerCase().replace(/['"]/g, '').trim();
  
  // Check if it's already a clean Google Font name
  if (GOOGLE_FONTS_MAPPING[normalized]) {
    return {
      name: GOOGLE_FONTS_MAPPING[normalized],
      weight: 400,
      isParsed: true,
      confidence: 'high'
    };
  }
  
  // Try to parse patterns like "fontname-weight" or "fontname_weight"
  const patterns = [
    /^(.+?)[-_](light|thin|hairline|ultralight|extralight|normal|regular|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|extrablack|ultrablack)$/,
    /^(.+?)(light|thin|hairline|ultralight|extralight|normal|regular|medium|semibold|demibold|bold|extrabold|ultrabold|black|heavy|extrablack|ultrablack)$/,
    /^(.+?)(\d{3,4})$/
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const baseName = match[1].trim();
      const weightIndicator = match[2];
      
      // Check if base name maps to a Google Font
      if (GOOGLE_FONTS_MAPPING[baseName]) {
        const googleFontName = GOOGLE_FONTS_MAPPING[baseName];
        let weight = 400;
        
        // Parse weight
        if (FONT_WEIGHT_MAPPING[weightIndicator]) {
          weight = FONT_WEIGHT_MAPPING[weightIndicator];
        } else if (/^\d{3,4}$/.test(weightIndicator)) {
          weight = parseInt(weightIndicator);
        }
        
        return {
          name: googleFontName,
          weight,
          isParsed: true,
          confidence: 'high',
          originalName: fontFamily
        };
      }
    }
  }
  
  // Try to find similar fonts by classification
  const similarFont = findSimilarFont(normalized);
  if (similarFont) {
    return {
      name: similarFont.name,
      weight: 400,
      isParsed: true,
      confidence: 'medium',
      originalName: fontFamily,
      isSimilar: true
    };
  }
  
  // No match found
  return {
    name: fontFamily,
    weight: 400,
    isParsed: false,
    confidence: 'low'
  };
};

// Helper function to find similar fonts
const findSimilarFont = (fontName) => {
  // Simple similarity check - could be enhanced with more sophisticated algorithms
  const normalized = fontName.toLowerCase();
  
  // Check each classification
  for (const [classification, fonts] of Object.entries(FONT_CLASSIFICATIONS)) {
    for (const font of fonts) {
      const normalizedFont = font.toLowerCase();
      
      // Check if names are similar (contain similar words)
      const fontWords = normalizedFont.split(/\s+/);
      const nameWords = normalized.split(/[-_\s]+/);
      
      // Check for word overlap
      const overlap = fontWords.filter(word => 
        nameWords.some(nameWord => 
          nameWord.includes(word) || word.includes(nameWord)
        )
      );
      
      if (overlap.length > 0) {
        return {
          name: font,
          classification,
          similarity: overlap.join(', ')
        };
      }
    }
  }
  
  return null;
};

// Helper function to build Google Fonts URL
const buildGoogleFontsUrl = (parsedFont) => {
  if (!parsedFont.isParsed) return null;
  
  const family = encodeURIComponent(parsedFont.name);
  const weights = [parsedFont.weight];
  
  // Add common weights for better font loading
  if (weights[0] === 400) {
    weights.push(300, 500, 600, 700);
  } else if (weights[0] === 300) {
    weights.push(400, 500, 600);
  } else if (weights[0] === 700) {
    weights.push(400, 500, 600);
  }
  
  // Remove duplicates and sort
  const uniqueWeights = [...new Set(weights)].sort((a, b) => a - b);
  
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${uniqueWeights.join(';')}&display=swap`;
};

const DesignAnalysisPanel = ({ analysis }) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [loadedFonts, setLoadedFonts] = useState(new Set());
  const [fontLoadingStates, setFontLoadingStates] = useState({});
  const [expandedFonts, setExpandedFonts] = useState(new Set());

  console.log('DesignAnalysisPanel - analysis prop:', analysis); // Debug log
  console.log('DesignAnalysisPanel - analysis type:', typeof analysis); // Debug log
  console.log('DesignAnalysisPanel - analysis keys:', analysis ? Object.keys(analysis) : 'null'); // Debug log
  
  if (!analysis) {
    return (
      <div className="design-analysis-panel">
        <div className="empty">✨ Design analysis will appear here after capturing a screenshot</div>
      </div>
    );
  }
  
  const { colors, fonts } = analysis;
  
  return (
    <div className="design-analysis-panel">
      <div className="panel-header">
        <h2 className="panel-title">Design Analysis</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            🎨 Colors ({colors?.dominantColors?.length || 0})
          </button>
          <button 
            className={`tab-button ${activeTab === 'fonts' ? 'active' : ''}`}
            onClick={() => setActiveTab('fonts')}
          >
            🔤 Fonts ({fonts?.totalCount || 0})
          </button>
        </div>
      </div>
      
      <div className="tab-content">
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

  // Debug logging for pixel analysis data
  console.log('🎨 ColorPalette - colors data:', {
    dominantColors: colors.dominantColors?.length || 0,
    detailed: colors.detailed?.length || 0,
    pixelAnalysis: colors.pixelAnalysis ? {
      totalPixels: colors.pixelAnalysis.totalPixels,
      colorCount: colors.pixelAnalysis.colors?.length || 0,
      topColors: colors.pixelAnalysis.colors?.slice(0, 3).map(c => `${c.r},${c.g},${c.b} (${c.percentage.toFixed(1)}%)`) || []
    } : null,
    mobilePixelAnalysis: colors.mobilePixelAnalysis ? {
      count: colors.mobilePixelAnalysis.length,
      devices: colors.mobilePixelAnalysis.map((device, i) => ({
        device: i,
        totalPixels: device?.totalPixels || 0,
        colorCount: device?.colors?.length || 0
      }))
    } : null
  });

  // Summary of pixel analysis data
  if (colors.pixelAnalysis) {
    console.log('🔍 Desktop Pixel Analysis Summary:', {
      totalPixels: colors.pixelAnalysis.totalPixels,
      uniqueColors: colors.pixelAnalysis.colors?.length || 0,
      topColors: colors.pixelAnalysis.colors?.slice(0, 5).map(c => ({
        rgb: `${c.r},${c.g},${c.b}`,
        percentage: c.percentage.toFixed(1) + '%'
      }))
    });
  }

  if (colors.mobilePixelAnalysis && colors.mobilePixelAnalysis.length > 0) {
    console.log('📱 Mobile Pixel Analysis Summary:', {
      devices: colors.mobilePixelAnalysis.length,
      deviceData: colors.mobilePixelAnalysis.map((device, i) => ({
        device: i,
        totalPixels: device?.totalPixels || 0,
        uniqueColors: device?.colors?.length || 0,
        topColors: device?.colors?.slice(0, 3).map(c => ({
          rgb: `${c.r},${c.g},${c.b}`,
          percentage: c.percentage.toFixed(1) + '%'
        })) || []
      }))
    });
  }

  // SIMPLE APPROACH: Just filter out pure black and white, keep everything else
  const allDetailedColors = colors.detailed || [];
  const colorsWithPixelData = [];
  const blackAndWhiteColorsFiltered = [];
  
  console.log('🔍 SIMPLE FILTERING: Removing only pure black and white...');
  
  // Helper function to convert CSS color to RGB for comparison
  const cssColorToRGB = (cssColor) => {
    if (cssColor.startsWith('rgb')) {
      const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3])
        };
      }
    } else if (cssColor.startsWith('#')) {
      const hex = cssColor.replace('#', '');
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }
    return null;
  };

  // Simple check: is it pure black or pure white?
  const isPureBlackOrWhite = (color) => {
    // Handle common black and white color names
    const blackWhiteColors = [
      'white', '#ffffff', '#fff', 'rgb(255, 255, 255)', 'rgba(255, 255, 255, 1)',
      'black', '#000000', '#000', 'rgb(0, 0, 0)', 'rgba(0, 0, 0, 1)'
    ];
    
    // Check exact matches first
    if (blackWhiteColors.includes(color.toLowerCase())) {
      return true;
    }
    
    // Check RGB values - only pure black (0,0,0) and pure white (255,255,255)
    const rgb = cssColorToRGB(color);
    if (!rgb) return false;
    
    const isPureWhite = rgb.r === 255 && rgb.g === 255 && rgb.b === 255;
    const isPureBlack = rgb.r === 0 && rgb.g === 0 && rgb.b === 0;
    
    return isPureWhite || isPureBlack;
  };

  // Process each color - filter out pure black/white AND calculate pixel percentages
  allDetailedColors.forEach(colorData => {
    // First check: is it pure black or white?
    if (isPureBlackOrWhite(colorData.color)) {
      blackAndWhiteColorsFiltered.push(colorData.color);
      console.log(`❌ Color ${colorData.color} is pure black/white - filtering out`);
      return;
    }
    
    // Calculate pixel percentages for colors that pass the black/white filter
    let desktopPercentage = 0;
    let mobilePercentage = 0;
    
    // Helper function to find matching color in pixel analysis
    const findPixelPercentage = (pixelAnalysis, cssColor) => {
      if (!pixelAnalysis || !pixelAnalysis.colors) return 0;
      
      const rgb = cssColorToRGB(cssColor);
      if (!rgb) return 0;
      
      const pixelData = pixelAnalysis.colors.find(p => {
        // Check if pixel color is within ±5 RGB units for more lenient matching
        // This helps catch colors that might have slight variations
        return Math.abs(rgb.r - p.r) <= 5 && 
               Math.abs(rgb.g - p.g) <= 5 && 
               Math.abs(rgb.b - p.b) <= 5;
      });
      
      return pixelData ? parseFloat(pixelData.percentage.toFixed(1)) : 0;
    };

    // Get desktop pixel percentage
    if (colors && colors.pixelAnalysis) {
      desktopPercentage = findPixelPercentage(colors.pixelAnalysis, colorData.color);
    }

    // Get mobile pixel percentage (use first mobile device)
    if (colors && colors.mobilePixelAnalysis && colors.mobilePixelAnalysis.length > 0) {
      mobilePercentage = findPixelPercentage(colors.mobilePixelAnalysis[0], colorData.color);
    }

    // Only keep colors that have some pixel data (not 0% on both desktop and mobile)
    if (desktopPercentage > 0 || mobilePercentage > 0) {
      colorsWithPixelData.push({
        ...colorData,
        desktopPercentage,
        mobilePercentage,
        totalPercentage: Math.max(desktopPercentage, mobilePercentage)
      });
      console.log(`✅ Color ${colorData.color} kept - Desktop: ${desktopPercentage}%, Mobile: ${mobilePercentage}%`);
    } else {
      console.log(`❌ Color ${colorData.color} has no pixel data - filtering out`);
    }
  });

  console.log(`🔍 Colors kept: ${colorsWithPixelData.length}/${allDetailedColors.length}`);
  console.log(`🔍 Pure black/white colors filtered out: ${blackAndWhiteColorsFiltered.length}`, blackAndWhiteColorsFiltered);

  // Step 3: Determine dominant colors based on pixel usage
  const dominantColorsByUsage = colorsWithPixelData
    .sort((a, b) => b.totalPercentage - a.totalPercentage)
    .slice(0, 5)
    .map(color => color.color);

  console.log('🔍 Dominant colors by pixel usage:', dominantColorsByUsage);
  
  // Add a summary section
  const summaryInfo = {
    totalColors: allDetailedColors.length,
    colorsKept: colorsWithPixelData.length,
    colorsFilteredOut: allDetailedColors.length - colorsWithPixelData.length,
    pureBlackAndWhiteFiltered: blackAndWhiteColorsFiltered.length,
    noPixelDataFiltered: allDetailedColors.length - colorsWithPixelData.length - blackAndWhiteColorsFiltered.length,
    dominantColors: dominantColorsByUsage.length
  };
  
  console.log('🔍 Summary:', summaryInfo);
  
  return (
    <div className="color-palette">
      {/* Summary Section */}
      <div className="color-section summary-section">
        <h4>📊 Color Analysis Summary</h4>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total CSS Colors Found:</span>
            <span className="summary-value">{summaryInfo.totalColors}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Colors Kept:</span>
            <span className="summary-value">{summaryInfo.colorsKept}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Pure Black/White Filtered:</span>
            <span className="summary-value">{summaryInfo.pureBlackAndWhiteFiltered}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">No Pixel Data Filtered:</span>
            <span className="summary-value">{summaryInfo.noPixelDataFiltered}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Dominant Colors:</span>
            <span className="summary-value">{summaryInfo.dominantColors}</span>
          </div>
        </div>
      </div>
      
      {/* Dominant Colors Section */}
      <div className="color-section dominant-section">
        <h4>🎯 Dominant Colors ({dominantColorsByUsage.length})</h4>
        <p className="section-description">Top colors by actual pixel usage on the page (filtered from pixel analysis)</p>
        <div className="color-grid">
          {dominantColorsByUsage.map((color, index) => (
            <div key={index} className="color-swatch dominant-swatch">
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
      
      {/* Color Usage Details */}
      <div className="color-details">
        <h4>📊 Color Usage Details</h4>
        <p className="section-description">Only colors with actual pixel data (no 0% values) - excluding pure black/white</p>
        
        {/* Debug logging for details table */}
        {console.log('🔍 Details table - colorsWithPixelData:', {
          count: colorsWithPixelData.length,
          colors: colorsWithPixelData.map(c => c.color)
        })}
        
        <div className="color-table-container">
          <table className="color-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Element</th>
                <th>Property</th>
                <th>Desktop %</th>
                <th>Mobile %</th>
                <th>Sample Text</th>
              </tr>
            </thead>
            <tbody>
              {colorsWithPixelData.map((colorData, index) => {
                return (
                  <tr key={index} className="color-table-row">
                    <td>
                      <div className="color-table-preview">
                        <div 
                          className="color-table-swatch" 
                          style={{ backgroundColor: colorData.color }}
                          title={colorData.color}
                        ></div>
                        <span className="color-table-hex">{colorData.color}</span>
                      </div>
                    </td>
                    <td>{colorData.element}</td>
                    <td>{colorData.property}</td>
                    <td className="pixel-percentage">
                      {colorData.desktopPercentage}%
                    </td>
                    <td className="pixel-percentage">
                      {colorData.mobilePercentage}%
                    </td>
                    <td className="sample-text">{colorData.sampleText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FontList = ({ fonts }) => {
  const [expandedFonts, setExpandedFonts] = useState(new Set());
  const [loadedFonts, setLoadedFonts] = useState(new Set());
  const [fontLoadingStates, setFontLoadingStates] = useState({});

  // Helper function to normalize font family names
  const normalizeFontFamily = (fontFamily) => {
    if (!fontFamily) return '';
    
    return fontFamily
      .replace(/['"]/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize spacing
      .trim()
      .toLowerCase();
  };

  // Helper function to check if font is a system font
  const isSystemFont = (fontFamily) => {
    const normalized = normalizeFontFamily(fontFamily);
    const systemFonts = [
      'arial', 'helvetica', 'times', 'times new roman', 'courier', 'courier new',
      'georgia', 'verdana', 'tahoma', 'trebuchet ms', 'impact', 'comic sans ms',
      'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'
    ];
    
    return systemFonts.includes(normalized);
  };

  // Helper function to check if font is a web font
  const isWebFont = (fontFamily) => {
    if (!fontFamily) return false;
    
    const normalized = normalizeFontFamily(fontFamily);
    
    // Google Fonts indicators
    if (normalized.includes('roboto') || normalized.includes('open sans') || 
        normalized.includes('lato') || normalized.includes('montserrat') ||
        normalized.includes('poppins') || normalized.includes('inter') ||
        normalized.includes('nunito') || normalized.includes('raleway') ||
        normalized.includes('ubuntu') || normalized.includes('source sans pro')) {
      return true;
    }
    
    // Custom web font indicators (not system fonts)
    return !isSystemFont(fontFamily);
  };

  // Helper function to load Google Fonts
  const loadGoogleFont = (fontFamily) => {
    if (loadedFonts.has(fontFamily)) return;
    
    // Parse the font name to get proper Google Fonts format
    const parsedFont = parseFontName(fontFamily);
    console.log(`Parsing font "${fontFamily}":`, parsedFont);
    
    if (!parsedFont.isParsed) {
      console.warn(`Could not parse font name: ${fontFamily}`);
      setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'error' }));
      return;
    }
    
    // Set loading state
    setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'loading' }));
    
    try {
      // Build proper Google Fonts URL
      const googleFontsUrl = buildGoogleFontsUrl(parsedFont);
      if (!googleFontsUrl) {
        console.warn(`Could not build Google Fonts URL for: ${fontFamily}`);
        setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'error' }));
        return;
      }
      
      console.log(`Loading Google Font: ${parsedFont.name} (${parsedFont.weight}) from: ${googleFontsUrl}`);
      
      // Create link element for Google Fonts
      const link = document.createElement('link');
      link.href = googleFontsUrl;
      link.rel = 'stylesheet';
      link.type = 'text/css';
      
      // Define the onload callback first
      const handleFontLoad = () => {
        console.log(`Font loaded via link: ${parsedFont.name} (${fontFamily})`);
        setLoadedFonts(prev => new Set([...prev, fontFamily]));
        setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'loaded' }));
      };
      
      // Add to head
      document.head.appendChild(link);
      
      // Wait for font to load using FontFace API if available
      if ('fonts' in document) {
        // Modern browsers - use FontFace API
        const font = new FontFace(parsedFont.name, `url(${googleFontsUrl})`);
        
        font.load().then(() => {
          document.fonts.add(font);
          console.log(`Font loaded via FontFace API: ${parsedFont.name} (${fontFamily})`);
          setLoadedFonts(prev => new Set([...prev, fontFamily]));
          setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'loaded' }));
        }).catch((error) => {
          console.warn(`Failed to load font via FontFace API: ${parsedFont.name} (${fontFamily})`, error);
          // Fallback to link onload
          handleFontLoad();
        });
      } else {
        // Fallback for older browsers
        link.onload = handleFontLoad;
      }
      
      link.onerror = () => {
        console.warn(`Failed to load font: ${parsedFont.name} (${fontFamily})`);
        setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'error' }));
      };
    } catch (error) {
      console.warn(`Error loading font ${parsedFont.name} (${fontFamily}):`, error);
      setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'error' }));
    }
  };

  // Enhanced font loading verification
  const verifyFontLoaded = (fontFamily) => {
    return new Promise((resolve) => {
      if ('fonts' in document) {
        // Check if font is loaded using FontFace API
        document.fonts.ready.then(() => {
          const isLoaded = document.fonts.check(`12px "${fontFamily}"`);
          resolve(isLoaded);
        });
      } else {
        // Fallback for older browsers
        setTimeout(() => resolve(true), 1000);
      }
    });
  };

  // Manual font loading function for testing
  const manuallyLoadFont = async (fontFamily) => {
    console.log(`Manually loading font: ${fontFamily}`);
    loadGoogleFont(fontFamily);
    
    // Wait a bit and verify
    setTimeout(async () => {
      const isLoaded = await verifyFontLoaded(fontFamily);
      if (isLoaded) {
        setLoadedFonts(prev => new Set([...prev, fontFamily]));
        setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'loaded' }));
        console.log(`Font verified as loaded: ${fontFamily}`);
      } else {
        console.warn(`Font verification failed: ${fontFamily}`);
        setFontLoadingStates(prev => ({ ...prev, [fontFamily]: 'error' }));
      }
    }, 2000);
  };

  // Preload fonts when component mounts
  useEffect(() => {
    if (fonts?.detailed) {
      const webFonts = new Set();
      
      fonts.detailed.forEach(fontData => {
        if (fontData.fontFamily && isWebFont(fontData.fontFamily)) {
          webFonts.add(fontData.fontFamily);
        }
      });
      
      console.log('🔤 Detected web fonts:', Array.from(webFonts));
      
      // Parse and log each font
      webFonts.forEach(fontFamily => {
        const parsedFont = parseFontName(fontFamily);
        console.log(`📝 Font parsing for "${fontFamily}":`, parsedFont);
        
        if (parsedFont.isParsed) {
          console.log(`✅ Will load: ${parsedFont.name} (weight: ${parsedFont.weight})`);
          if (parsedFont.isSimilar) {
            console.log(`🔍 Using similar font: ${parsedFont.name} (original: ${fontFamily})`);
          }
        } else {
          console.log(`❌ Could not parse: ${fontFamily}`);
        }
      });
      
      // Load all web fonts
      webFonts.forEach(fontFamily => {
        loadGoogleFont(fontFamily);
      });
    }
  }, [fonts]);

  if (!fonts || fonts.totalCount === 0) {
    return <div className="no-fonts">No fonts detected</div>;
  }

  // Helper function to create a test element for font loading verification
  const createFontTestElement = (fontFamily) => {
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      visibility: hidden;
      font-family: "${fontFamily}", Arial, sans-serif;
      font-size: 16px;
      line-height: 1;
    `;
    testElement.textContent = 'Test Text';
    document.body.appendChild(testElement);
    
    const dimensions = testElement.getBoundingClientRect();
    document.body.removeChild(testElement);
    
    return dimensions;
  };

  // Helper function to check font loading confidence
  const getFontConfidence = (fontFamily, element) => {
    try {
      // Create test elements with different fonts
      const testElement = document.createElement('div');
      testElement.style.cssText = `
        position: absolute;
        left: -9999px;
        top: -9999px;
        visibility: hidden;
        font-family: "${fontFamily}", Arial, sans-serif;
        font-size: 16px;
        line-height: 1;
      `;
      testElement.textContent = 'Test Text';
      document.body.appendChild(testElement);
      
      const customFontDimensions = testElement.getBoundingClientRect();
      
      // Test with fallback font
      testElement.style.fontFamily = 'Arial, sans-serif';
      const fallbackDimensions = testElement.getBoundingClientRect();
      
      document.body.removeChild(testElement);
      
      // Compare dimensions to determine if custom font loaded
      const widthDiff = Math.abs(customFontDimensions.width - fallbackDimensions.width);
      const heightDiff = Math.abs(customFontDimensions.height - fallbackDimensions.height);
      
      // If dimensions are very similar, font might not be loading
      if (widthDiff < 1 && heightDiff < 1) {
        return 'low'; // Font not loading, using fallback
      } else if (widthDiff < 3 && heightDiff < 3) {
        return 'medium'; // Font might be loading
      } else {
        return 'high'; // Font definitely loaded
      }
    } catch (error) {
      return 'unknown'; // Error occurred during testing
    }
  };

  // Toggle font expansion
  const toggleFontExpansion = (fontFamily) => {
    const newExpanded = new Set(expandedFonts);
    if (newExpanded.has(fontFamily)) {
      newExpanded.delete(fontFamily);
    } else {
      newExpanded.add(fontFamily);
    }
    setExpandedFonts(newExpanded);
  };

  // Process and deduplicate fonts
  const processFonts = () => {
    if (!fonts.detailed || fonts.detailed.length === 0) {
      return { unique: fonts.unique || [], processed: [] };
    }

    const fontMap = new Map();
    const processedFonts = [];

    fonts.detailed.forEach(fontData => {
      const normalizedFamily = normalizeFontFamily(fontData.fontFamily);
      
      if (!normalizedFamily || isSystemFont(normalizedFamily)) {
        return; // Skip system fonts and empty names
      }

      if (!fontMap.has(normalizedFamily)) {
        const fontInfo = {
          family: fontData.fontFamily,
          normalizedFamily,
          variations: [],
          usage: new Set(),
          confidence: 'unknown',
          isWebFont: isWebFont(fontData.fontFamily)
        };
        
        fontMap.set(normalizedFamily, fontInfo);
        processedFonts.push(fontInfo);
      }

      const fontInfo = fontMap.get(normalizedFamily);
      
      // Add variation if not already present
      const variation = {
        weight: fontData.fontWeight || 'normal',
        style: fontData.fontStyle || 'normal',
        size: fontData.fontSize || '16px',
        element: fontData.element || 'unknown',
        sampleText: fontData.sampleText || 'Sample text',
        color: fontData.color || '#000000'
      };
      
      const variationKey = `${variation.weight}-${variation.style}-${variation.size}`;
      if (!fontInfo.variations.some(v => 
        `${v.weight}-${v.style}-${v.size}` === variationKey
      )) {
        fontInfo.variations.push(variation);
      }
      
      // Track usage context
      fontInfo.usage.add(fontData.element || 'unknown');
    });

    // Sort by web font priority, then by usage count
    processedFonts.sort((a, b) => {
      if (a.isWebFont !== b.isWebFont) {
        return b.isWebFont ? 1 : -1; // Web fonts first
      }
      return b.variations.length - a.variations.length; // More variations first
    });

    return {
      unique: processedFonts.map(f => f.family),
      processed: processedFonts
    };
  };

  const { unique, processed } = processFonts();

  return (
    <div className="font-list">
      <div className="font-summary">
        <h4>Detected Fonts ({unique.length})</h4>
      </div>
      
      {processed && processed.length > 0 && (
        <div className="font-details">
          {processed.map((font, index) => {
            const loadingState = fontLoadingStates[font.family] || 'idle';
            const isLoaded = loadedFonts.has(font.family);
            
            return (
              <div key={index} className="font-family-detail">
                {/* Line 1: Font name with badges */}
                <div className="font-name-line">
                  <span className="font-name">{font.family}</span>
                  {font.isWebFont && <span className="web-font-badge">🌐 Web Font</span>}
                  {(() => {
                    const parsedFont = parseFontName(font.family);
                    if (parsedFont.isParsed) {
                      return (
                        <span className={`parsing-confidence-badge confidence-${parsedFont.confidence}`}>
                          {parsedFont.confidence === 'high' ? '✓ Exact Match' :
                           parsedFont.confidence === 'medium' ? '🔍 Similar Font' :
                           '⚠ Low Confidence'}
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {font.isWebFont && (
                    <span className={`font-loading-badge font-loading-${loadingState}`}>
                      {loadingState === 'loading' ? '⏳ Loading...' :
                       loadingState === 'loaded' ? '✓ Loaded' :
                       loadingState === 'error' ? '✗ Failed' : '⏳ Pending'}
                    </span>
                  )}
                </div>
                
                {/* Line 2: Usage context */}
                <div className="font-usage-line">
                  Used in: {Array.from(font.usage).join(', ')}
                </div>
                
                {/* Line 3: Sample text */}
                <div className="font-sample-line" style={{
                  fontFamily: (() => {
                    if (isLoaded) {
                      const parsedFont = parseFontName(font.family);
                      if (parsedFont.isParsed) {
                        return `"${parsedFont.name}", sans-serif`;
                      }
                      return `"${font.family}", sans-serif`;
                    }
                    return 'sans-serif';
                  })(),
                  fontSize: '18px',
                  fontWeight: '400',
                  opacity: isLoaded ? 1 : 0.7
                }}>
                  Whereas recognition of the inherent dignity
                </div>
                
                {/* Line 4: Variations */}
                <div className="font-variations-line" onClick={() => toggleFontExpansion(font.family)}>
                  <span>Variations ({font.variations.length})</span>
                  <span className="expand-icon">
                    {expandedFonts.has(font.family) ? '▼' : '▶'}
                  </span>
                </div>

                {/* Expandable variations table */}
                {expandedFonts.has(font.family) && (
                    <div className="variations-table">
                      <table className="font-variations-table">
                        <thead>
                          <tr>
                            <th>Weight</th>
                            <th>Style</th>
                            <th>Size</th>
                            <th>Element</th>
                            <th>Sample</th>
                          </tr>
                        </thead>
                        <tbody>
                          {font.variations.map((variation, vIndex) => (
                            <tr key={vIndex}>
                              <td>{variation.weight}</td>
                              <td>{variation.style}</td>
                              <td>{variation.size}</td>
                              <td>{variation.element}</td>
                              <td className="variation-sample">
                                <span style={{ 
                                  fontFamily: (() => {
                                    if (isLoaded) {
                                      const parsedFont = parseFontName(font.family);
                                      if (parsedFont.isParsed) {
                                        return `"${parsedFont.name}", sans-serif`;
                                      }
                                      return `"${font.family}", sans-serif`;
                                    }
                                    return 'sans-serif';
                                  })(),
                                  fontSize: variation.size,
                                  fontWeight: variation.weight,
                                  fontStyle: variation.style,
                                  color: variation.color,
                                  opacity: isLoaded ? 1 : 0.7
                                }}>
                                  Whereas recognition
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DesignAnalysisPanel;
