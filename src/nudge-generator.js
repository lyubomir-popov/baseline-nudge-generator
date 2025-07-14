const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

class BaselineNudgeGenerator {
  constructor(fontMetrics = null) {
    this.fontMetrics = fontMetrics;
  }

  // Read font metrics from a font file
  async readFontMetrics(fontPath) {
    try {
      const font = await opentype.load(fontPath);
      const metrics = {
        ascent: font.tables.hhea.ascender,
        descent: font.tables.hhea.descender,
        lineGap: font.tables.hhea.lineGap,
        unitsPerEm: font.unitsPerEm,
        capHeight: (font.tables.os2 && font.tables.os2.sCapHeight) || font.tables.hhea.ascender * 0.7,
        xHeight: (font.tables.os2 && font.tables.os2.sxHeight) || font.tables.hhea.ascender * 0.5
      };
      console.log(`✅ Loaded font metrics from: ${path.basename(fontPath)}`);
      console.log(`   Ascent: ${metrics.ascent}, Descent: ${metrics.descent}, UnitsPerEm: ${metrics.unitsPerEm}`);
      return metrics;
    } catch (error) {
      throw new Error(`Could not read font metrics from ${fontPath}: ${error.message}`);
    }
  }

  // Find font file in directory
  findFontFile(directory, fontFileName) {
    const possibleExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
    const baseName = fontFileName.replace(/\.[^.]+$/, ''); // Remove extension if provided
    
    for (const ext of possibleExtensions) {
      const fullPath = path.join(directory, baseName + ext);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // Try the exact filename as provided
    const exactPath = path.join(directory, fontFileName);
    if (fs.existsSync(exactPath)) {
      return exactPath;
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
    return Math.round(nudgeRem * 1000) / 1000;
  }

  // Clean classname for CSS (remove leading dots, handle special characters)
  cleanClassname(classname) {
    return classname.replace(/^\./, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  // Generate tokens from new input format
  generateTokens(config) {
    const { font, baselineUnit, elements } = config;
    const tokens = {
      font: font,
      baselineUnit: `${baselineUnit}rem`,
      elements: {}
    };

    for (const element of elements) {
      const { classname, fontSize, lineHeight } = element;
      const fontSizeRem = fontSize;
      const lineHeightRem = lineHeight;
      const nudgeTop = this.calculateNudgeRem(fontSizeRem, lineHeightRem, baselineUnit);
      const spaceAfter = 4 * baselineUnit; // Default space after

      // Clean the classname for consistent handling
      const cleanName = this.cleanClassname(classname);

      tokens.elements[cleanName] = {
        fontSize: `${fontSizeRem}rem`,
        lineHeight: `${lineHeightRem * baselineUnit}rem`,
        spaceAfter: `${spaceAfter}rem`,
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
    
    let styles = `
<style>
@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap');

body {
  font-family: '${font}', sans-serif;
  margin: 0;
  padding: 2rem;
  line-height: 1.6;
  background: white;
  color: #333;
}

${this.generateBaselineGridCSS(parseFloat(baselineUnit))}

.container {
  max-width: 800px;
  margin: 0 auto;
}

.show-grid {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.toggle-grid {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 1rem;
}

.toggle-grid:hover {
  background: #0056b3;
}

.element-info {
  background: #e9ecef;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-family: monospace;
}

.font-info {
  background: #d1ecf1;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  border: 1px solid #bee5eb;
}

.font-info h3 {
  margin-top: 0;
  color: #0c5460;
}

.font-info code {
  background: #fff;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.875rem;
}
`;

    for (const [classname, props] of Object.entries(elements)) {
      const nudgeTopValue = parseFloat(props.nudgeTop);
      const spaceAfterValue = parseFloat(props.spaceAfter);
      const marginBottom = spaceAfterValue - nudgeTopValue;
      
      styles += `
.${classname} {
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

    const fontMetricsInfo = `
    <div class="font-info">
      <h3>Font Metrics (From Font File)</h3>
      <p><strong>Font:</strong> ${font}</p>
      <p><strong>Baseline Unit:</strong> ${baselineUnit}</p>
      <p><strong>Metrics:</strong> 
        <code>ascent: ${this.fontMetrics.ascent}</code>, 
        <code>descent: ${this.fontMetrics.descent}</code>, 
        <code>unitsPerEm: ${this.fontMetrics.unitsPerEm}</code>
      </p>
      <p><em>✅ Using precise font metrics for accurate baseline alignment.</em></p>
    </div>
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
<body>
  <div class="container">
    <div class="show-grid">
      <button class="toggle-grid" onclick="toggleGrid()">Toggle Baseline Grid</button>
      <p>Click the button above to show/hide the baseline grid overlay.</p>
    </div>
    
    ${fontMetricsInfo}
    
    <h1 style="margin-bottom: 2rem;">Typography Examples</h1>
    <p style="margin-bottom: 2rem;">All text should align perfectly to the baseline grid when the overlay is enabled.</p>
`;

    for (const [classname, props] of Object.entries(elements)) {
      const nudgeTopValue = parseFloat(props.nudgeTop);
      const spaceAfterValue = parseFloat(props.spaceAfter);
      const marginBottom = spaceAfterValue - nudgeTopValue;
      
      // Determine the HTML tag to use based on classname
      const isHeading = /^h[1-6]$/.test(classname);
      const tag = isHeading ? classname : 'p';
      
      htmlContent += `
    <div class="element-info">
      .${classname} { font-size: ${props.fontSize}; line-height: ${props.lineHeight}; nudge-top: ${props.nudgeTop}; margin-bottom: ${marginBottom}rem; }
    </div>
    <${tag} class="${classname}">
      ${isHeading ? `This is a ${classname.toUpperCase()} heading` : `This is sample text using the "${classname}" class.`}
    </${tag}>
`;
    }

    htmlContent += `
  </div>

  <script>
    function toggleGrid() {
      document.body.classList.toggle('u-baseline-grid');
    }
  </script>
</body>
</html>
`;

    return htmlContent;
  }

  // Generate files from new input format
  async generateFiles(inputPath, outputDir = '.') {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    const config = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const inputDir = path.dirname(inputPath);
    
    // Font file is required
    if (!config.fontFile) {
      throw new Error(`Font file is required. Add "fontFile": "your-font.woff2" to your config file.`);
    }

    const fontPath = this.findFontFile(inputDir, config.fontFile);
    if (!fontPath) {
      throw new Error(`Font file not found: ${config.fontFile}
Checked directory: ${inputDir}
Supported formats: .woff2, .woff, .ttf, .otf

Please ensure your font file is in the same directory as your config file.`);
    }

    this.fontMetrics = await this.readFontMetrics(fontPath);

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
          const opentype = require('opentype.js');
          const font = opentype.parse(fontBuffer.buffer);
          
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
