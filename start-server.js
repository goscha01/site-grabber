#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Site Grabber Server...');

// Check if build folder exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.log('📦 Build folder not found. Building React app...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Build folder found');
}

// In production, skip rebuilding since Railway already built it
if (process.env.NODE_ENV === 'production') {
  console.log('🏭 Production mode: Using existing build from Railway...');
  if (fs.existsSync(buildPath)) {
    console.log('✅ Production build folder exists, proceeding...');
  } else {
    console.log('⚠️  No build folder in production, this might cause issues');
  }
}

// Log environment info
console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 PORT: ${process.env.PORT || '5000'}`);
console.log(`📁 Working directory: ${process.cwd()}`);
console.log(`📦 Node version: ${process.version}`);

// Start the server
console.log('🌐 Starting server...');
try {
  // Workers are now started directly in server.js
  
  // Start the server
  require('./server');
  console.log('✅ Server started successfully');
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('❌ Error stack:', error.stack);
  process.exit(1);
}
