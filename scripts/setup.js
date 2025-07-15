#!/usr/bin/env node

/**
 * Simple setup script for baseline-nudge-generator
 * Downloads Fira Sans font and creates a working typography config
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Fira Sans Regular TTF - reliable URL from Google Fonts GitHub mirror
const FONT_URL = 'https://github.com/google/fonts/raw/refs/heads/main/ofl/firasans/FiraSans-Regular.ttf';
const FONT_FILENAME = 'FiraSans-Regular.ttf';

async function downloadFont(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);

    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const newUrl = response.headers.location;
        console.log(`🔄 Following redirect to: ${newUrl}`);
        file.close();
        fs.unlink(destination, () => {});
        downloadFont(newUrl, destination).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download font: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(destination, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function createTypographyConfig(fontFilename) {
  const config = {
    "baselineUnit": 0.5,
    "fontFile": fontFilename,
    "elements": [
      {
        "identifier": "h1",
        "fontSize": 5.25,
        "lineHeight": 10,
        "spaceAfter": 3
      },
      {
        "identifier": "h2",
        "fontSize": 3.9375,
        "lineHeight": 8,
        "spaceAfter": 3
      },
      {
        "identifier": "h3",
        "fontSize": 3,
        "lineHeight": 6,
        "spaceAfter": 3
      },
      {
        "identifier": "h4",
        "fontSize": 2.25,
        "lineHeight": 5,
        "spaceAfter": 3
      },
      {
        "identifier": "h5",
        "fontSize": 1.75,
        "lineHeight": 4,
        "spaceAfter": 3
      },
      {
        "identifier": "h6",
        "fontSize": 1.3125,
        "lineHeight": 3,
        "spaceAfter": 3
      },
      {
        "identifier": "p",
        "fontSize": 1,
        "lineHeight": 3,
        "spaceAfter": 3
      }
    ]
  };

  return config;
}

async function setup() {
  try {
    console.log('🚀 Setting up baseline-nudge-generator...');

    // Ensure fonts directory exists
    if (!fs.existsSync('fonts')) {
      fs.mkdirSync('fonts');
    }

    const fontPath = path.join('fonts', FONT_FILENAME);

    // Check if font already exists
    if (fs.existsSync(fontPath)) {
      console.log('✅ Font already exists: ' + fontPath);
    } else {
      console.log('📥 Downloading Fira Sans font...');
      await downloadFont(FONT_URL, fontPath);
      console.log('✅ Font downloaded: ' + fontPath);
    }

    // Create typography config
    const config = createTypographyConfig(path.join('..', fontPath));
    const configPath = path.join('config', 'typography-config.json');

    // Ensure config directory exists
    if (!fs.existsSync('config')) {
      fs.mkdirSync('config');
    }

    if (fs.existsSync(configPath)) {
      console.log('⚠️  Config already exists: ' + configPath);
    } else {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✅ Config created: ' + configPath);
    }

    console.log('');
    console.log('🎉 Setup complete! You can now run:');
    console.log('   baseline-nudges generate config/typography-config.json');
    console.log('');
    console.log('📄 This will create:');
    console.log('   • dist/tokens.json - Design tokens with nudge values');
    console.log('   • dist/index.html - Visual example with baseline grid');
    console.log('   • dist/fonts/ - Font files for the HTML demo');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setup();
}

module.exports = { setup };
