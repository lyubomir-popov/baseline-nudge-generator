#!/usr/bin/env node

/**
 * CLI for Baseline Nudge Generator
 * @author Lyubomir Popov
 */

const { BaselineNudgeGenerator } = require('../src/nudge-generator');
const path = require('path');
const fs = require('fs');

function showHelp() {
  console.log(`
🎯 Baseline Nudge Generator CLI

Usage:
  baseline-nudges generate <config.json> [output-dir]
  baseline-nudges generate-legacy <config.json> [output.scss]
  baseline-nudges watch <config.json> [output.scss]
  baseline-nudges init [name]
  baseline-nudges init-legacy [name]

Commands:
  generate        Generate JSON tokens and HTML example from new format
  generate-legacy Generate SCSS file from legacy configuration (backward compatibility)
  watch           Watch legacy configuration file and regenerate on changes
  init            Create example configuration file (new format)
  init-legacy     Create example configuration file (legacy format)

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Examples:
  baseline-nudges generate typography.json
  baseline-nudges generate typography.json output/
  baseline-nudges generate-legacy typography.json _nudges.scss
  baseline-nudges init
  baseline-nudges init my-typography
`);
}

function showVersion() {
  const packageJson = require('../package.json');
  console.log(packageJson.version);
}

function createExampleConfig(name = 'typography-config') {
      const baselineUnit = 0.5;
    const fontSizes = [
      { classname: "h1", fontSize: 4 },
      { classname: "h2", fontSize: 3.5 },
      { classname: "h3", fontSize: 3 },
      { classname: "h4", fontSize: 2.5 },
      { classname: "h5", fontSize: 2 },
      { classname: "h6", fontSize: 1.5 },
      { classname: "p", fontSize: 1 }
    ];
    
    // Calculate line-height based on font-size for good readability
    // Formula: line-height = (ceil(font-size / baselineUnit) + 1) * baselineUnit
    // Example: 1rem font-size with 0.5rem baseline unit
    //   → 1rem ÷ 0.5rem = 2 baseline units fit in font-size
    //   → Add 1 extra baseline unit = 2 + 1 = 3 baseline units
    //   → 3 × 0.5rem = 1.5rem line-height (1.5 ratio)
    const elements = fontSizes.map(element => {
      const baselineUnitsInFontSize = Math.ceil(element.fontSize / baselineUnit);
      const lineHeightInBaselineUnits = baselineUnitsInFontSize + 1;
      return {
        ...element,
        lineHeight: lineHeightInBaselineUnits
      };
    });
    
    const config = {
      font: "Inter",
      baselineUnit: baselineUnit,
      fontFile: "your-font.woff2",
      elements: elements
    };

  const filename = `${name}.json`;
  fs.writeFileSync(filename, JSON.stringify(config, null, 2));
  console.log(`✅ Created example configuration: ${filename}`);
  console.log('');
  console.log('📝 Configuration details:');
  console.log(`   • Font: ${config.font}`);
  console.log(`   • Baseline unit: ${config.baselineUnit}rem`);
  console.log(`   • Elements: ${config.elements.length} typography elements`);
  console.log(`   • Font file: ${config.fontFile} (REQUIRED - you must provide this)`);
  console.log('');
  console.log('💡 Typography scale:');
  for (const element of config.elements) {
    const lineHeightRem = element.lineHeight * config.baselineUnit;
    console.log(`   • ${element.classname}: ${element.fontSize}rem / ${lineHeightRem}rem`);
  }
  console.log('');
  console.log('🎨 REQUIRED: Add your font file to this directory');
  console.log('   The tool requires a font file to calculate accurate baseline nudges.');
  console.log('   Supported formats: .woff2, .woff, .ttf, .otf');
  console.log('');
  console.log('📥 Get font files:');
  console.log('   • Google Fonts: https://fonts.google.com/');
  console.log('   • Font Squirrel: https://www.fontsquirrel.com/');
  console.log('   • Inter font: https://github.com/rsms/inter/releases');
  console.log('');
  console.log('💡 For testing with Inter font:');
  console.log('   1. Download Inter-Regular.woff2 or Inter-VariableFont_opsz,wght.ttf');
  console.log('   2. Place it in the same directory as your config file');
  console.log('   3. Update "fontFile" in the config to match your font filename');
  console.log('');
  console.log('🚀 Once you have your font file:');
  console.log(`   baseline-nudges generate ${filename}`);
  console.log('');
  console.log('📄 Then open index.html in your browser');
}

function createLegacyExampleConfig(name = 'typography-config-legacy') {
  const config = {
    baselineUnit: 0.5,
    fontSizes: {
      display: 4,
      h1: 2,
      h2: 1.5,
      h3: 1.25,
      h4: 1,
      default: 1,
      small: 0.875,
      'x-small': 0.75
    },
    lineHeights: {
      display: 5,
      h1: 4,
      h2: 3,
      h3: 3,
      h4: 3,
      'default-text': 3,
      small: 2,
      'x-small': 2
    },
    spAfter: {
      display: 4,
      h1: 4,
      h2: 3,
      h3: 2,
      h4: 2,
      'default-text': 2,
      p: 2,
      small: 1,
      'x-small': 1
    }
  };

  const filename = `${name}.json`;
  fs.writeFileSync(filename, JSON.stringify(config, null, 2));
  console.log(`✅ Created legacy example configuration: ${filename}`);
  console.log('📝 Edit this file with your typography settings');
  console.log(`💡 Then run: baseline-nudges generate-legacy ${filename}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    return;
  }

  const command = args[0];
  
  switch (command) {
    case 'init': {
      const name = args[1];
      createExampleConfig(name);
      break;
    }
    
    case 'init-legacy': {
      const name = args[1];
      createLegacyExampleConfig(name);
      break;
    }
    
    case 'generate': {
      const inputPath = args[1];
      if (!inputPath) {
        console.error('❌ Error: Input configuration file required');
        console.log('Usage: baseline-nudges generate <config.json> [output-dir]');
        process.exit(1);
      }
      
      const outputDir = args[2] || path.dirname(inputPath);
      
      try {
        const generator = new BaselineNudgeGenerator();
        await generator.generateFiles(inputPath, outputDir);
        console.log('🎉 Generation complete!');
        console.log(`📁 Output directory: ${outputDir}`);
        console.log(`📄 Open ${path.join(outputDir, 'index.html')} in your browser to see the results`);
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
    }
    
    case 'generate-legacy': {
      const inputPath = args[1];
      if (!inputPath) {
        console.error('❌ Error: Input configuration file required');
        console.log('Usage: baseline-nudges generate-legacy <config.json> [output.scss]');
        process.exit(1);
      }
      
      const outputPath = args[2] || path.join(path.dirname(inputPath), '_generated-nudges.scss');
      
      try {
        const generator = new BaselineNudgeGenerator();
        generator.generateFile(inputPath, outputPath);
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
    }
    
    case 'watch': {
      const inputPath = args[1];
      if (!inputPath) {
        console.error('❌ Error: Input configuration file required');
        console.log('Usage: baseline-nudges watch <config.json> [output.scss]');
        process.exit(1);
      }
      
      const outputPath = args[2] || path.join(path.dirname(inputPath), '_generated-nudges.scss');
      
      try {
        const generator = new BaselineNudgeGenerator();
        const watcher = generator.watch(inputPath, outputPath);
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n👋 Stopping watcher...');
          watcher.close();
          process.exit(0);
        });
        
      } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
      }
      break;
    }
    
    default:
      console.error(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}
