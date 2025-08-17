#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Screenshot Server...');
console.log('📁 Working directory:', process.cwd());
console.log('📦 Node version:', process.version);
console.log('🖥️ Platform:', process.platform);

// Check if build folder exists
const buildPath = path.join(process.cwd(), 'build');
const fs = require('fs');

if (!fs.existsSync(buildPath)) {
  console.log('⚠️ Build folder not found. Building React app first...');
  
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build completed. Starting server...');
      startServer();
    } else {
      console.error('❌ Build failed with code:', code);
      process.exit(1);
    }
  });
} else {
  console.log('✅ Build folder found. Starting server...');
  startServer();
}

function startServer() {
  console.log('🔧 Starting Express server...');
  
  try {
    require('./server.js');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
