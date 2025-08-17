# 🚀 Puppeteer Backend Setup

This backend server uses Puppeteer to capture real website screenshots, bypassing all CORS and browser limitations.

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the React app:**
   ```bash
   npm run build
   ```

## 🚀 Running the Backend

### Option 1: Production Mode
```bash
npm run server
```

### Option 2: Development Mode (with auto-restart)
```bash
npm run server:dev
```

The server will start on **port 5000** and serve both the API and the React app.

## 📸 API Endpoints

### POST `/api/screenshot`
Captures a screenshot of any website. Supports both viewport-only and full-page screenshots.

**Request Body:**
```json
{
  "url": "https://example.com",
  "width": 1200,
  "height": 800,
  "fullPage": true
}
```

**Response:** PNG image file

**Parameters:**
- `url` (required): Website URL to capture
- `width` (optional): Viewport width (default: 1200)
- `height` (optional): Viewport height (default: 800)  
- `fullPage` (optional): Capture entire page vs viewport only (default: false)

### GET `/api/health`
Health check endpoint.

## 🌐 Frontend Integration

The React app automatically connects to `http://localhost:5000` for Puppeteer screenshots.

## 🔧 Configuration

- **Port:** Set with `PORT` environment variable (default: 5000)
- **Puppeteer:** Uses headless Chrome with optimized flags
- **CORS:** Enabled for local development
- **Static Files:** Serves the built React app

## 🚨 Troubleshooting

### Puppeteer Installation Issues
If Puppeteer fails to install:
```bash
npm install puppeteer@latest --unsafe-perm=true
```

**Note:** We're using Puppeteer 24.9.0+ which is the latest supported version.

### Port Already in Use
Change the port:
```bash
PORT=5001 npm run server
```

### Chrome/Chromium Issues
The server uses system Chrome. Ensure Chrome is installed and accessible.

## 📱 Usage

1. **Start the backend:** `npm run server`
2. **Open the app:** `http://localhost:5000`
3. **Enter any URL** to capture real screenshots with Puppeteer!

## 🎯 Benefits

- ✅ **No CORS limitations**
- ✅ **Real browser rendering**
- ✅ **JavaScript execution support**
- ✅ **High-quality screenshots**
- ✅ **Works with any website**
