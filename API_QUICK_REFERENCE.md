# 🚀 Site Grabber API - Quick Reference

## 🔑 **Essential Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Basic health check |
| `GET` | `/api/railway-health` | Railway deployment health |
| `GET` | `/api/queue/stats` | Queue statistics |
| `POST` | `/api/screenshot` | **Sync screenshot capture** |
| `POST` | `/api/screenshot-async` | **Async screenshot capture** |
| `GET` | `/api/job/{id}` | **Job status & results** |
| `POST` | `/api/batch-screenshot` | **Batch processing** |

---

## 📸 **Quick Screenshot Examples**

### **1. Simple Screenshot**
```bash
curl -X POST http://localhost:5000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### **2. Custom Size Screenshot**
```bash
curl -X POST http://localhost:5000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "width": 1920,
    "height": 1080,
    "fullPage": true
  }'
```

### **3. Async Screenshot with Options**
```bash
curl -X POST http://localhost:5000/api/screenshot-async \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": {
      "waitForSelector": ".content",
      "delay": 3000
    }
  }'
```

---

## 🔄 **Job Management**

### **Submit Async Job:**
```javascript
const response = await fetch('/api/screenshot-async', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

const { jobId } = await response.json();
```

### **Check Job Status:**
```javascript
const status = await fetch(`/api/job/${jobId}`);
const { status: jobStatus, result } = await status.json();

if (jobStatus === 'completed') {
  const screenshot = `data:image/png;base64,${result.screenshot}`;
  // Use screenshot...
}
```

---

## 🎨 **Design Analysis Results**

### **Colors & Fonts Structure:**
```json
{
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

---

## ⚡ **PowerShell Examples**

### **Health Check:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET
```

### **Screenshot Capture:**
```powershell
$body = @{
    url = "https://example.com"
    fullPage = $true
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/screenshot" -Method POST -Body $body -ContentType "application/json"
```

---

## 🚨 **Common Status Codes**

- `200` ✅ Success
- `400` ❌ Bad Request
- `404` ❌ Not Found  
- `500` ❌ Server Error
- `503` ⏳ Service Unavailable (starting up)

---

## 📱 **React Integration**

```javascript
// Custom hook usage
const { submitJob, jobStatus, isProcessing } = useAsyncScreenshot();

// Submit job
const handleCapture = async () => {
  const result = await submitJob({
    url: inputUrl,
    fullPage: true
  });
  
  console.log('Job ID:', result.jobId);
};
```

---

## 🔧 **Testing Commands**

```bash
# Health check
curl http://localhost:5000/api/health

# Queue stats  
curl http://localhost:5000/api/queue/stats

# Screenshot test
curl -X POST http://localhost:5000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://httpbin.org/html"}'
```

---

*For full documentation, see `API_DOCUMENTATION.md`*
