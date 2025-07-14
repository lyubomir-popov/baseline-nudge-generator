#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const INTER_FONT_URL = 'https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/Inter-Regular.woff2';
const FONTS_DIR = path.join(__dirname, '..', 'fonts');
const CONFIG_DIR = path.join(__dirname, '..', 'config');

async function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const newUrl = response.headers.location;
        console.log(`🔄 Following redirect to: ${newUrl}`);
        file.close();
        fs.unlink(destination, () => {});
        downloadFile(newUrl, destination).then(resolve).catch(reject);
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
        fs.unlink(destination, () => {}); // Delete the file async
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function createDefaultConfig() {
  const defaultConfig = {
    "baselineUnit": 0.5,
    "fontFile": "fonts/Inter-Regular.woff2",
    "elements": [
      {
        "classname": "h1",
        "fontSize": 2.5,
        "lineHeight": 5
      },
      {
        "classname": "h2",
        "fontSize": 2,
        "lineHeight": 4
      },
      {
        "classname": "h3",
        "fontSize": 1.5,
        "lineHeight": 3
      },
      {
        "classname": "h4",
        "fontSize": 1.25,
        "lineHeight": 3
      },
      {
        "classname": "h5",
        "fontSize": 1.125,
        "lineHeight": 3
      },
      {
        "classname": "h6",
        "fontSize": 1,
        "lineHeight": 2
      },
      {
        "classname": "p",
        "fontSize": 1,
        "lineHeight": 3
      }
    ]
  };

  const configPath = path.join(CONFIG_DIR, 'typography-config.json');
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log('✅ Created default typography config');
}

async function main() {
  try {
    console.log('🤖 Downloading Inter font from GitHub...');
    
    // Ensure directories exist
    if (!fs.existsSync(FONTS_DIR)) {
      fs.mkdirSync(FONTS_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    
    // Download Inter font
    const fontPath = path.join(FONTS_DIR, 'Inter-Regular.woff2');
    await downloadFile(INTER_FONT_URL, fontPath);
    console.log('✅ Downloaded Inter-Regular.woff2');
    
    // Create default config
    await createDefaultConfig();
    
    console.log('🎉 Default font setup complete!');
    console.log('📁 Font saved to: fonts/Inter-Regular.woff2');
    console.log('📁 Config saved to: config/typography-config.json');
    console.log('');
    console.log('💡 You can now run: node bin/baseline-nudges.js generate');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main }; 