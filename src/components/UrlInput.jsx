import React, { useState, useEffect } from 'react';

const UrlInput = ({ onSubmit, isCapturing, currentUrl }) => {
  const [url, setUrl] = useState(currentUrl || '');

  // Update local state when currentUrl prop changes
  useEffect(() => {
    if (currentUrl) {
      setUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url);
      setUrl('');
    }
  };

  return (
    <div className="url-input">
      {currentUrl && (
        <div className="current-url-display">
          <span className="current-url-label">📋 Current URL:</span>
          <span className="current-url-value">{currentUrl}</span>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL (e.g., https://example.com)"
          required
          disabled={isCapturing}
          className={isCapturing ? 'capturing' : ''}
        />
        <button type="submit" disabled={isCapturing}>
          {isCapturing ? '⏳ Capturing...' : 'Capture Screenshot'}
        </button>
      </form>
    </div>
  );
};

export default UrlInput;
