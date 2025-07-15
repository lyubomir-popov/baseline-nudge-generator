const fs = require('fs');
const path = require('path');
const fontkitParser = require('./fontkit-parser');
const opentype = require('opentype.js');
const { validateConfigFile } = require('./config-validator');
const { FontFileError, ConfigurationError, FontMetricsError } = require('./error-handler');

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
    let fontName = null;

    // Method 1: Try fontkit name table with multiple API variations
    if (font.tables && font.tables.name) {
      const nameTable = font.tables.name;

      // Try different fontkit API variations
      const nameExtractionMethods = [
        // Modern API: nameTable.names array
        () => {
          if (nameTable.names && Array.isArray(nameTable.names)) {
            // Priority order for name IDs: 1 (Family), 4 (Full), 6 (PostScript), 16 (Typographic Family)
            const priorityNameIDs = [1, 4, 6, 16];

            for (const nameID of priorityNameIDs) {
              // Try Windows platform first (most common)
              const windowsEntry = nameTable.names.find(n => n.nameID === nameID && n.platformID === 3);
              if (windowsEntry && windowsEntry.value) {
                return windowsEntry.value;
              }

              // Try Unicode platform
              const unicodeEntry = nameTable.names.find(n => n.nameID === nameID && n.platformID === 0);
              if (unicodeEntry && unicodeEntry.value) {
                return unicodeEntry.value;
              }

              // Try Macintosh platform
              const macEntry = nameTable.names.find(n => n.nameID === nameID && n.platformID === 1);
              if (macEntry && macEntry.value) {
                return macEntry.value;
              }
            }
          }
          return null;
        },

        // Legacy API: getEnglishName method
        () => {
          if (typeof nameTable.getEnglishName === 'function') {
            // Try different name IDs in priority order
            const priorityNameIDs = [1, 4, 6, 16];
            for (const nameID of priorityNameIDs) {
              try {
                const name = nameTable.getEnglishName(nameID);
                if (name && name.trim()) {
                  return name;
                }
              } catch (error) {
                // Continue to next name ID
              }
            }
          }
          return null;
        },

        // Direct access to names array with different structure
        () => {
          if (nameTable.names) {
            // Handle different array structures
            const names = Array.isArray(nameTable.names) ? nameTable.names : Object.values(nameTable.names);

            // Priority order for name IDs
            const priorityNameIDs = [1, 4, 6, 16];

            for (const nameID of priorityNameIDs) {
              // Try all platforms for each name ID
              for (const platformID of [3, 0, 1]) { // Windows, Unicode, Macintosh
                const entry = names.find(n => n.nameID === nameID && n.platformID === platformID);
                if (entry && entry.value && entry.value.trim()) {
                  return entry.value;
                }
              }
            }
          }
          return null;
        },

        // New method: Direct property access for modern fontkit
        () => {
          // Try preferredFamily first (most accurate)
          if (nameTable.preferredFamily && nameTable.preferredFamily.en) {
            return nameTable.preferredFamily.en;
          }

          // Try fontFamily
          if (nameTable.fontFamily && nameTable.fontFamily.en) {
            return nameTable.fontFamily.en;
          }

          // Try fullName
          if (nameTable.fullName && nameTable.fullName.en) {
            return nameTable.fullName.en;
          }

          // Try postScriptName
          if (nameTable.postScriptName && nameTable.postScriptName.en) {
            return nameTable.postScriptName.en;
          }

          return null;
        }
      ];

      // Try each extraction method
      for (const method of nameExtractionMethods) {
        try {
          const result = method();
          if (result && result.trim()) {
            fontName = result.trim();
            break;
          }
        } catch (error) {
          // Continue to next method
        }
      }
    }

    // If fontName is missing, empty, or just a dot, try opentype.js as fallback
    if (!fontName || fontName.trim() === '' || fontName.trim() === '.') {
      try {
        const otFont = await opentype.load(fontPath);
        // Try preferred order: preferredFamily, fontFamily, fullName, postScriptName
        fontName = otFont.names.preferredFamily && otFont.names.preferredFamily.en;
        if (!fontName && otFont.names.fontFamily) fontName = otFont.names.fontFamily.en;
        if (!fontName && otFont.names.fullName) fontName = otFont.names.fullName.en;
        if (!fontName && otFont.names.postScriptName) fontName = otFont.names.postScriptName.en;
        if (!fontName && otFont.names.preferredFamily) fontName = Object.values(otFont.names.preferredFamily)[0];
        if (!fontName && otFont.names.fontFamily) fontName = Object.values(otFont.names.fontFamily)[0];
        if (!fontName && otFont.names.fullName) fontName = Object.values(otFont.names.fullName)[0];
        if (!fontName && otFont.names.postScriptName) fontName = Object.values(otFont.names.postScriptName)[0];
        if (fontName && typeof fontName === 'object') fontName = Object.values(fontName)[0];
        if (fontName) fontName = fontName.trim();
      } catch (err) {
        // Ignore opentype.js errors, fallback to filename
      }
    }

    // Method 2: Try WOFF/WOFF2 metadata if available
    if (!fontName && font.tables.meta) {
      try {
        // WOFF/WOFF2 metadata is stored in XML format
        const metadata = font.tables.meta;
        if (metadata && typeof metadata === 'string') {
          // Extract font name from XML metadata
          const nameMatch = metadata.match(/<description[^>]*>.*?<text[^>]*>([^<]+)<\/text>/i);
          if (nameMatch && nameMatch[1]) {
            fontName = nameMatch[1].trim();
          }
        }
      } catch (error) {
        // Continue to fallback methods
      }
    }

    // Method 3: Try OS/2 table for font family name
    if (!fontName && font.tables.os2) {
      try {
        const os2 = font.tables.os2;
        if (os2.achVendID) {
          // Some fonts store family name in vendor ID
          fontName = os2.achVendID;
        }
      } catch (error) {
        // Continue to fallback methods
      }
    }

    // Method 4: Try head table for font name hints
    if (!fontName && font.tables.head) {
      try {
        const head = font.tables.head;
        if (head.magicNumber === 0x5F0F3CF5) {
          // Valid TrueType font, try to extract name from other sources
          console.log('DEBUG: Valid TrueType font detected');
        }
      } catch (error) {
        // Continue to fallback methods
      }
    }

    // Method 5: Fallback to filename with cleanup
    if (!fontName) {
      const filename = path.basename(fontPath, path.extname(fontPath));

      // Clean up common font filename patterns
      fontName = filename
        .replace(/[-_]/g, ' ')           // Replace hyphens/underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase())  // Title case
        .replace(/\s+/g, ' ')            // Normalize spaces
        .replace(/Regular|Normal|Std|Pro|Bold|Italic|Light|Medium|Heavy|Black|Thin|Ultra|Extra/g, '')  // Remove common weight/style suffixes
        .trim();

      // If we ended up with an empty string, use the original filename
      if (!fontName) {
        fontName = filename;
      }
    }

    // Final cleanup and validation
    if (fontName) {
      // Remove any remaining special characters that might cause issues
      fontName = fontName
        .replace(/[^\w\s-]/g, '')  // Remove special characters except spaces and hyphens
        .replace(/\s+/g, ' ')      // Normalize spaces
        .trim();

      // Ensure we have a valid font name
      if (!fontName || fontName.length === 0) {
        fontName = 'Unknown Font';
      }
    } else {
      fontName = 'Unknown Font';
    }

    console.log(`📝 Extracted font name: "${fontName}" from ${path.basename(fontPath)}`);
    return fontName;
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
    const baselineOffsetRem = leadingRem / 2 + effectiveAscenderRem;
    const nudgeRem = (Math.ceil(baselineOffsetRem / baselineUnitRem) * baselineUnitRem) - baselineOffsetRem;

    // Add compensation for 1px drift by slightly reducing the nudge
    // Convert 1px to rem (assuming 16px root font size) and subtract a fraction of it
    const onePixelInRem = 1 / 16; // 1px = 0.0625rem at 16px root
    const compensation = onePixelInRem * 1; // Use 1 pixel as compensation (2x more than original)

    // Use scaling compensation that smoothly transitions from 0 at 1rem to full at larger sizes
    const scaleFactor = Math.max(0, fontSizeRem - 1); // 0 at 1rem, increases with font size
    const proportionalCompensation = (compensation / fontSizeRem) * scaleFactor;

    const compensatedNudgeRem = nudgeRem - proportionalCompensation;
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
  margin: 0;
  padding: 0;
  background: white;
  color: #333;
  position: relative;
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

    for (const [identifier, props] of Object.entries(elements)) {
      const nudgeTopValue = parseFloat(props.nudgeTop);
      const spaceAfterValue = parseFloat(props.spaceAfter);
      const marginBottom = spaceAfterValue - nudgeTopValue;

      // Determine the HTML tag to use based on identifier
      const isHeading = /^h[1-6]$/.test(identifier);
      const tag = isHeading ? identifier : 'p';

      htmlContent += `
  <${tag} class="${identifier}">
    ${isHeading ? `This is a ${identifier.toUpperCase()} heading` : `This is sample text using the "${identifier}" class.`}
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
      throw new ConfigurationError(`Font file is required. Add "fontFile": "your-font.woff2" to your config file.`, inputPath);
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
        ''
      ].join('\n');
    } else {
      // Legacy format
      const { fontSizes, lineHeights, baselineUnit, spAfter } = config;

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
      ignored: /(^|[\/\\])\../,
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
    .then(result => {
      console.log('🎉 Generation complete!');
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}
