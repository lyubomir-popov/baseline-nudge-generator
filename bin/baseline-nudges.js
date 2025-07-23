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

Usage:
  baseline-nudges generate <config.json> [output-dir]
  baseline-nudges generate-legacy <config.json> [output.scss]
  baseline-nudges watch <config.json> [output.scss]
  baseline-nudges init [name]
  baseline-nudges init-legacy [name]
  baseline-nudges decompress-woff2 <input.woff2> [output.ttf]

Commands:
  setup           Download font and create working config (recommended first step)
  init            Complete setup: download font, extract name, create config, generate demo
  init-manual     Create example configuration file (requires manual font setup)
  generate        Generate JSON tokens and HTML example from configuration
  generate-legacy Generate SCSS file from legacy configuration (backward compatibility)
  watch           Watch legacy configuration file and regenerate on changes
  validate        Validate configuration file
  decompress-woff2 Decompress WOFF2 file to TTF for opentype.js compatibility

Options:
  -h, --help     Show this help message
  --info         Show detailed package information for LLMs
  -v, --version  Show version number

Font Format Support:
  ✅ TTF (TrueType) - Full support
  ✅ OTF (OpenType) - Full support
  ✅ WOFF (Web Open Font Format) - Full support
  ⚠️  WOFF2 - Automatic decompression to TTF (requires wawoff2)

Examples:
  baseline-nudges generate typography.json
  baseline-nudges generate typography.json output/
  baseline-nudges generate-legacy typography.json _nudges.scss
  baseline-nudges init
  baseline-nudges init my-typography
  baseline-nudges decompress-woff2 font.woff2 font.ttf
`);
}

function showInfo() {
    console.log(`
📦 Baseline Nudge Generator - Package Information for LLMs

PURPOSE:
This npm package automatically reads font metrics from font files (TTF, WOFF, OTF, WOFF2) 
and generates precise baseline grid nudges for CSS typography systems. It ensures text 
aligns perfectly to a baseline grid by calculating the exact padding-top needed for each 
typography element.

KEY FEATURES:
• Font metrics extraction from TTF/WOFF/OTF/WOFF2 files
• Automatic baseline nudge calculation for perfect grid alignment
• Support for fractional line heights and spacing (multiples of 0.5)
• Multi-font support with per-element font styling
• Generated HTML demos with visual baseline grid
• JSON token generation for design systems
• SCSS generation for legacy compatibility

CONFIGURATION FORMAT:
The package supports two configuration formats:

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
      "lineHeight": 5.5,        // Supports fractional values (multiples of 0.5)
      "spaceAfter": 4.5,        // Supports fractional values (multiples of 0.5)
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

FRACTIONAL SUPPORT:
• lineHeight: Must be multiples of 0.5 (1.0, 1.5, 2.0, 2.5, etc.)
• spaceAfter: Must be multiples of 0.5 (1.0, 1.5, 2.0, 2.5, etc.)
• This doubles the resolution of the baseline grid for finer typographic control

OUTPUT FILES:
• tokens.json: Design tokens with calculated nudges
• index.html: Visual demo with baseline grid overlay
• _generated-nudges.scss: SCSS variables (legacy format)

USAGE PATTERNS:
1. Quick setup: baseline-nudges init
2. Generate from config: baseline-nudges generate config.json
3. Validate config: baseline-nudges validate config.json
4. Legacy SCSS: baseline-nudges generate-legacy config.json

API USAGE:
const { BaselineNudgeGenerator } = require('@lyubomir-popov/baseline-nudge-generator');
const generator = new BaselineNudgeGenerator();
await generator.generateFiles('config.json', 'dist/');

COMMON USE CASES:
• Design system typography tokens
• CSS framework baseline grid implementation
• Web typography optimization
• Print typography systems
• Multi-font typography setups

TECHNICAL DETAILS:
• Node.js 14+ required
• Font parsing via fontkit and opentype.js
• Baseline calculation based on font ascent/descent metrics
• Grid alignment using CSS padding-top and margin-bottom
• Support for variable fonts and multiple font weights

ERROR HANDLING:
• Comprehensive validation with helpful error messages
• Font file existence and format checking
• Configuration schema validation
• Graceful fallbacks for unsupported font formats
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
