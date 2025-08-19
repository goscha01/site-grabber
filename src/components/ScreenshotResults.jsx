import React, { useState } from 'react';
import { saveAs } from 'file-saver';

const ScreenshotResults = ({ results, url }) => {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!url || Object.keys(results).length === 0) {
    return (
      <section className="screenshot-results">
        <h2>Screenshot Results</h2>
        <p>Enter a URL above to capture screenshots using different methods.</p>
      </section>
    );
  }

  const downloadScreenshot = (imageData, method, filename) => {
    try {
      // Convert data URL to blob
      const response = fetch(imageData);
      response.then(res => res.blob()).then(blob => {
        saveAs(blob, `${filename}_${method}.png`);
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };



  const openImageModal = (imageData, method) => {
    setSelectedImage({ imageData, method });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <section className="screenshot-results">
        <div className="results-grid">
          {Object.entries(results).map(([method, result]) => (
            <div key={method} className="result-card">
              <div className="result-header">
                <h3>{result.method || method}</h3>
              </div>
              
              <div className="result-content">
                <div className="screenshot-container">
                  <Thumbnail 
                    imageData={result.imageData} 
                    method={method}
                    onClick={() => openImageModal(result.imageData, method)}
                  />
                  <div className="thumbnail-overlay">
                    <span>🔍 Click to view full page</span>
                  </div>
                </div>
                
                <div className="screenshot-info">
                  <div className="info-item">
                    <span>Dimensions:</span>
                    <span>{result.width} × {result.height}</span>
                  </div>
                  
                  <div className="screenshot-actions">
                    <button 
                      onClick={() => downloadScreenshot(
                        result.imageData, 
                        method, 
                        url.replace(/[^a-zA-Z0-9]/g, '_')
                      )}
                      className="download-btn"
                      disabled={!result.imageData.startsWith('data:image/')}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Screenshot - {selectedImage.method}</h3>
              <button className="close-btn" onClick={closeImageModal}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <img 
                src={selectedImage.imageData} 
                alt={`Full size screenshot using ${selectedImage.method}`}
                className="modal-image"
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => downloadScreenshot(
                  selectedImage.imageData, 
                  selectedImage.method, 
                  url.replace(/[^a-zA-Z0-9]/g, '_')
                )}
                className="download-btn"
              >
                📥 Download Full Size
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Thumbnail component that shows only the viewport part
const Thumbnail = ({ imageData, method, onClick }) => {
  const [thumbnailSrc, setThumbnailSrc] = React.useState(null);

  const createThumbnail = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set thumbnail dimensions
        const thumbnailWidth = 400;
        const thumbnailHeight = 300;
        
        canvas.width = thumbnailWidth;
        canvas.height = thumbnailHeight;
        
        // Scale the image so its width matches the thumbnail width exactly
        const scale = thumbnailWidth / img.width;
        const scaledWidth = thumbnailWidth; // Exactly 400px
        const scaledHeight = img.height * scale;
        
        // Calculate how much of the height we can show
        // We want to show the top portion that fits within our thumbnail height
        const visibleHeight = Math.min(scaledHeight, thumbnailHeight);
        
        // Calculate the source height to crop from the original image
        const sourceHeight = (visibleHeight / scale);
        
        // Center the image horizontally, show from top vertically
        const x = 0; // Start from left edge
        const y = (thumbnailHeight - visibleHeight) / 2; // Center vertically if image is shorter
        
        // Draw the image scaled to thumbnail width, showing only the top visible portion
        ctx.drawImage(
          img, 
          0, 0, img.width, sourceHeight,        // Source: full width, top portion of height
          x, y, scaledWidth, visibleHeight      // Destination: full thumbnail width, visible height
        );
        
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageData;
    });
  };

  React.useEffect(() => {
    if (imageData) {
      createThumbnail(imageData).then(setThumbnailSrc);
    }
  }, [imageData]);

  if (!thumbnailSrc) {
    return (
      <div className="thumbnail-loading">
        <div className="spinner"></div>
        <span>Loading thumbnail...</span>
      </div>
    );
  }

  return (
    <img 
      src={thumbnailSrc} 
      alt={`Thumbnail using ${method}`}
      className="screenshot-thumbnail"
      onClick={onClick}
      title="Click to view full page"
    />
  );
};

export default ScreenshotResults;
