# 🚀 Railway Deployment Guide

## Prerequisites

1. **GitHub Account**: Your code must be in a GitHub repository
2. **Railway Account**: Sign up at [railway.app](https://railway.app)
3. **Node.js**: Ensure your local environment has Node.js 18+

## 🚀 Deploy to Railway

### Step 1: Push Code to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "🚀 Ready for Railway deployment"

# Push to GitHub
git push origin main
```

### Step 2: Connect to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**
5. **Click "Deploy Now"**

### Step 3: Configure Environment Variables

In Railway dashboard, go to your project → Variables tab:

```env
NODE_ENV=production
PORT=5000
```

### Step 4: Deploy

1. **Railway will automatically detect the Node.js app**
2. **It will run `npm install` and `npm run build`**
3. **Then start the server with `npm start`**
4. **Your app will be available at `https://your-app.railway.app`**

## 🔧 Railway Configuration

### `railway.json`
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### `package.json` Scripts
```json
{
  "scripts": {
    "start": "node start-server.js",
    "build": "react-scripts build"
  }
}
```

## 🌐 Production Features

### ✅ What Works in Production:
- **Screenshot Capture**: Full Puppeteer functionality
- **Design Analysis**: Color and font extraction
- **Async Processing**: In-memory job queue
- **API Endpoints**: All REST endpoints available
- **React Frontend**: Served from build directory
- **Health Checks**: Railway will monitor `/api/health`

### ⚠️ Production Considerations:
- **In-Memory Queue**: Jobs are lost on server restart
- **No Redis**: Using simple in-memory storage
- **File Storage**: Screenshots are not persisted
- **Concurrency**: Limited by Railway's resources

## 🔍 Monitoring & Debugging

### Health Check Endpoint
```
GET https://your-app.railway.app/api/health
```

### Queue Status
```
GET https://your-app.railway.app/api/queue/stats
```

### Logs
- View logs in Railway dashboard
- Real-time deployment status
- Automatic restarts on failure

## 🚀 Scaling Options

### Free Tier
- **1GB RAM**
- **Shared CPU**
- **512MB storage**
- **Perfect for testing**

### Pro Tier
- **Up to 32GB RAM**
- **Dedicated CPU**
- **Persistent storage**
- **Custom domains**

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json

2. **App Won't Start**
   - Verify PORT environment variable
   - Check health check endpoint

3. **Puppeteer Issues**
   - Railway supports Puppeteer out of the box
   - No additional configuration needed

### Debug Commands:
```bash
# Check build locally
npm run build

# Test server locally
npm start

# Check environment
echo $NODE_ENV
echo $PORT
```

## 🎯 Next Steps After Deployment

1. **Test all endpoints** on the live URL
2. **Monitor performance** in Railway dashboard
3. **Set up custom domain** if needed
4. **Configure auto-scaling** for production use
5. **Add Redis** for persistent job queue
6. **Implement file storage** for screenshots

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Community**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Report bugs in your repo

---

**Your app is now ready for Railway deployment! 🚀✨**
