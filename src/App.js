import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import ScreenshotResults from './components/ScreenshotResults';
import DesignAnalysisPanel from './components/DesignAnalysisPanel';
import AsyncScreenshotCapture from './components/AsyncScreenshotCapture';
import './styles/app.css';

function App() {
  const [url, setUrl] = useState('');
  const [screenshotResults, setScreenshotResults] = useState({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeMode, setActiveMode] = useState('sync'); // 'sync' or 'async'

  const handleUrlSubmit = async (inputUrl) => {
    if (!inputUrl) return;
    
    setUrl(inputUrl);
    setIsCapturing(true);
    
    try {
      const result = await captureWithPuppeteer(inputUrl);
      setScreenshotResults({ puppeteer: result });
      
      // Set design analysis data if available
      if (result.designAnalysis) {
        setAnalysisData(result.designAnalysis);
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };



  const captureWithPuppeteer = async (inputUrl) => {
    try {
      console.log('Using real Puppeteer backend for:', inputUrl);
      
      // Call the real Puppeteer backend
      const requestBody = {
        url: inputUrl,
        width: 1200,
        height: 800,
        fullPage: true // Always capture full page
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('http://localhost:5000/api/screenshot', {
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
        method: 'Puppeteer',
        imageData: dataUrl,
        width: 1200,
        height: 800,
        note: 'Full page screenshot captured using Puppeteer backend',
        designAnalysis: responseData.designAnalysis
      };
      
    } catch (error) {
      console.error('Puppeteer capture failed:', error);
      throw error;
    }
  };

  return (
    <div className="app">
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
    </div>
  );
}

export default App;
