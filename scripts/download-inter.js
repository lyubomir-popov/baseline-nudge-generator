#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

const FONT_URL = 'https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2';
const FONT_PATH = path.join(__dirname, '../examples/Inter-Regular.woff2');

async function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const newUrl = response.headers.location;
        console.log(`🔄 Following redirect to: ${newUrl}`);
        file.close();
        fs.unlink(filepath, () => {});
        downloadFile(newUrl, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file async
        reject(err);
      });
    });
    
    request.on('error', reject);
  });
}

async function ensureFont() {
  console.log('🎨 Checking for Inter font file...');
  
  if (fs.existsSync(FONT_PATH)) {
    console.log('✅ Inter font already exists');
    return;
  }
  
  console.log('📥 Downloading Inter font from GitHub...');
  
  try {
    await downloadFile(FONT_URL, FONT_PATH);
    console.log('✅ Inter font downloaded successfully');
    console.log('📁 Font saved to: examples/Inter-Regular.woff2');
  } catch (error) {
    console.error('❌ Failed to download Inter font:', error.message);
    console.log('💡 You can manually download Inter font from:');
    console.log('   https://github.com/rsms/inter/releases');
    console.log('   And place it in the examples/ directory');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  ensureFont().catch(console.error);
}

module.exports = { ensureFont }; 