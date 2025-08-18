# 🚀 Async Screenshot Features

## Overview
Your site grabber has been upgraded to support async job processing, handling 5-10 second operations gracefully with progress tracking and batch processing capabilities.

## ✨ New Features

### 🔄 **Dual Modes**
- **Sync Mode**: Original synchronous screenshot capture
- **Async Mode**: New async processing with job queues

### ⚡ **Async Processing**
- **Job Queues**: Bull queues with Redis backend
- **Progress Tracking**: Real-time progress bars
- **Batch Processing**: Handle multiple URLs simultaneously
- **Error Handling**: Automatic retries with exponential backoff

### 🎨 **Enhanced Analysis**
- **Color Extraction**: Vibrant color palette analysis
- **Font Detection**: Comprehensive font family detection
- **Metadata**: Page title, description, favicon extraction

## 🛠️ **API Endpoints**

### **Async Screenshot**
```http
POST /api/screenshot-async
Content-Type: application/json

{
  "url": "https://example.com",
  "options": {
    "fullPage": true,
    "captureColors": true,
    "captureFonts": true,
    "width": 1920,
    "height": 1080
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "123",
  "status": "queued",
  "estimatedTime": "10-20 seconds",
  "statusEndpoint": "/api/job/123"
}
```

### **Job Status**
```http
GET /api/job/{jobId}
```

**Response:**
```json
{
  "jobId": "123",
  "status": "completed",
  "progress": 100,
  "result": {
    "screenshot": { "base64": "..." },
    "analysis": {
      "colors": { "dominantColors": ["#ff0000", "#00ff00"] },
      "fonts": { "unique": ["Arial", "Helvetica"] }
    }
  }
}
```

### **Batch Processing**
```http
POST /api/batch-screenshot
Content-Type: application/json

{
  "urls": [
    "https://example1.com",
    "https://example2.com",
    "https://example3.com"
  ],
  "options": { "fullPage": true }
}
```

### **Queue Statistics**
```http
GET /api/queue/stats
```

## 🎯 **Usage Examples**

### **Single Screenshot**
```javascript
const response = await fetch('/api/screenshot-async', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    options: { fullPage: true, captureColors: true }
  })
});

const { jobId } = await response.json();

// Poll for completion
const status = await fetch(`/api/job/${jobId}`);
const result = await status.json();
```

### **Batch Processing**
```javascript
const response = await fetch('/api/batch-screenshot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    urls: ['https://site1.com', 'https://site2.com'],
    options: { fullPage: true }
  })
});

const { jobs } = await response.json();
// Monitor all jobs for completion
```

## 🔧 **Configuration**

### **Environment Variables**
```env
NODE_ENV=development
PORT=5000
REDIS_URL=redis://localhost:6379
```

### **Redis Setup**
```bash
# Install Redis (Ubuntu/Debian)
sudo apt-get install redis-server

# Install Redis (macOS)
brew install redis

# Start Redis
redis-server

# Test connection
redis-cli ping
```

## 📊 **Queue Management**

### **Job States**
- **waiting**: Queued, waiting for worker
- **active**: Currently being processed
- **completed**: Successfully finished
- **failed**: Failed with error

### **Concurrency**
- Default: 2 concurrent jobs
- Configurable in `workers/index.js`
- Automatic retry on failure

### **Job Cleanup**
- Completed jobs: Removed after 50
- Failed jobs: Removed after 50
- Configurable in queue options

## 🚀 **Deployment**

### **Local Development**
```bash
# Install dependencies
npm install

# Start Redis
redis-server

# Start server with workers
npm run server:dev
```

### **Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway add redis
railway up
```

## 📱 **Frontend Integration**

### **React Hook**
```javascript
import { useAsyncScreenshot } from './hooks/useAsyncScreenshot';

const { 
  jobs, 
  captureScreenshot, 
  batchCapture,
  activeJobs,
  completedJobs 
} = useAsyncScreenshot();
```

### **Component Usage**
```jsx
<AsyncScreenshotCapture />
```

## 🔍 **Monitoring**

### **Health Check**
```http
GET /api/health
```

### **Queue Stats**
```http
GET /api/queue/stats
```

### **Logs**
- Job start/completion/failure events
- Progress updates every 2 seconds
- Error details with stack traces

## 🎨 **Design Analysis Features**

### **Color Extraction**
- Dominant color detection
- Color palette generation
- RGB/HSL color values
- Population-based sorting

### **Font Detection**
- Unique font families
- Font usage examples
- Element-specific font data
- System font filtering

### **Metadata**
- Page title and description
- Favicon URL
- Viewport settings
- Processing timestamps

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Redis Connection Failed**
   - Ensure Redis is running
   - Check REDIS_URL environment variable
   - Verify Redis port (default: 6379)

2. **Jobs Stuck in Waiting**
   - Check worker processes
   - Verify queue configuration
   - Check Redis memory usage

3. **Screenshot Failures**
   - Check Puppeteer installation
   - Verify target URL accessibility
   - Check browser launch arguments

### **Debug Commands**
```bash
# Check Redis status
redis-cli info

# Monitor queue
redis-cli monitor

# Check server logs
npm run server:dev
```

## 📈 **Performance**

### **Benchmarks**
- **Single Screenshot**: 10-20 seconds
- **Batch Processing**: 15-25 seconds per URL
- **Concurrent Jobs**: 2 simultaneous
- **Memory Usage**: ~200MB per job

### **Scaling**
- Increase worker concurrency
- Add Redis clustering
- Implement job prioritization
- Add load balancing

## 🔮 **Future Enhancements**

- [ ] Job prioritization
- [ ] Scheduled jobs
- [ ] Webhook notifications
- [ ] Job cancellation
- [ ] Advanced retry strategies
- [ ] Performance metrics dashboard
- [ ] Email notifications
- [ ] Slack/Discord integration

---

**🎉 Your site grabber is now production-ready with async processing!**

