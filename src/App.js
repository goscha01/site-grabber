import React, { useState } from 'react';
import './styles/app.css';
import './styles/navigation.css';
import './styles/content-sections.css';
import UrlInput from './components/UrlInput';
import ScreenshotResults from './components/ScreenshotResults';
import DesignAnalysisPanel from './components/DesignAnalysisPanel';
import AsyncScreenshotCapture from './components/AsyncScreenshotCapture';
import Navigation from './components/Navigation';
import ContentSections from './components/ContentSections';

function App() {
  const [url, setUrl] = useState('');
  const [screenshotResults, setScreenshotResults] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [activeMode, setActiveMode] = useState('sync');

  const handleUrlSubmit = async (inputUrl) => {
    setIsCapturing(true);
    setError(null);
    
    try {
      const result = await captureWithScreenshotUrl(inputUrl, {
        captureMode: 'both',
        mobileDevices: ['iPhone 12'],
        captureFonts: true,
        captureColors: true
      });
      
      setScreenshotResults(prev => [...prev, result]);
      setUrl(inputUrl);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setError('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const captureWithScreenshotUrl = async (inputUrl, options = {}) => {
    try {
      console.log('Using Screenshot URL backend for:', inputUrl);
      console.log('Capture options:', options);
      console.log('Current environment:', process.env.NODE_ENV);
      console.log('Current location:', window.location.href);
      
      // Dynamic API URL - use Railway URL in production, localhost in development
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin  // Use current domain (Railway URL)
        : 'http://localhost:5000'; // Use localhost in development (match backend port)
      
      console.log('API Base URL:', apiBaseUrl);
      console.log('Full API endpoint:', `${apiBaseUrl}/api/screenshot`);
      
      // Call the Screenshot URL backend
      const requestBody = {
        url: inputUrl,
        width: 1200,
        height: 800,
        fullPage: true, // Always capture full page
        captureMode: options.captureMode || 'both',
        mobileDevices: options.mobileDevices || ['iPhone 12', 'Samsung Galaxy S21'],
        captureFonts: true,
        captureColors: true
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(`${apiBaseUrl}/api/screenshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      // Debug logging to see the actual response structure
      console.log('🔍 Backend response structure:', {
        success: responseData.success,
        hasScreenshots: !!responseData.screenshots,
        screenshotsKeys: responseData.screenshots ? Object.keys(responseData.screenshots) : [],
        hasAnalysis: !!responseData.analysis,
        analysisKeys: responseData.analysis ? Object.keys(responseData.analysis) : []
      });
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Screenshot capture failed');
      }
      
      // Validate response structure
      if (!responseData.screenshots || !responseData.screenshots.desktop || !responseData.screenshots.desktop.base64) {
        console.error('❌ Invalid response structure:', responseData);
        throw new Error('Backend returned invalid response structure');
      }
      
      const desktopDataUrl = `data:image/png;base64,${responseData.screenshots.desktop.base64}`;
      
      // Handle multiple mobile devices
      const mobileScreenshots = responseData.screenshots.mobile.map(device => ({
        device: device.device,
        dataUrl: `data:image/png;base64,${device.screenshot}`,
        width: device.viewport.width,
        height: device.viewport.height,
        userAgent: device.userAgent
      }));
      
      return {
        url: inputUrl,
        method: 'Screenshot URL',
        screenshots: {
          desktop: {
            dataUrl: desktopDataUrl,
            width: 1200,
            height: 800
          },
          mobile: mobileScreenshots
        },
        designAnalysis: responseData.designAnalysis,
        captureMode: responseData.captureMode,
        mobileDevices: responseData.mobileDevices
      };
      
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  };

  return (
    <div className="app">
      <Navigation />
      
      {/* Home Section */}
      <section id="home" className="home-section">
        <header className="app-header">
          <h1>Website Screenshot Capture</h1>
          <p>Capture and analyze website screenshots with design insights</p>
          
          <div className="mode-selector">
            <button 
              className={`mode-btn ${activeMode === 'sync' ? 'active' : ''}`}
              onClick={() => setActiveMode('sync')}
            >
              🔄 Sync Mode
            </button>
            <button 
              className={`mode-btn ${activeMode === 'async' ? 'active' : ''}`}
              onClick={() => setActiveMode('async')}
            >
              ⚡ Async Mode
            </button>
          </div>
        </header>

        <main className="app-main">
          {activeMode === 'sync' ? (
            <>
              <UrlInput onSubmit={handleUrlSubmit} isCapturing={isCapturing} />
              {error && (
                <div className="error-message" style={{ color: '#dc3545', textAlign: 'center', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <ScreenshotResults results={screenshotResults} />
            </>
          ) : (
            <AsyncScreenshotCapture />
          )}
        </main>
      </section>

      {/* Content Sections */}
      <ContentSections />
    </div>
  );
}

export default App;
