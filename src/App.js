import React, { useState } from 'react';
import UrlInput from './components/UrlInput';
import ScreenshotResults from './components/ScreenshotResults';
import PerformanceMetrics from './components/PerformanceMetrics';
import './styles/app.css';

function App() {
  const [url, setUrl] = useState('');
  const [screenshotResults, setScreenshotResults] = useState({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [performanceData, setPerformanceData] = useState({});


  const handleUrlSubmit = async (inputUrl) => {
    if (!inputUrl) return;
    
    setUrl(inputUrl);
    setIsCapturing(true);
    
    try {
      const startTime = performance.now();
      const result = await captureWithPuppeteer(inputUrl);
      const endTime = performance.now();
      
      setScreenshotResults({ puppeteer: result });
      setPerformanceData({
        puppeteer: {
          time: endTime - startTime,
          success: true,
          error: null
        }
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      setPerformanceData({
        puppeteer: {
          time: 0,
          success: false,
          error: error.message
        }
      });
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
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Convert blob to data URL
      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      return {
        imageData: dataUrl,
        width: 1200,
        height: 800,
        method: 'puppeteer',
        note: 'Real Puppeteer backend capture - Full Page - No CORS limitations!'
      };
    } catch (error) {
      console.error('Puppeteer backend error:', error);
      
      // Fallback to simulation if backend is not available
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        return {
          imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjYwMCIgeT0iNDAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlB1cHBldGVyIEJhY2tlbmQgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+',
          width: 1200,
          height: 800,
          method: 'puppeteer',
          note: 'Backend server not running. Start with: npm run server'
        };
      }
      
      return {
        imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI4MDAiIHZpZXdCb3g9IjAgMCAxMjAwIDgwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjYwMCIgeT0iNDAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlB1cHBldGVyIEVycm9yPC90ZXh0Pjwvc3ZnPg==',
        width: 1200,
        height: 800,
        method: 'puppeteer',
        note: `Error: ${error.message}`
      };
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Website Screenshot Capture</h1>
        <p>Capture screenshots of websites using Puppeteer backend</p>
        

      </header>
      
      <main className="app-main">
        <UrlInput onSubmit={handleUrlSubmit} isCapturing={isCapturing} />
        <ScreenshotResults results={screenshotResults} url={url} />
        <PerformanceMetrics data={performanceData} />
      </main>
    </div>
  );
}

export default App;
