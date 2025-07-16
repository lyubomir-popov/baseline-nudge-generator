const fs = require('fs');
const path = require('path');
const fontkitParser = require('./fontkit-parser');
const opentype = require('opentype.js');
const { validateConfigFile } = require('./config-validator');
const { FontFileError, ConfigurationError, FontMetricsError } = require('./error-handler');
const { extractRobustFontName } = require('./font-name-extractor');

class BaselineNudgeGenerator {
    constructor(fontMetrics = null, parser = 'fontkit') {
        this.fontMetrics = fontMetrics;
        this.parser = parser;
    }



    async readFontMetrics(fontPath) {
    // Use fontkit as the default parser
        return await fontkitParser.readFontMetrics(fontPath);
    }

    // Comprehensive font name extraction from metadata
    async extractFontName(font, fontPath) {
        let otFont = null;

        // Try to load with opentype.js for fallback
        try {
            otFont = await opentype.load(fontPath);
        } catch (error) {
            // Will use null as fallback
        }

        // Use the robust font name extractor
        const nameTable = font.tables && font.tables.name ? font.tables.name : null;
        return extractRobustFontName(fontPath, nameTable, otFont);
    }

    // Find font file in directory
    findFontFile(directory, fontFileName) {
    // Try the exact filename as provided first
        const exactPath = path.join(directory, fontFileName);
        if (fs.existsSync(exactPath)) {
            return exactPath;
        }
        // Then try possible extensions
        const possibleExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
        const baseName = fontFileName.replace(/\.[^.]+$/, ''); // Remove extension if provided
        for (const ext of possibleExtensions) {
            const fullPath = path.join(directory, baseName + ext);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        return null;
    }

    calculateNudgeRem(fontSizeRem, lineHeightRem, baselineUnitRem) {
        if (!this.fontMetrics) {
            throw new Error('Font metrics not loaded. Cannot calculate baseline nudges without font file.');
        }

        const { ascent, descent, lineGap, unitsPerEm } = this.fontMetrics;
        const ascenderRem = ascent * fontSizeRem / unitsPerEm;
        const descenderRem = Math.abs(descent) * fontSizeRem / unitsPerEm;
        const lineGapRem = lineGap * fontSizeRem / unitsPerEm;
        const effectiveAscenderRem = ascenderRem + lineGapRem;
        const effectiveDescenderRem = descenderRem;
        const contentAreaRem = effectiveAscenderRem + effectiveDescenderRem;
        const lineHeightAbsoluteRem = lineHeightRem * baselineUnitRem;
        const leadingRem = lineHeightAbsoluteRem - contentAreaRem;

        // CORRECTED: lineGap should be distributed equally above and below the text
        // The baseline position should be: leading/2 + ascender + lineGap/2
        // This fixes the calculation that was adding the full lineGap to the ascender
        const baselineOffsetRem = leadingRem / 2 + ascenderRem + (lineGapRem / 2);

        let nudgeRem = (Math.ceil(baselineOffsetRem / baselineUnitRem) * baselineUnitRem) - baselineOffsetRem;

        // Add compensation for 1px drift by slightly reducing the nudge
        // Convert 1px to rem (assuming 16px root font size) and subtract a fraction of it
        const onePixelInRem = 1 / 16; // 1px = 0.0625rem at 16px root
        const compensation = onePixelInRem * 1; // Use 1 pixel as compensation (2x more than original)

        // Use scaling compensation that smoothly transitions from 0 at 1rem to full at larger sizes
        const scaleFactor = Math.max(0, fontSizeRem - 1); // 0 at 1rem, increases with font size
        const proportionalCompensation = (compensation / fontSizeRem) * scaleFactor;

        // Only apply compensation if the original nudge is not zero
        // If nudgeRem is 0, the text is already perfectly aligned to the grid
        let compensatedNudgeRem = nudgeRem;
        if (nudgeRem > 0) {
            compensatedNudgeRem = nudgeRem - proportionalCompensation;
        }

        // Fix negative nudges by moving to next grid line
        if (compensatedNudgeRem < 0) {
            compensatedNudgeRem = compensatedNudgeRem + baselineUnitRem;
        }

        return Math.round(compensatedNudgeRem * 100000) / 100000;
    }

    // Clean classname for CSS (remove leading dots, handle special characters)
    cleanClassname(classname) {
        if (!classname || typeof classname !== 'string') {
            return 'unknown';
        }
        return classname.replace(/^\./, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    getFontFormat(fontFile) {
        const ext = path.extname(fontFile).toLowerCase();
        switch (ext) {
        case '.woff2':
            return 'woff2';
        case '.woff':
            return 'woff';
        case '.ttf':
            return 'truetype';
        case '.otf':
            return 'opentype';
        default:
            return 'truetype'; // fallback
        }
    }

    // Generate tokens from new input format
    generateTokens(config) {
        const { baselineUnit, elements, fontFile } = config;
        const tokens = {
            font: this.fontMetrics.fontName || 'Unknown Font',
            fontWeight: this.fontMetrics.fontWeight || 400,
            baselineUnit: `${baselineUnit}rem`,
            fontFile: fontFile,
            elements: {}
        };

        for (const element of elements) {
            const { identifier, classname, tag, fontSize, lineHeight, spaceAfter } = element;
            const fontSizeRem = fontSize;
            const lineHeightRem = lineHeight;
            const nudgeTop = this.calculateNudgeRem(fontSizeRem, lineHeightRem, baselineUnit);
            const spaceAfterRem = (spaceAfter || 4) * baselineUnit; // Default to 4 baseline units if not specified

            // Use identifier if available, otherwise use classname (backward compatibility), otherwise use tag, otherwise fallback to 'element'
            const elementName = identifier || classname || tag || 'element';
            const cleanName = this.cleanClassname(elementName);

            tokens.elements[cleanName] = {
                fontSize: `${fontSizeRem}rem`,
                lineHeight: `${lineHeightRem * baselineUnit}rem`,
                fontWeight: this.fontMetrics.fontWeight || 400,
                spaceAfter: `${spaceAfterRem}rem`,
                nudgeTop: `${nudgeTop}rem`
            };
        }

        return tokens;
    }

    // Generate baseline grid CSS
    generateBaselineGridCSS(baselineUnit) {
        return `
.u-baseline-grid::after {
  background: linear-gradient(to top, rgba(255, 0, 0, 0.15), rgba(255, 0, 0, 0.15) 1px, transparent 1px, transparent);
  background-image: linear-gradient(to top, rgba(255, 0, 0, 0.15), rgba(255, 0, 0, 0.15) 1px, transparent 1px, transparent);
  background-position-x: initial;
  background-position-y: initial;
  background-size: initial;
  background-repeat: initial;
  background-attachment: initial;
  background-origin: initial;
  background-clip: initial;
  background-color: initial;
  background-size: 100% ${baselineUnit}rem;
  bottom: 0;
  content: "";
  display: block;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 200;
}

body {
  position: relative;
}
`;
    }

    // Generate HTML example page
    generateHTML(tokens) {
        const { font, baselineUnit, elements } = tokens;
        const fontFileName = path.basename(tokens.fontFile);

        let styles = `
<style>
@font-face {
  font-family: '${font}';
  src: url('fonts/${fontFileName}') format('${this.getFontFormat(tokens.fontFile)}');
  font-weight: normal;
  font-style: normal;
}

body {
  font-family: '${font}', sans-serif;
  font-weight: ${tokens.fontWeight};
  margin: 0;
  padding: 0;
  background: white;
  color: #333;
  position: relative;
  min-height: 100vh;
}

${this.generateBaselineGridCSS(parseFloat(baselineUnit))}

body.u-baseline-grid::after {
  background: linear-gradient(to top, rgba(255, 0, 0, 0.15), rgba(255, 0, 0, 0.15) 1px, transparent 1px, transparent);
  background-size: 100% ${parseFloat(baselineUnit)}rem;
  bottom: 0;
  content: "";
  display: block;
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 200;
}
`;

        for (const [identifier, props] of Object.entries(elements)) {
            const nudgeTopValue = parseFloat(props.nudgeTop);
            const spaceAfterValue = parseFloat(props.spaceAfter);
            const marginBottom = spaceAfterValue - nudgeTopValue;

            styles += `
.${identifier} {
  font-size: ${props.fontSize};
  line-height: ${props.lineHeight};
  font-weight: ${props.fontWeight};
  padding-top: ${props.nudgeTop};
  margin-bottom: ${marginBottom}rem;
  margin-top: 0;
}
`;
        }

        styles += `
</style>
`;

        let htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baseline Grid Typography Example</title>
  ${styles}
</head>
<body class="u-baseline-grid">
`;

        for (const [identifier] of Object.entries(elements)) {
            // Determine the HTML tag to use based on identifier
            const isHeading = /^h[1-6]$/.test(identifier);
            const tag = isHeading ? identifier : 'p';

            // Use the new format: This is an example of {identifier} using {font-name}.
            const sampleText = `This is an example of ${identifier} using ${font}.`;

            htmlContent += `
  <${tag} class="${identifier}">
    ${sampleText}
  </${tag}>
`;
        }

        htmlContent += `
</body>
</html>
`;

        return htmlContent;
    }

    // Generate files from new input format
    async generateFiles(inputPath, outputDir = 'dist') {
    // Validate configuration first
        const validation = validateConfigFile(inputPath);
        if (!validation.isValid) {
            throw new ConfigurationError(
                `Configuration validation failed:\n${validation.errors.join('\n')}`,
                inputPath
            );
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
            console.warn('⚠️  Configuration warnings:');
            validation.warnings.forEach(warning => console.warn(`   ${warning}`));
        }

        if (!fs.existsSync(inputPath)) {
            throw new ConfigurationError(`Input file not found: ${inputPath}`, inputPath);
        }

        const config = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        const inputDir = path.dirname(inputPath);

        // Font file is required
        if (!config.fontFile) {
            throw new ConfigurationError('Font file is required. Add "fontFile": "your-font.woff2" to your config file.', inputPath);
        }

        const fontPath = this.findFontFile(inputDir, config.fontFile);
        if (!fontPath) {
            throw new FontFileError(`Font file not found: ${config.fontFile}
Checked directory: ${inputDir}
Supported formats: .woff2, .woff, .ttf, .otf

Please ensure your font file is in the same directory as your config file.`, config.fontFile);
        }

        try {
            this.fontMetrics = await this.readFontMetrics(fontPath);
        } catch (error) {
            throw new FontMetricsError(`Failed to read font metrics: ${error.message}`, fontPath);
        }

        const tokens = this.generateTokens(config);
        const html = this.generateHTML(tokens);

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write JSON tokens
        const tokensPath = path.join(outputDir, 'tokens.json');
        fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
        console.log(`✅ Generated tokens: ${tokensPath}`);

        // Write HTML example
        const htmlPath = path.join(outputDir, 'index.html');
        fs.writeFileSync(htmlPath, html);
        console.log(`✅ Generated HTML example: ${htmlPath}`);

        // Copy font file to dist folder for HTML demo
        const fontSrcPath = path.resolve(path.dirname(inputPath), tokens.fontFile);
        const fontFileName = path.basename(fontSrcPath);
        const fontDistDir = path.join(outputDir, 'fonts');
        const fontDistPath = path.join(fontDistDir, fontFileName);

        // Ensure fonts directory exists in dist
        if (!fs.existsSync(fontDistDir)) {
            fs.mkdirSync(fontDistDir, { recursive: true });
        }

        // Copy font file
        if (fs.existsSync(fontSrcPath)) {
            fs.copyFileSync(fontSrcPath, fontDistPath);
            console.log(`✅ Copied font: ${fontDistPath}`);
        }

        return { tokens, tokensPath, htmlPath };
    }

    // Legacy method for backward compatibility
    generateScssMap(obj, valueTransform = v => v) {
        return `(\n${Object.entries(obj).map(([k, v]) => `  ${k}: ${valueTransform(v)},`).join('\n')}\n)`;
    }

    // Updated legacy SCSS generation to work with new format
    generateNudges(config) {
    // Handle both new format (elements array) and legacy format (separate objects)
        if (config.elements) {
            // New format - convert elements array to legacy format
            const calculatedNudges = {};
            const calculatedSpAfters = {};

            for (const element of config.elements) {
                const { classname, fontSize, lineHeight } = element;
                const cleanName = this.cleanClassname(classname);
                const nudgeRem = this.calculateNudgeRem(fontSize, lineHeight, config.baselineUnit);
                const spAfterRem = 4 * config.baselineUnit; // Default space after

                calculatedNudges[cleanName] = nudgeRem;
                calculatedSpAfters[cleanName] = spAfterRem;
            }

            return { nudges: calculatedNudges, spAfters: calculatedSpAfters };
        }

        // Legacy format - keep existing logic for backward compatibility
        const { fontSizes, lineHeights, baselineUnit, spAfter } = config;
        const calculatedNudges = {};
        const calculatedSpAfters = {};

        // Use provided keys instead of hardcoded ones
        const providedKeys = Object.keys(fontSizes || {});

        for (const key of providedKeys) {
            const fontSizeRem = fontSizes[key];
            const lineHeightRem = lineHeights[key];
            const spAfterMultiplier = spAfter[key];

            if (fontSizeRem !== undefined && lineHeightRem !== undefined) {
                const nudgeRem = this.calculateNudgeRem(fontSizeRem, lineHeightRem, baselineUnit);
                const spAfterRem = spAfterMultiplier * baselineUnit;
                calculatedNudges[key] = nudgeRem;
                calculatedSpAfters[key] = spAfterRem;
            } else {
                calculatedNudges[key] = 0;
                calculatedSpAfters[key] = 0;
            }
        }

        return { nudges: calculatedNudges, spAfters: calculatedSpAfters };
    }

    generateScss(config) {
        if (!this.fontMetrics) {
            throw new Error('Font metrics not loaded. Cannot generate SCSS without font file.');
        }

        const { nudges, spAfters } = this.generateNudges(config);

        // Handle both new and legacy formats
        if (config.elements) {
            // New format
            const fontSizes = {};
            const lineHeights = {};

            for (const element of config.elements) {
                const cleanName = this.cleanClassname(element.classname);
                fontSizes[cleanName] = element.fontSize;
                lineHeights[cleanName] = element.lineHeight;
            }

            return [
                '// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
                '// Generated by @lyubomir-popov/baseline-nudge-generator',
                '',
                `$baseline-unit: ${config.baselineUnit}rem;`,
                `$font-sizes: ${this.generateScssMap(fontSizes, v => v + 'rem')};`,
                `$line-heights: ${this.generateScssMap(lineHeights, v => v + ' * $baseline-unit')};`,
                `$nudges: ${this.generateScssMap(nudges, v => v + 'rem')};`,
                `$space-after: ${this.generateScssMap(spAfters, v => v + 'rem')};`,
                `$font-ascent: ${this.fontMetrics.ascent};`,
                `$font-descent: ${this.fontMetrics.descent};`,
                `$font-line-gap: ${this.fontMetrics.lineGap};`,
                `$font-units-per-em: ${this.fontMetrics.unitsPerEm};`,
                `$font-cap-height: ${this.fontMetrics.capHeight};`,
                `$font-x-height: ${this.fontMetrics.xHeight};`,
                `$font-weight: ${this.fontMetrics.fontWeight || 400};`,
                ''
            ].join('\n');
        } else {
            // Legacy format
            const { fontSizes, lineHeights, baselineUnit } = config;
            // const spAfter = config.spAfter; // Commented out as unused

            return [
                '// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.',
                '// Generated by @lyubomir-popov/baseline-nudge-generator',
                '',
                `$baseline-unit: ${baselineUnit}rem;`,
                `$font-sizes: ${this.generateScssMap(fontSizes, v => v + 'rem')};`,
                `$line-heights: ${this.generateScssMap(lineHeights, v => v + ' * $baseline-unit')};`,
                `$nudges: ${this.generateScssMap(nudges, v => v + 'rem')};`,
                `$space-after: ${this.generateScssMap(spAfters, v => v + 'rem')};`,
                `$font-ascent: ${this.fontMetrics.ascent};`,
                `$font-descent: ${this.fontMetrics.descent};`,
                `$font-line-gap: ${this.fontMetrics.lineGap};`,
                `$font-units-per-em: ${this.fontMetrics.unitsPerEm};`,
                `$font-cap-height: ${this.fontMetrics.capHeight};`,
                `$font-x-height: ${this.fontMetrics.xHeight};`,
                `$font-weight: ${this.fontMetrics.fontWeight || 400};`,
                ''
            ].join('\n');
        }
    }

    generateFile(inputPath, outputPath) {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input file not found: ${inputPath}`);
        }

        const config = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

        // Load font metrics if fontFile is specified (works for both new and legacy formats)
        if (config.fontFile && !this.fontMetrics) {
            const inputDir = path.dirname(inputPath);
            const fontPath = this.findFontFile(inputDir, config.fontFile);
            if (fontPath) {
                // This is sync version for legacy compatibility
                try {
                    const fontBuffer = fs.readFileSync(fontPath);
                    const fontkit = require('fontkit');
                    const font = fontkit.open(fontBuffer.buffer);

                    this.fontMetrics = {
                        ascent: font.tables.hhea.ascender,
                        descent: font.tables.hhea.descender,
                        lineGap: font.tables.hhea.lineGap,
                        unitsPerEm: font.unitsPerEm,
                        capHeight: (font.tables.os2 && font.tables.os2.sCapHeight) || font.tables.hhea.ascender * 0.7,
                        xHeight: (font.tables.os2 && font.tables.os2.sxHeight) || font.tables.hhea.ascender * 0.5
                    };
                    console.log(`✅ Loaded font metrics from: ${path.basename(fontPath)}`);
                    console.log(`   Ascent: ${this.fontMetrics.ascent}, Descent: ${this.fontMetrics.descent}, UnitsPerEm: ${this.fontMetrics.unitsPerEm}`);
                } catch (error) {
                    console.warn(`⚠️  Could not read font metrics: ${error.message}`);
                }
            }
        }

        const scss = this.generateScss(config);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, scss);
        console.log(`✅ Generated: ${outputPath}`);
        return { nudges: this.generateNudges(config).nudges, outputPath };
    }

    watch(inputPath, outputPath) {
        const chokidar = require('chokidar');
        console.log(`👀 Watching: ${inputPath}`);
        this.generateFile(inputPath, outputPath);

        const watcher = chokidar.watch(inputPath, {
            ignored: /(^|[/\\])\../,
            persistent: true,
            usePolling: true,
            interval: 1000
        });

        watcher.on('change', () => {
            console.log('🔄 Configuration changed, regenerating...');
            try {
                this.generateFile(inputPath, outputPath);
            } catch (error) {
                console.error('❌ Error regenerating:', error.message);
            }
        });

        console.log('🚀 Watcher ready');
        return watcher;
    }
}

module.exports = { BaselineNudgeGenerator };

// CLI handling
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log('Usage: node nudge-generator.js <config-file> [output-dir]');
        console.log('');
        console.log('Examples:');
        console.log('  node nudge-generator.js config.json');
        console.log('  node nudge-generator.js config.json output/');
        process.exit(1);
    }

    const configFile = args[0];
    const outputDir = args[1] || '.';

    const generator = new BaselineNudgeGenerator();

    generator.generateFiles(configFile, outputDir)
        .then(() => {
            console.log('🎉 Generation complete!');
        })
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}
