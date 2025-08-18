import React, { useState } from 'react';
import { useAsyncScreenshot } from '../hooks/useAsyncScreenshot';

const AsyncScreenshotCapture = () => {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState({
    fullPage: true,
    captureColors: true,
    captureFonts: true,
    width: 1920,
    height: 1080
  });
  
  const { 
    jobs, 
    isPolling, 
    captureScreenshot, 
    batchCapture,
    activeJobs,
    completedJobs 
  } = useAsyncScreenshot();

  const handleSingleCapture = async () => {
    if (!url) return;
    
    try {
      await captureScreenshot(url, options);
    } catch (error) {
      alert(`Failed to start capture: ${error.message}`);
    }
  };

  const handleBatchCapture = async () => {
    const urls = url.split('\n').filter(u => u.trim());
    if (urls.length === 0) return;
    
    try {
      await batchCapture(urls, options);
    } catch (error) {
      alert(`Failed to start batch capture: ${error.message}`);
    }
  };

  return (
    <div className="async-screenshot-capture">
      <div className="capture-form">
        <div className="url-input">
          <label>URL(s) - one per line for batch:</label>
          <textarea
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            rows={5}
          />
        </div>
        
        <div className="options">
          <label>
            <input
              type="checkbox"
              checked={options.fullPage}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                fullPage: e.target.checked
              }))}
            />
            Full Page Screenshot
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.captureColors}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                captureColors: e.target.checked
              }))}
            />
            Extract Color Palette
          </label>
          
          <label>
            <input
              type="checkbox"
              checked={options.captureFonts}
              onChange={(e) => setOptions(prev => ({
                ...prev,
                captureFonts: e.target.checked
              }))}
            />
            Detect Fonts
          </label>
        </div>
        
        <div className="actions">
          <button 
            onClick={handleSingleCapture}
            disabled={!url || isPolling}
          >
            Capture Screenshot
          </button>
          
          <button 
            onClick={handleBatchCapture}
            disabled={!url || isPolling}
          >
            Batch Capture
          </button>
        </div>
      </div>
      
      <div className="stats">
        <p>Active: {activeJobs} | Completed: {completedJobs}</p>
      </div>
      
      <div className="jobs-list">
        {Object.values(jobs).map(job => (
          <JobProgress key={job.jobId} job={job} />
        ))}
      </div>
    </div>
  );
};

const JobProgress = ({ job }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'failed': return '#dc3545';
      case 'active': return '#007bff';
      default: return '#6c757d';
    }
  };

  const downloadScreenshot = () => {
    if (job.result?.screenshot?.base64) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${job.result.screenshot.base64}`;
      link.download = `screenshot-${job.data?.url || job.url || 'unknown'}.png`;
      link.click();
    }
  };

  return (
    <div className="job-progress">
      <div className="job-header">
        <span className="job-url">{job.data?.url || job.url}</span>
        <span 
          className="job-status"
          style={{ color: getStatusColor(job.status) }}
        >
          {job.status}
        </span>
      </div>
      
      {job.progress !== undefined && job.status === 'active' && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${job.progress}%`,
              backgroundColor: getStatusColor(job.status)
            }}
          />
        </div>
      )}
      
      {job.status === 'completed' && job.result && (
        <div className="job-results">
          <div className="screenshot-preview">
            <img 
              src={`data:image/png;base64,${job.result.screenshot.base64}`}
              alt="Screenshot"
              style={{ maxWidth: '300px', maxHeight: '200px' }}
            />
            <button onClick={downloadScreenshot}>Download</button>
          </div>
          
          {job.result.analysis?.colors && (
            <div className="colors-preview">
              <h4>Colors:</h4>
              <div className="color-palette">
                {job.result.analysis.colors.dominantColors?.map((color, i) => (
                  <div 
                    key={i}
                    className="color-swatch"
                    style={{ 
                      backgroundColor: color,
                      width: '30px',
                      height: '30px',
                      display: 'inline-block',
                      margin: '2px'
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
          
          {job.result.analysis?.fonts && (
            <div className="fonts-preview">
              <h4>Fonts ({job.result.analysis.fonts.totalCount}):</h4>
              <div className="fonts-list">
                {job.result.analysis.fonts.unique?.slice(0, 5).map((font, i) => (
                  <span key={i} className="font-tag">
                    {font}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {job.status === 'failed' && (
        <div className="error-details">
          Error: {job.error}
        </div>
      )}
    </div>
  );
};

export default AsyncScreenshotCapture;

