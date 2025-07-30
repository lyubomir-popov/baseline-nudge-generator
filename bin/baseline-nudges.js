#!/usr/bin/env node

/**
 * CLI for Baseline Nudge Generator
 * @author Lyubomir Popov
 */

const { BaselineNudgeGenerator } = require('../src/nudge-generator');
const { validateConfigFile } = require('../src/config-validator');
const { withErrorHandling } = require('../src/error-handler');
const path = require('path');
const fs = require('fs');

function showHelp() {
    console.log(`
🎯 Baseline Nudge Generator CLI

DESCRIPTION:
Automatically generates precise baseline grid nudges for CSS typography systems by reading 
font metrics from font files (TTF, WOFF, OTF, WOFF2). Ensures perfect text alignment 
to a baseline grid by calculating exact padding-top values for each typography element.

USAGE:
  baseline-nudges <command> [options] [arguments]

COMMANDS:

📦 Setup & Initialization:
  setup                    Download font and create working config (recommended first step)
  init [name]             Complete setup: download font, extract name, create config, generate demo
  init-legacy [name]      Create legacy configuration file (backward compatibility)
  init-manual [name]      Create example configuration file (requires manual font setup)

🎨 Generation:
  generate <config.json> [output-dir]     Generate JSON tokens and HTML demo from configuration
  generate-legacy <config.json> [output.scss]  Generate SCSS file from legacy configuration
  watch <config.json> [output.scss]       Watch configuration file and regenerate on changes

🔧 Utilities:
  validate <config.json>                  Validate configuration file
  decompress-woff2 <input.woff2> [output.ttf]  Decompress WOFF2 file to TTF

OPTIONS:
  -h, --help              Show this help message
  --info                  Show detailed package information for LLMs
  -v, --version           Show version number
  --parser <parser>       Specify font parser: 'opentype' or 'fontkit' (default: opentype)

FONT FORMAT SUPPORT:
  ✅ TTF (TrueType)       Full support with metrics extraction
  ✅ OTF (OpenType)       Full support with metrics extraction  
  ✅ WOFF (Web Open Font Format)  Full support with metrics extraction
  ⚠️  WOFF2               Automatic decompression to TTF (requires wawoff2)

CONFIGURATION FORMATS:

1. NEW FORMAT (Recommended):
   {
     "baselineUnit": 0.5,
     "fontFiles": [
       {"family": "sans", "path": "fonts/Inter-Regular.woff"},
       {"family": "serif", "path": "fonts/Merriweather-Regular.woff"}
     ],
     "elements": [
       {
         "identifier": "h1",
         "fontSize": 2.5,
         "lineHeight": 5.5,
         "spaceAfter": 4.5,
         "fontFamily": "sans",
         "fontWeight": 700,
         "fontStyle": "normal"
       }
     ]
   }

2. LEGACY FORMAT (Backward compatibility):
   {
     "baselineUnit": 0.5,
     "fontFile": "fonts/Inter-Regular.woff",
     "fontSizes": {"h1": 2.5, "p": 1.0},
     "lineHeights": {"h1": 5, "p": 3},
     "spAfter": {"h1": 4, "p": 2}
   }

OUTPUT FILES:
  • tokens.json           Design tokens with calculated nudges and font properties
  • index.html           Visual demo with baseline grid overlay and typography examples
  • _generated-nudges.scss  SCSS variables (legacy format only)

EXAMPLES:

Quick Start:
  baseline-nudges setup                    # Download font and create config
  baseline-nudges init                     # Complete setup with demo generation
  baseline-nudges init my-typography      # Setup with custom name

Generation:
  baseline-nudges generate config.json                    # Generate to dist/
  baseline-nudges generate config.json custom-output     # Generate to custom directory

Legacy SCSS:
  baseline-nudges generate-legacy config.json            # Generate SCSS file
  baseline-nudges generate-legacy config.json _nudges.scss

Validation:
  baseline-nudges validate config.json                   # Validate configuration

Font Utilities:
  baseline-nudges decompress-woff2 font.woff2 font.ttf  # Decompress WOFF2

ADVANCED FEATURES:

Multi-Font Support:
  • Use multiple font families (sans, serif) in single configuration
  • Different nudge calculations per font family
  • Per-element font styling (fontFamily, fontWeight, fontStyle)

Fractional Baseline Grid:
  • lineHeight: Supports multiples of 0.25 (1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, etc.)
  • spaceAfter: Supports 0 or multiples of 0.25 (0, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, etc.). If set to 0, it is treated as 0.5 baseline units for spacing.
  • Quadruples resolution for finer typographic control

Output Directory Handling:
  • Respects specified output directory completely
  • No overwriting between different config runs
  • Consistent file placement based on output directory

For detailed technical information, run: baseline-nudges --info
`);
}

function showInfo() {
    console.log(`
📦 Baseline Nudge Generator - Comprehensive Package Information for LLMs

PURPOSE & OVERVIEW:
This npm package automatically reads font metrics from font files (TTF, WOFF, OTF, WOFF2) 
and generates precise baseline grid nudges for CSS typography systems. It ensures text 
aligns perfectly to a baseline grid by calculating the exact padding-top needed for each 
typography element, eliminating the need for manual baseline calculations.

CORE FUNCTIONALITY:
• Font metrics extraction from TTF/WOFF/OTF/WOFF2 files using fontkit/opentype.js
• Automatic baseline nudge calculation for perfect grid alignment
• Support for fractional line heights and spacing (multiples of 0.25, spaceAfter can be 0)
• If spaceAfter is set to 0, it is treated as 0.5 baseline units for spacing
• Multi-font support with per-element font styling (fontFamily, fontWeight, fontStyle)
• Generated HTML demos with visual baseline grid overlay
• JSON token generation for design systems integration
• SCSS generation for legacy compatibility
• Real-time file watching and regeneration
• Comprehensive configuration validation

CONFIGURATION FORMATS:

1. NEW FORMAT (Recommended - v1.4.0+):
{
  "baselineUnit": 0.5,
  "fontFiles": [
    {"family": "sans", "path": "fonts/Inter-Regular.woff"},
    {"family": "serif", "path": "fonts/Merriweather-Regular.woff"}
  ],
  "elements": [
    {
      "identifier": "h1",
      "fontSize": 2.5,
      "lineHeight": 5.25,       // Supports fractional values (multiples of 0.25)
      "spaceAfter": 4.25,       // Supports fractional values (multiples of 0.25, can be 0)
      "fontFamily": "sans",     // References fontFiles family
      "fontWeight": 700,        // CSS font-weight value
      "fontStyle": "normal"     // "normal" or "italic"
    }
  ]
}

2. LEGACY FORMAT (Backward compatibility):
{
  "baselineUnit": 0.5,
  "fontFile": "fonts/Inter-Regular.woff",
  "fontSizes": {"h1": 2.5, "p": 1.0},
  "lineHeights": {"h1": 5, "p": 3},
  "spAfter": {"h1": 4, "p": 2}
}

ADVANCED FEATURES:

Multi-Font Support:
• Use multiple font families (sans, serif) in single configuration
• Different nudge calculations per font family based on unique metrics
• Per-element font styling with fontFamily, fontWeight, fontStyle properties
• Automatic font family resolution and CSS generation

Fractional Baseline Grid:
• lineHeight: Supports multiples of 0.25 (1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, etc.)
• spaceAfter: Supports multiples of 0.25 (1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, etc.)
• Quadruples resolution for finer typographic control
• Maintains perfect baseline alignment with fractional values

Output Directory Handling:
• Respects specified output directory completely
• No overwriting between different config runs
• Consistent file placement based on output directory
• Supports multiple simultaneous generations to different directories

Font Format Support:
• TTF (TrueType): Full support with metrics extraction
• OTF (OpenType): Full support with metrics extraction
• WOFF (Web Open Font Format): Full support with metrics extraction
• WOFF2: Automatic decompression to TTF (requires wawoff2 dependency)

OUTPUT FILES:

tokens.json:
{
  "h1": {
    "fontSize": 2.5,
    "lineHeight": 5.5,
    "spaceAfter": 4.5,
    "nudge": 0.125,
    "fontFamily": "sans",
    "fontWeight": 700,
    "fontStyle": "normal"
  }
}

index.html:
• Visual demo with baseline grid overlay
• Typography examples for all configured elements
• CSS with calculated nudges and font properties
• Responsive design with proper font loading

_generated-nudges.scss (legacy only):
• SCSS variables for legacy integration
• Compatible with existing SCSS workflows

CLI COMMANDS:

Setup & Initialization:
• setup: Download font and create working config
• init [name]: Complete setup with demo generation
• init-legacy [name]: Create legacy configuration
• init-manual [name]: Create example config (manual font setup)

Generation:
• generate <config.json> [output-dir]: Generate JSON tokens and HTML demo
• generate-legacy <config.json> [output.scss]: Generate SCSS file
• watch <config.json> [output.scss]: Watch and regenerate on changes

Utilities:
• validate <config.json>: Validate configuration file
• decompress-woff2 <input.woff2> [output.ttf]: Decompress WOFF2 file

API USAGE:

Basic Usage:
const { BaselineNudgeGenerator } = require('@lyubomir-popov/baseline-nudge-generator');
const generator = new BaselineNudgeGenerator();
await generator.generateFiles('config.json', 'dist/');

Advanced Usage:
const generator = new BaselineNudgeGenerator(null, 'fontkit'); // Specify parser
await generator.generateFiles('config.json', 'custom-output/');

Token Generation:
const tokens = await generator.generateTokens('config.json');
console.log(tokens.h1.nudge); // Access calculated nudge

COMMON USE CASES:

Design Systems:
• Generate typography tokens for design system integration
• Maintain consistent baseline grid across components
• Support multiple font families with different metrics

CSS Frameworks:
• Implement baseline grid in CSS frameworks
• Generate SCSS variables for existing workflows
• Provide fractional baseline support for fine control

Web Typography:
• Optimize typography for web applications
• Ensure perfect baseline alignment across browsers
• Support responsive typography with consistent grids

Print Typography:
• Generate precise typography for print layouts
• Maintain baseline grid in print CSS
• Support multiple font weights and styles

Multi-Font Setups:
• Handle complex typography with multiple font families
• Calculate different nudges per font family
• Maintain consistent spacing across font changes

TECHNICAL DETAILS:

Dependencies:
• Node.js 14+ required
• fontkit: Primary font parsing library
• opentype.js: Alternative font parser
• wawoff2: WOFF2 decompression (optional)

Font Parsing:
• Extracts ascent, descent, and baseline metrics
• Supports variable fonts and multiple weights
• Handles font format detection automatically
• Provides fallback for unsupported formats

Baseline Calculation:
• Calculates nudge based on font ascent/descent
• Ensures text aligns to baseline grid
• Supports fractional baseline units (0.5x resolution)
• Maintains consistency across font changes

CSS Generation:
• Generates padding-top for baseline alignment
• Includes font-family, font-weight, font-style
• Provides margin-bottom for spacing
• Creates responsive and accessible CSS

ERROR HANDLING & VALIDATION:

Configuration Validation:
• Schema validation for both formats
• Font file existence checking
• Font format compatibility verification
• Helpful error messages with suggestions

Font Processing:
• Graceful fallbacks for unsupported formats
• Automatic WOFF2 decompression when possible
• Font name extraction and validation
• Metrics extraction error handling

File System:
• Output directory creation and validation
• File writing error handling
• Path resolution and validation
• Cross-platform compatibility

PERFORMANCE & OPTIMIZATION:

Font Processing:
• Efficient font parsing with minimal memory usage
• Caching of font metrics for repeated use
• Optimized file I/O operations
• Background processing for large font files

Generation:
• Fast token generation for design systems
• Optimized HTML/CSS output
• Minimal file size for generated assets
• Efficient file watching for development

COMPATIBILITY:

Browser Support:
• Generated CSS works in all modern browsers
• Font loading optimization for web use
• Fallback font handling
• Responsive design support

Framework Integration:
• Compatible with React, Vue, Angular, etc.
• SCSS integration for existing workflows
• JSON tokens for design system tools
• CSS-in-JS framework support

Version Compatibility:
• Backward compatibility with legacy format
• Migration path from legacy to new format
• Deprecation warnings for legacy features
• Future-proof API design
`);
}

function showVersion() {
    const packageJson = require('../package.json');
    console.log(packageJson.version);
}

function createExampleConfig(name = 'typography-config') {
    const baselineUnit = 0.5;
    const fontSizes = [
        { classname: 'h1', fontSize: 4 },
        { classname: 'h2', fontSize: 3.5 },
        { classname: 'h3', fontSize: 3 },
        { classname: 'h4', fontSize: 2.5 },
        { classname: 'h5', fontSize: 2 },
        { classname: 'h6', fontSize: 1.5 },
        { classname: 'p', fontSize: 1 }
    ];

    // Calculate line-height based on font-size for good readability
    const elements = fontSizes.map(element => {
        const baselineUnitsInFontSize = Math.ceil(element.fontSize / baselineUnit);
        const lineHeightInBaselineUnits = baselineUnitsInFontSize + 1;
        return {
            ...element,
            lineHeight: lineHeightInBaselineUnits
        };
    });

    const config = {
        font: 'Inter',
        baselineUnit: baselineUnit,
        fontFile: 'fonts/Inter-Regular.ttf', // Default to TTF as it's most compatible
        elements: elements
    };

    const filename = `${name}.json`;
    return { config, filename };
}

async function createExampleConfigWithFont(name = 'typography-config') {
    try {
        console.log('🔍 Setting up Inter font...');

        // Download Inter font
        const { downloadInterFont } = require('../scripts/downloadDefaultFont');
        const fontResult = await downloadInterFont();

        // Create config with the downloaded font
        const { config, filename } = createExampleConfig(name);
        config.fontFile = fontResult.filename;

        fs.writeFileSync(filename, JSON.stringify(config, null, 2));
        console.log(`✅ Created example configuration: ${filename}`);
        console.log('');
        console.log('📝 Configuration details:');
        console.log(`   • Font: ${config.font}`);
        console.log(`   • Baseline unit: ${config.baselineUnit}rem`);
        console.log(`   • Elements: ${config.elements.length} typography elements`);
        console.log(`   • Font file: ${config.fontFile} (✅ Downloaded and verified)`);
        console.log('');
        console.log('💡 Typography scale:');
        for (const element of config.elements) {
            const lineHeightRem = element.lineHeight * config.baselineUnit;
            console.log(`   • ${element.classname}: ${element.fontSize}rem / ${lineHeightRem}rem`);
        }
        console.log('');
        console.log('🚀 Ready to generate:');
        console.log(`   baseline-nudges generate ${filename}`);
        console.log('');
        console.log('📄 Then open index.html in your browser');

    } catch (error) {
        console.error('❌ Error setting up font:', error.message);
        console.log('');
        console.log('💡 Falling back to manual font setup...');

        // Fallback to manual setup
        const { config, filename } = createExampleConfig(name);
        config.fontFile = 'your-font.woff2';

        fs.writeFileSync(filename, JSON.stringify(config, null, 2));
        console.log(`✅ Created example configuration: ${filename}`);
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

    if (args.includes('--info')) {
        showInfo();
        return;
    }

    if (args.includes('-v') || args.includes('--version')) {
        showVersion();
        return;
    }

    const command = args[0];

    switch (command) {
    case 'setup': {
        const { setup } = require('../scripts/setup');
        await setup();
        break;
    }

    case 'init': {
        const name = args[1];
        await createExampleConfigWithFont(name);
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

        const outputDir = args[2] || 'dist';

        const parserArgIndex = process.argv.indexOf('--parser');
        let parser = 'opentype';
        if (parserArgIndex !== -1 && process.argv[parserArgIndex + 1]) {
            parser = process.argv[parserArgIndex + 1];
        }

        const generateWithErrorHandling = withErrorHandling(async () => {
            const generator = new BaselineNudgeGenerator(null, parser);
            await generator.generateFiles(inputPath, outputDir);
            console.log('🎉 Generation complete!');
            console.log(`📁 Output directory: ${outputDir}`);
            console.log(`📄 Open ${path.join(outputDir, 'index.html')} in your browser to see the results`);
        }, true);

        await generateWithErrorHandling();
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

    case 'validate': {
        const inputPath = args[1];
        if (!inputPath) {
            console.error('❌ Error: Input configuration file required');
            console.log('Usage: baseline-nudges validate <config.json>');
            process.exit(1);
        }

        const validation = validateConfigFile(inputPath);

        if (validation.isValid) {
            console.log('✅ Configuration is valid!');
            if (validation.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                validation.warnings.forEach(warning => console.log(`   ${warning}`));
            }
        } else {
            console.log('❌ Configuration is invalid!');
            console.log('\nErrors:');
            validation.errors.forEach(error => console.log(`   ${error}`));

            if (validation.warnings.length > 0) {
                console.log('\nWarnings:');
                validation.warnings.forEach(warning => console.log(`   ${warning}`));
            }

            process.exit(1);
        }
        break;
    }

    case 'decompress-woff2': {
        const inputPath = args[1];
        if (!inputPath) {
            console.error('❌ Error: Input WOFF2 file required');
            console.log('Usage: baseline-nudges decompress-woff2 <input.woff2> [output.ttf]');
            process.exit(1);
        }

        const outputPath = args[2] || path.join(path.dirname(inputPath), 'decompressed.ttf');

        try {
            const { decompressWOFF2 } = require('../scripts/decompress-woff2.js');
            await decompressWOFF2(inputPath, outputPath);
            console.log('🎉 WOFF2 decompression complete!');
            console.log(`📁 Output directory: ${path.dirname(outputPath)}`);
            console.log(`📄 Decompressed file: ${outputPath}`);
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
