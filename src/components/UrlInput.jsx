import React, { useState } from 'react';

const UrlInput = ({ onSubmit, isCapturing }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url);
      setUrl('');
    }
  };

  return (
    <div className="url-input">
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL (e.g., https://example.com)"
          required
          disabled={isCapturing}
        />
        <button type="submit" disabled={isCapturing}>
          {isCapturing ? '⏳ Capturing...' : 'Capture Screenshot'}
        </button>
      </form>
    </div>
  );
};

export default UrlInput;
