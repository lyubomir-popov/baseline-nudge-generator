const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all font files from fonts folder
const fontsDir = path.join(__dirname, '..', 'fonts');
const generatedDir = path.join(__dirname, '..', 'generated');

// Ensure generated directory exists
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

// Read the main config as template
const mainConfigPath = path.join(__dirname, '..', 'config', 'typography-config.json');
const mainConfig = JSON.parse(fs.readFileSync(mainConfigPath, 'utf8'));

// Get all font files (TTF, OTF, WOFF, WOFF2)
const fontFiles = fs.readdirSync(fontsDir)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.ttf', '.otf', '.woff', '.woff2'].includes(ext);
  })
  .filter(file => {
    const filePath = path.join(fontsDir, file);
    const stats = fs.statSync(filePath);
    return stats.size > 0; // Skip empty files
  });

console.log(`Found ${fontFiles.length} font files to test:`);
fontFiles.forEach(file => console.log(`  - ${file}`));

// Test each font file
fontFiles.forEach((fontFile, index) => {
  console.log(`\n📝 Testing ${index + 1}/${fontFiles.length}: ${fontFile}`);
  
  try {
    // Copy font file to generated/
    const srcFontPath = path.join(fontsDir, fontFile);
    const destFontPath = path.join(generatedDir, fontFile);
    fs.copyFileSync(srcFontPath, destFontPath);

    // Create config for this font
    const config = {
      ...mainConfig,
      fontFile: fontFile
    };

    // Write config to generated folder
    const configPath = path.join(generatedDir, `${path.parse(fontFile).name}-config.json`);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Generate tokens and HTML using the main generator
    const output = execSync(`node bin/baseline-nudges.js generate ${configPath}`, { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });

    // Rename the generated index.html to a unique name
    const indexHtmlPath = path.join(generatedDir, 'index.html');
    const uniqueHtmlPath = path.join(generatedDir, `${path.parse(fontFile).name}.html`);
    if (fs.existsSync(indexHtmlPath)) {
      fs.renameSync(indexHtmlPath, uniqueHtmlPath);
    }

    console.log(`  ✅ Generated demo for ${fontFile}`);
    console.log(`  📁 Config: ${configPath}`);
    console.log(`  📁 HTML: ${uniqueHtmlPath}`);

  } catch (error) {
    console.log(`  ❌ Error with ${fontFile}: ${error.message}`);
  }
});

console.log(`\n🎉 Testing complete! Check the generated/ folder for results.`); 