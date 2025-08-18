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
  
  return (
    <div className="color-palette">
      <div className="dominant-colors">
        <h4>Dominant Colors ({colors.dominantColors?.length || 0})</h4>
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
        <h4>Color Usage Details</h4>
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
              {colors.detailed?.map((colorData, index) => (
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
