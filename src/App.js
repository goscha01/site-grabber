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
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeMode, setActiveMode] = useState('sync');

  const handleUrlSubmit = async (inputUrl) => {
    setUrl(inputUrl);
    setIsCapturing(true);
    setIsAnalyzing(true);

    try {
      const result = await captureWithScreenshotUrl(inputUrl);
      setScreenshotResults([result]);
      setAnalysisData(result.designAnalysis);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    } finally {
      setIsCapturing(false);
      setIsAnalyzing(false);
    }
  };

  const captureWithScreenshotUrl = async (inputUrl) => {
    try {
      console.log('Using Screenshot URL backend for:', inputUrl);
      console.log('Current environment:', process.env.NODE_ENV);
      console.log('Current location:', window.location.href);
      
      // Dynamic API URL - use Railway URL in production, localhost in development
      const apiBaseUrl = process.env.NODE_ENV === 'production' 
        ? window.location.origin  // Use current domain (Railway URL)
        : 'http://localhost:3001'; // Use localhost in development (match backend port)
      
      console.log('API Base URL:', apiBaseUrl);
      console.log('Full API endpoint:', `${apiBaseUrl}/api/screenshot`);
      
      // Call the Screenshot URL backend
      const requestBody = {
        url: inputUrl,
        width: 1200,
        height: 800,
        fullPage: true // Always capture full page
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
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Screenshot capture failed');
      }
      
      const dataUrl = `data:image/png;base64,${responseData.screenshot}`;
      
      return {
        method: 'Screenshot URL',
        imageData: dataUrl,
        width: 1200,
        height: 800,
        designAnalysis: responseData.designAnalysis
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
              <ScreenshotResults results={screenshotResults} url={url} />
              <DesignAnalysisPanel 
                analysisData={analysisData}
                isLoading={isAnalyzing}
              />
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
