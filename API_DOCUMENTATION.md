# 🚀 Site Grabber API Documentation

## 📋 **Overview**
The Site Grabber API provides endpoints for capturing website screenshots, analyzing design elements (colors and fonts), and processing jobs asynchronously using an in-memory queue system.

**Base URL**: `https://your-railway-app.up.railway.app` (production) or `http://localhost:5000` (local)

---

## 🔍 **Health & Status Endpoints**

### **1. Health Check**
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-18T03:10:31.713Z",
  "queue": "in-memory",
  "port": "5000",
  "environment": "production",
  "uptime": 22.0564924
}
```

### **2. Railway Health Check**
```http
GET /api/railway-health
```

**Response (During Startup):**
```json
{
  "status": "starting",
  "timestamp": "2025-08-18T03:10:25.013Z",
  "message": "Server is still starting up...",
  "port": "5000",
  "environment": "production",
  "uptime": 5.2
}
```

**Response (Ready):**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-18T03:10:31.713Z",
  "message": "Railway health check passed",
  "port": "5000",
  "environment": "production",
  "uptime": 22.0564924,
  "memory": {
    "rss": 123456789,
    "heapTotal": 987654321,
    "heapUsed": 456789123,
    "external": 123456
  },
  "queue": "in-memory",
  "ready": true
}
```

### **3. Queue Status**
```http
GET /api/queue/status
```

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-08-18T03:10:31.713Z",
  "queue": "in-memory screenshot capture",
  "jobs": 0
}
```

### **4. Queue Statistics**
```http
GET /api/queue/stats
```

**Response:**
```json
{
  "waiting": 0,
  "active": 0,
  "completed": 5,
  "failed": 1,
  "total": 6,
  "timestamp": "2025-08-18T03:10:31.713Z"
}
```

---

## 📸 **Screenshot Capture Endpoints**

### **5. Synchronous Screenshot Capture**
```http
POST /api/screenshot
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "width": 1200,
  "height": 800,
  "fullPage": true
}
```

**Response:**
```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "url": "https://example.com",
  "timestamp": "2025-08-18T03:10:31.713Z",
  "designAnalysis": {
    "colors": {
      "primary": ["#ffffff", "#000000"],
      "background": ["#f5f5f5"],
      "text": ["#333333", "#666666"]
    },
    "fonts": {
      "headings": ["Arial", "Helvetica"],
      "body": ["Georgia", "Times New Roman"]
    }
  }
}
```

**Error Response:**
```json
{
  "error": "Screenshot capture failed",
  "details": "Navigation timeout",
  "stack": "Error: Navigation timeout..."
}
```

### **6. Asynchronous Screenshot Capture**
```http
POST /api/screenshot-async
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "width": 1200,
  "height": 800,
  "fullPage": true,
  "options": {
    "waitForSelector": ".content",
    "delay": 2000
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "12345",
  "message": "Screenshot job queued successfully",
  "timestamp": "2025-08-18T03:10:31.713Z",
  "estimatedTime": "10-30 seconds"
}
```

### **7. Get Job Status**
```http
GET /api/job/{jobId}
```

**Response:**
```json
{
  "jobId": "12345",
  "status": "completed",
  "progress": 100,
  "result": {
    "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
    "designAnalysis": {
      "colors": {
        "primary": ["#ffffff", "#000000"],
        "background": ["#f5f5f5"],
        "text": ["#333333", "#666666"]
      },
      "fonts": {
        "headings": ["Arial", "Helvetica"],
        "body": ["Georgia", "Times New Roman"]
      }
    }
  },
  "timestamp": "2025-08-18T03:10:31.713Z",
  "processingTime": "12.5 seconds"
}
```

**Job Statuses:**
- `waiting` - Job is in queue
- `active` - Job is being processed
- `completed` - Job finished successfully
- `failed` - Job failed with error

---

## 🔄 **Batch Processing Endpoints**

### **8. Batch Screenshot Capture**
```http
POST /api/batch-screenshot
```

**Request Body:**
```json
{
  "urls": [
    "https://example1.com",
    "https://example2.com",
    "https://example3.com"
  ],
  "options": {
    "width": 1200,
    "height": 800,
    "fullPage": true,
    "parallel": 2
  }
}
```

**Response:**
```json
{
  "success": true,
  "batchId": "batch_67890",
  "totalJobs": 3,
  "jobs": [
    {
      "url": "https://example1.com",
      "jobId": "12345"
    },
    {
      "url": "https://example2.com",
      "jobId": "12346"
    },
    {
      "url": "https://example3.com",
      "jobId": "12347"
    }
  ],
  "message": "Batch processing started",
  "timestamp": "2025-08-18T03:10:31.713Z"
}
```

---

## 🎨 **Design Analysis Endpoints**

### **9. Get Analysis Results**
```http
GET /api/analysis-results/{url}
```

**Response:**
```json
{
  "url": "https://example.com",
  "analysis": {
    "colors": {
      "primary": ["#ffffff", "#000000"],
      "background": ["#f5f5f5"],
      "text": ["#333333", "#666666"],
      "accent": ["#007bff", "#28a745"]
    },
    "fonts": {
      "headings": ["Arial", "Helvetica", "sans-serif"],
      "body": ["Georgia", "Times New Roman", "serif"],
      "monospace": ["Courier New", "monospace"]
    }
  },
  "timestamp": "2025-08-18T03:10:31.713Z"
}
```

---

## ⚙️ **Configuration & Options**

### **Screenshot Options:**
- `width` (number): Viewport width (default: 1200)
- `height` (number): Viewport height (default: 800)
- `fullPage` (boolean): Capture entire page (default: true)
- `waitForSelector` (string): Wait for specific CSS selector
- `delay` (number): Wait time in milliseconds after page load
- `parallel` (number): Number of parallel jobs for batch processing

### **Design Analysis Features:**
- **Color Extraction**: Primary, background, text, and accent colors
- **Font Detection**: Headings, body text, and monospace fonts
- **CSS Analysis**: Direct extraction from page stylesheets
- **Real-time Processing**: Analysis performed during screenshot capture

---

## 🚨 **Error Handling**

### **Common Error Codes:**
- `400` - Bad Request (invalid URL or parameters)
- `404` - Not Found (endpoint or resource not found)
- `500` - Internal Server Error (server processing error)
- `503` - Service Unavailable (server starting up)

### **Error Response Format:**
```json
{
  "error": "Error description",
  "details": "Detailed error information",
  "timestamp": "2025-08-18T03:10:31.713Z"
}
```

---

## 📱 **Frontend Integration**

### **React Hook Usage:**
```javascript
import { useAsyncScreenshot } from './hooks/useAsyncScreenshot';

const { submitJob, jobStatus, isProcessing } = useAsyncScreenshot();

const handleCapture = async () => {
  const result = await submitJob({
    url: 'https://example.com',
    width: 1200,
    height: 800,
    fullPage: true
  });
  
  console.log('Job submitted:', result.jobId);
};
```

### **Direct API Calls:**
```javascript
// Synchronous capture
const response = await fetch('/api/screenshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    fullPage: true
  })
});

const data = await response.json();
const screenshot = `data:image/png;base64,${data.screenshot}`;
```

---

## 🔧 **Development & Testing**

### **Local Development:**
```bash
# Start development server
npm run server:dev

# Start production server
npm run server

# Build React app
npm run build
```

### **Environment Variables:**
```env
NODE_ENV=production
PORT=5000
```

### **Testing Endpoints:**
```bash
# Health check
curl http://localhost:5000/api/health

# Screenshot capture
curl -X POST http://localhost:5000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## 📊 **Performance & Limits**

### **Queue System:**
- **In-memory queue** for job management
- **Automatic job processing** with workers
- **Real-time progress tracking**
- **Job timeout handling**

### **Screenshot Processing:**
- **Puppeteer-based** headless Chrome automation
- **Full-page capture** support
- **Custom viewport sizing**
- **Design analysis integration**

### **Batch Processing:**
- **Parallel job execution** (configurable)
- **Progress monitoring** for each job
- **Error handling** per individual job
- **Batch status tracking**

---

## 🚀 **Deployment**

### **Railway Deployment:**
- **Automatic builds** from GitHub
- **Health check monitoring**
- **Environment variable management**
- **Auto-scaling support**

### **Production Features:**
- **Optimized React build**
- **Compressed static assets**
- **Security headers** (Helmet)
- **CORS configuration**
- **Request logging** (Morgan)

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**
1. **Health check failures** - Check server startup logs
2. **Screenshot timeouts** - Verify URL accessibility
3. **Queue processing delays** - Monitor job status
4. **Memory usage** - Check server resources

### **Logs & Monitoring:**
- **Server startup logs** with detailed information
- **Job processing logs** for debugging
- **Error stack traces** for troubleshooting
- **Performance metrics** for optimization

---

## 🔗 **Related Resources**

- **GitHub Repository**: [site-grabber](https://github.com/goscha01/site-grabber)
- **Railway Dashboard**: [Deployment Status](https://railway.app)
- **Puppeteer Docs**: [Browser Automation](https://pptr.dev)
- **React Documentation**: [Frontend Framework](https://reactjs.org)

---

*Last Updated: August 18, 2025*
*Version: 1.0.0*
