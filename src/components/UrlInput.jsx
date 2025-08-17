import React, { useState } from 'react';

const UrlInput = ({ onSubmit, isCapturing }) => {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onSubmit(inputUrl.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <section className="url-input">
      <h2>Enter Website URL</h2>
      <form onSubmit={handleSubmit} className="url-form">
        <div className="input-group">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https://example.com"
            className="url-input-field"
            disabled={isCapturing}
            required
          />
          <button 
            type="submit" 
            className="parse-btn"
            disabled={isCapturing || !inputUrl.trim()}
          >
            {isCapturing ? '⏳ Capturing...' : '📸 Capture Screenshot'}
          </button>
        </div>
        <p className="url-help">
          Enter a valid website URL to capture screenshots using different methods
        </p>
      </form>
    </section>
  );
};

export default UrlInput;
