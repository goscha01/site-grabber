import React, { useState } from 'react';
import './DesignAnalysisPanel.css';

const DesignAnalysisPanel = ({ analysisData, isLoading }) => {
  const [activeTab, setActiveTab] = useState('colors');
  
  if (isLoading) {
    return (
      <div className="design-analysis-panel">
        <div className="loading">🎨 Analyzing website design...</div>
      </div>
    );
  }
  
  if (!analysisData) {
    return (
      <div className="design-analysis-panel">
        <div className="empty">✨ Design analysis will appear here after capturing a screenshot</div>
      </div>
    );
  }
  
  const { colors, fonts } = analysisData;
  
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

  // Separate colors into dominant and accent based on element types and usage
  const dominantColors = colors.dominantColors || [];
  const accentColors = colors.accentColors || [];
  
  // If no accent colors defined, create them from detailed colors
  const allDetailedColors = colors.detailed || [];
  const colorFrequency = {};
  
  // Categorize colors by element type
  const dominantElements = ['body', 'main', 'section', 'div', 'p', 'span', 'background'];
  const accentElements = ['a', 'button', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'input', 'select', 'textarea'];
  
  allDetailedColors.forEach(colorData => {
    const color = colorData.color;
    const element = colorData.element?.toLowerCase() || '';
    const property = colorData.property?.toLowerCase() || '';
    
    // Count frequency
    colorFrequency[color] = colorFrequency[color] || { count: 0, elements: new Set() };
    colorFrequency[color].count += 1;
    colorFrequency[color].elements.add(element);
    
    // Check if it's an accent color based on element type
    if (accentElements.some(accEl => element.includes(accEl))) {
      colorFrequency[color].isAccent = true;
    }
  });
  
  // Sort colors by frequency and categorize
  const sortedColors = Object.entries(colorFrequency)
    .sort(([,a], [,b]) => b.count - a.count);
  
  // Dominant colors: most frequent, used in main content areas
  const dominantFromDetailed = sortedColors
    .filter(([, data]) => !data.isAccent)
    .slice(0, 3)
    .map(([color]) => color);
  
  // Accent colors: used in interactive elements and headings
  const accentFromDetailed = sortedColors
    .filter(([, data]) => data.isAccent || data.elements.size > 2)
    .slice(0, 6)
    .map(([color]) => color);
  
  const finalDominant = [...new Set([...dominantColors, ...dominantFromDetailed])];
  const finalAccent = [...new Set([...accentColors, ...accentFromDetailed])];
  
  return (
    <div className="color-palette">
      {/* Dominant Colors Section */}
      <div className="color-section dominant-section">
        <h4>🎯 Dominant Colors ({finalDominant.length})</h4>
        <p className="section-description">Main content colors used for backgrounds, text, and primary content areas</p>
        <div className="color-grid">
          {finalDominant.map((color, index) => (
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
      
      {/* Accent Colors Section */}
      <div className="color-section accent-section">
        <h4>✨ Accent Colors ({finalAccent.length})</h4>
        <p className="section-description">Interactive colors used for links, buttons, headings (H1, H2), and form elements</p>
        <div className="color-grid">
          {finalAccent.map((color, index) => (
            <div key={index} className="color-swatch accent-swatch">
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
        <p className="section-description">Detailed breakdown of how colors are used throughout the website</p>
        <div className="color-table-container">
          <table className="color-table">
            <thead>
              <tr>
                <th>Color</th>
                <th>Element</th>
                <th>Property</th>
                <th>Sample Text</th>
              </tr>
            </thead>
            <tbody>
              {allDetailedColors.map((colorData, index) => (
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
                  <td className="sample-text">{colorData.sampleText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          <h4>Font Usage Examples</h4>
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
