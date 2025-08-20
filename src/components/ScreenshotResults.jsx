import React, { useState } from 'react';
import DesignAnalysisPanel from './DesignAnalysisPanel';

// Thumbnail component that shows only the viewport part
const Thumbnail = ({ screenshot, method, width, height, onClick, className }) => {
  const [thumbnailSrc, setThumbnailSrc] = React.useState(null);

  const createThumbnail = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set thumbnail dimensions based on device type
        let thumbnailWidth, thumbnailHeight;
        if (width <= 400) { // Mobile
          thumbnailWidth = 200;
          thumbnailHeight = 300;
        } else { // Desktop
          thumbnailWidth = 400;
          thumbnailHeight = 300;
        }
        
        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;
        
        // Scale the image so its width matches the thumbnail width exactly
        const scale = thumbnailWidth / img.width;
        const scaledWidth = thumbnailWidth;
        const scaledHeight = img.height * scale;
        
        // Calculate how much of the height we can show
        const visibleHeight = Math.min(scaledHeight, thumbnailHeight);
        
        // Calculate the source height to crop from the original image
        const sourceHeight = (visibleHeight / scale);
        
        // Center the image horizontally, show from top vertically
        const x = 0;
        const y = (thumbnailHeight - visibleHeight) / 2;
        
        // Draw the image scaled to thumbnail width, showing only the top visible portion
        ctx.drawImage(
          img, 
          0, 0, img.width, sourceHeight,
          x, y, scaledWidth, visibleHeight
        );
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  };

  React.useEffect(() => {
    if (screenshot.dataUrl) {
      createThumbnail(screenshot.dataUrl).then(setThumbnailSrc);
    }
  }, [screenshot.dataUrl]);

  if (!thumbnailSrc) {
    const isMobile = width <= 400;
    return (
      <div className={`thumbnail-loading ${isMobile ? 'mobile' : ''}`}>
        <div className="spinner"></div>
        <span>Loading thumbnail...</span>
      </div>
    );
  }

  return (
    <img 
      src={thumbnailSrc} 
      alt={`Thumbnail using ${method}`}
      className={`screenshot-thumbnail ${className || ''}`}
      title="Click to view full page"
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    />
  );
};

// Full Screenshot Modal Component
const FullScreenshotModal = ({ isOpen, screenshot, onClose, deviceName }) => {
  if (!isOpen) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Full Screenshot - {deviceName}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-content">
          <img 
            src={screenshot.dataUrl} 
            alt={`Full screenshot using ${screenshot.method || 'Screenshot URL'}`}
            className="modal-image"
          />
        </div>
        <div className="modal-actions">
          <a
            href={screenshot.dataUrl}
            download={`${deviceName}-screenshot.png`}
            className="download-btn"
          >
            Download Full Screenshot
          </a>
        </div>
      </div>
    </div>
  );
};

const ScreenshotResults = ({ results }) => {
  const [selectedMobileDevice, setSelectedMobileDevice] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalScreenshot, setModalScreenshot] = useState(null);
  const [modalDeviceName, setModalDeviceName] = useState('');

  if (!results || results.length === 0) return null;

  const result = results[results.length - 1];
  console.log('ScreenshotResults - result:', result); // Debug log
  
  const hasMobileScreenshots = result.screenshots?.mobile && result.screenshots.mobile.length > 0;
  const availableMobileDevices = result.screenshots?.mobile || [];

  const openModal = (screenshot, deviceName) => {
    setModalScreenshot(screenshot);
    setModalDeviceName(deviceName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalScreenshot(null);
    setModalDeviceName('');
  };

  return (
    <div className="screenshot-results">
      <div className="screenshots-container">
        {/* Desktop Screenshot */}
        <div className="screenshot-section">
          <h4>Desktop</h4>
          <Thumbnail
            screenshot={result.screenshots.desktop}
            method={result.method}
            width={result.screenshots.desktop.width}
            height={result.screenshots.desktop.height}
            onClick={() => openModal(result.screenshots.desktop, 'Desktop')}
            className="desktop"
          />
          <div className="thumbnail-hint">Click thumbnail to view full screenshot</div>
          <a
            href={result.screenshots.desktop.dataUrl}
            download={`desktop-${result.url.replace(/[^a-zA-Z0-9]/g, '-')}.png`}
            className="download-btn"
          >
            Download Desktop
          </a>
        </div>

        {/* Mobile Screenshot */}
        {hasMobileScreenshots && (
          <div className="screenshot-section">
            <h4>Mobile</h4>
            <Thumbnail
              screenshot={availableMobileDevices[selectedMobileDevice]}
              method={result.method}
              width={availableMobileDevices[selectedMobileDevice].width}
              height={availableMobileDevices[selectedMobileDevice].height}
              onClick={() => openModal(availableMobileDevices[selectedMobileDevice], availableMobileDevices[selectedMobileDevice].device)}
              className="mobile"
            />
            <div className="thumbnail-hint">Click thumbnail to view full screenshot</div>
            <a
              href={availableMobileDevices[selectedMobileDevice].dataUrl}
              download={`mobile-${availableMobileDevices[selectedMobileDevice].device}-${result.url.replace(/[^a-zA-Z0-9]/g, '-')}.png`}
              className="download-btn"
            >
              Download {availableMobileDevices[selectedMobileDevice].device}
            </a>
            
            {/* Device Selector Dropdown */}
            {availableMobileDevices.length > 1 && (
              <div className="device-selector">
                <label htmlFor="mobile-device-select">Switch Device:</label>
                <select
                  id="mobile-device-select"
                  value={selectedMobileDevice}
                  onChange={(e) => setSelectedMobileDevice(parseInt(e.target.value))}
                >
                  {availableMobileDevices.map((device, index) => (
                    <option key={index} value={index}>
                      {device.device}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Design Analysis */}
      {result.designAnalysis && (
        <DesignAnalysisPanel analysis={result.designAnalysis} />
      )}

      {/* Full Screenshot Modal */}
      <FullScreenshotModal
        isOpen={modalOpen}
        screenshot={modalScreenshot}
        onClose={closeModal}
        deviceName={modalDeviceName}
      />
    </div>
  );
};

export default ScreenshotResults;
