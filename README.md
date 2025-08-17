# Website Screenshot Capture

A React-based web application to capture screenshots of websites using Puppeteer backend. Users can enter a URL and capture high-quality screenshots with full-page support.

## Features

### URL Input
- **URL Field**: Enter any website URL to capture
- **Real-time Validation**: Ensures valid URL format
- **Capture Button**: Initiates screenshot capture with Puppeteer

### Screenshot Capture Method
**🤖 Puppeteer** - Headless Chrome automation (server-side) for high-quality screenshots

### Core Functionality
- **URL Submission**: Enter any website URL to capture
- **Puppeteer Capture**: High-quality screenshots using headless Chrome
- **Full Page Support**: Toggle between viewport-only and full-page screenshots
- **Screenshot Display**: View captured images with download options
- **Performance Metrics**: Display capture time and success status
- **Error Handling**: Graceful handling of capture failures with user feedback

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Build the React app**:
   ```bash
   npm run build
   ```

## Usage

### Option 1: Full-Stack with Puppeteer Backend (Recommended)
1. **Start the backend server**:
   ```bash
   npm run server
   ```

2. **Open your browser** and navigate to `http://localhost:5000`

### Option 2: Frontend Only (Limited Functionality)
1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Capture website screenshots**:
   - Enter a website URL in the input field
   - Click "Capture Screenshot" to capture the site
   - View the captured screenshot
   - Download the screenshot directly

## Project Structure

```
src/
├── components/
│   ├── UrlInput.jsx           # URL input form
│   ├── ScreenshotResults.jsx  # Display captured screenshots
│   └── PerformanceMetrics.jsx # Timing and error info
├── styles/
│   └── app.css                # Main app styles
└── App.js                     # Main application component
```

## Dependencies

- **React 18** - UI framework
- **file-saver** - File download functionality
- **Express.js** - Backend server framework
- **Puppeteer** - Headless Chrome automation

## Key Capture Scenarios

### Screenshot Quality Features
- **Full page capture**: Entire scrollable content
- **High resolution**: 1200x800 viewport with scaling
- **JavaScript support**: Dynamic content rendering
- **Cross-browser compatibility**: Works with any website

### Performance Features
- **Fast capture**: Optimized Puppeteer configuration
- **Error handling**: Graceful fallbacks and user feedback
- **Download options**: Direct PNG file downloads
- **Real-time metrics**: Capture time and success tracking

## Browser Compatibility

The app works best in modern browsers that support:
- ES6+ JavaScript features
- Canvas API
- File API for downloads
- Modern CSS properties

## Known Limitations

- **Puppeteer Backend**: Requires Node.js and Chrome/Chromium installation
- **Complex Sites**: Some websites may not render identically
- **Browser Differences**: Results may vary between browsers

## 🚀 Backend Setup

For full functionality including real website screenshots, see [BACKEND_SETUP.md](./BACKEND_SETUP.md).

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Contributing

Feel free to:
- Improve screenshot quality
- Enhance error handling
- Add new performance metrics
- Report bugs or suggest features

## License

This project is open source and available under the MIT License.
