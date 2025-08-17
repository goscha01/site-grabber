# 🔧 Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. Server Returns 500 Error

**Symptoms:**
- Frontend shows "Failed to capture screenshot"
- Backend logs show error details

**Solutions:**
1. **Check if server is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check server logs** for detailed error messages

3. **Verify Puppeteer installation:**
   ```bash
   npm list puppeteer
   ```

### 2. Puppeteer Browser Launch Fails

**Common causes:**
- Chrome/Chromium not installed
- Insufficient permissions
- Missing dependencies

**Solutions:**
1. **Install Chrome/Chromium:**
   - Windows: Download from https://www.google.com/chrome/
   - macOS: `brew install --cask google-chrome`
   - Linux: `sudo apt-get install chromium-browser`

2. **Use system Chrome:**
   ```javascript
   // In server.js, change launch options:
   browser = await puppeteer.launch({
     headless: true,
     executablePath: '/usr/bin/google-chrome', // Path to your Chrome
     args: ['--no-sandbox']
   });
   ```

3. **Install Puppeteer with system Chrome:**
   ```bash
   npm uninstall puppeteer
   npm install puppeteer-core
   ```

### 3. Build Folder Missing

**Symptoms:**
- Server can't serve React app
- 404 errors on frontend routes

**Solution:**
```bash
npm run build
```

### 4. Port Already in Use

**Symptoms:**
- "EADDRINUSE" error
- Server won't start

**Solutions:**
1. **Change port:**
   ```bash
   PORT=5001 npm run server
   ```

2. **Kill existing process:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   ```

### 5. CORS Issues

**Symptoms:**
- Frontend can't connect to backend
- "Access-Control-Allow-Origin" errors

**Solution:**
Backend already has CORS enabled. If issues persist:
```javascript
// In server.js, add more CORS options:
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
```

## 🧪 Testing Steps

### 1. Test Server Health
```bash
curl http://localhost:5000/api/health
```

### 2. Test Basic Response
```bash
curl http://localhost:5000/api/test
```

### 3. Test Screenshot Endpoint
```bash
curl -X POST http://localhost:5000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## 📋 Debug Checklist

- [ ] Server is running (`npm run server`)
- [ ] Build folder exists (`npm run build`)
- [ ] Puppeteer is installed (`npm list puppeteer`)
- [ ] Chrome/Chromium is available
- [ ] Port 5000 is free
- [ ] No firewall blocking connections
- [ ] Node.js version is 16+ (`node --version`)

## 🆘 Still Having Issues?

1. **Check server logs** for detailed error messages
2. **Try direct server start:** `npm run server:direct`
3. **Test with minimal URL:** `https://example.com`
4. **Check system resources** (memory, disk space)
5. **Verify network connectivity** to target URLs

## 📞 Common Error Messages

- **"Browser launch failed"** → Chrome/Chromium issue
- **"Navigation failed"** → Network/URL issue
- **"Screenshot capture failed"** → Page rendering issue
- **"Module not found"** → Dependency issue
- **"page.waitForTimeout is not a function"** → Puppeteer version compatibility issue (fixed in latest code)
