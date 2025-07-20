# @lyubomir-popov/baseline-nudge-generator

Automatic font metrics reader that generates baseline grid nudges for CSS typography. Extracts precise font metrics from webfont files and calculates the exact CSS nudges needed to align text to a baseline grid.

## Quick Start

1. **Install the package:**

   ```bash
   npm install -g @lyubomir-popov/baseline-nudge-generator
   ```

2. **Set up your project (one command does it all):**

   ```bash
   baseline-nudges setup
   ```

3. **Generate tokens and HTML:**

   ```bash
   baseline-nudges generate config/typography-config.json
   ```

4. **View the result:**
   ```bash
   open dist/index.html
   ```

## What's New in This Version

- **🎨 Multi-font support**: Use multiple font families (sans, serif) with different nudge calculations per element
- **⚖️ Per-element font styling**: Specify `fontFamily`, `fontWeight`, and `fontStyle` for each element
- **🔧 Fixed critical baseline calculation bug**: Corrected lineGap distribution formula for accurate baseline alignment
- **📏 Improved baseline offset calculation**: Now properly distributes lineGap above and below text baseline
- **🎨 Complete typescale support**: Full h1-h6 and paragraph element configuration
- **🧹 Production-ready code**: Removed debug outputs, added ESLint, improved error handling
- **🔤 Enhanced font name extraction**: Robust font name detection from various font formats
- **📝 Better HTML examples**: Improved sample text format and visual presentation

## How It Works

The tool uses the **corrected baseline calculation formula**:

```
baselineOffsetRem = leadingRem/2 + ascenderRem + (lineGapRem/2)
```

This ensures that lineGap is properly distributed above and below the text baseline, fixing previous calculation errors that caused misalignment.

## Configuration Format

The `typography-config.json` file defines your typography scale and baseline grid settings. Two formats are supported:

### New Multi-Font Format (Recommended)

```json
{
  "baselineUnit": 0.5,
  "fontFiles": [
    {
      "family": "sans",
      "path": "../fonts/IBMPlexSans-Regular.woff"
    },
    {
      "family": "serif",
      "path": "../fonts/IBMPlexSerif-Regular.woff"
    }
  ],
  "elements": [
    {
      "identifier": "h1",
      "fontSize": 5.25,
      "lineHeight": 10,
      "spaceAfter": 3,
      "fontFamily": "sans",
      "fontWeight": 700,
      "fontStyle": "normal"
    },
    {
      "identifier": "p",
      "fontSize": 1,
      "lineHeight": 3,
      "spaceAfter": 3,
      "fontFamily": "serif",
      "fontWeight": 400,
      "fontStyle": "normal"
    }
  ]
}
```

### Legacy Single-Font Format

```json
{
  "baselineUnit": 0.5,
  "fontFile": "../fonts/FiraSans-Regular.ttf",
  "elements": [
    {
      "identifier": "h1",
      "fontSize": 5.25,
      "lineHeight": 10,
      "spaceAfter": 3
    },
    {
      "identifier": "p",
      "fontSize": 1,
      "lineHeight": 3,
      "spaceAfter": 3
    }
  ]
}
```

### Configuration Properties

#### Multi-Font Format
- **`baselineUnit`** (number): The baseline grid unit in rem. Common values are 0.5rem or 0.25rem.
- **`fontFiles`** (array): Array of font file definitions with `family` and `path` properties.
- **`elements`** (array): Array of typography elements to generate.

#### Legacy Single-Font Format
- **`baselineUnit`** (number): The baseline grid unit in rem. Common values are 0.5rem or 0.25rem.
- **`fontFile`** (string): Relative path to your font file from the config directory.
- **`elements`** (array): Array of typography elements to generate.

### Element Properties

Each element in the `elements` array has these properties:

#### Required Properties
- **`identifier`** (string): Element identifier or CSS class name (e.g., "h1", "p", "caption", ".heading-large").
- **`fontSize`** (number): Font size in rem units (e.g., 2.5 = 2.5rem).
- **`lineHeight`** (integer): Number of baseline units for line height (e.g., 5 = 5 × 0.5rem = 2.5rem).
- **`spaceAfter`** (integer): Number of baseline units for space after the element (e.g., 4 = 4 × 0.5rem = 2rem). Note: The actual CSS margin-bottom will be adjusted by subtracting the baseline nudge (padding-top) to ensure that nudge + spaceAfter equals an exact multiple of the baseline unit.

#### Optional Properties (Multi-Font Format Only)
- **`fontFamily`** (string): Font family to use (e.g., "sans", "serif"). Defaults to "sans" if not specified.
- **`fontWeight`** (number): Font weight (100-900). Defaults to 400 if not specified.
- **`fontStyle`** (string): Font style ("normal" or "italic"). Defaults to "normal" if not specified.

### Important: Line Height vs Font Size

**Key difference**:

- `fontSize` is specified in **rem units** (e.g., 2.5 = 2.5rem)
- `lineHeight` is specified as **number of baseline units** (e.g., 5 = 5 × 0.5rem = 2.5rem)
- `spaceAfter` is specified as **number of baseline units** (e.g., 4 = 4 × 0.5rem = 2rem)

This ensures all line heights and spacing are perfect multiples of your baseline unit, maintaining consistent vertical rhythm throughout your typography system.

### Example Calculation

With `baselineUnit: 0.5`:

- `fontSize: 2.5` = 2.5rem font size
- `lineHeight: 5` = 5 × 0.5rem = 2.5rem line height
- `spaceAfter: 4` = 4 × 0.5rem = 2rem space after element

**Important**: The actual CSS `margin-bottom` will be calculated as `spaceAfter - nudgeTop` to ensure proper baseline alignment. For example, if the calculated nudge is 0.375rem, the margin-bottom becomes 2rem - 0.375rem = 1.625rem, so that the total spacing (padding-top + margin-bottom) aligns perfectly with the baseline grid.

## Generated Files

Running `baseline-nudges generate config/typography-config.json` creates:

### `dist/tokens.json`

Design tokens with calculated nudge values for each typography element:

#### Multi-Font Format
```json
{
  "baselineUnit": "0.5rem",
  "fontFiles": [
    {
      "family": "sans",
      "path": "../fonts/IBMPlexSans-Regular.woff"
    },
    {
      "family": "serif",
      "path": "../fonts/IBMPlexSerif-Regular.woff"
    }
  ],
  "elements": {
    "h1": {
      "fontSize": "5.25rem",
      "lineHeight": "5rem",
      "fontFamily": "sans",
      "fontWeight": 700,
      "fontStyle": "normal",
      "spaceAfter": "1.5rem",
      "nudgeTop": "0.48065rem"
    },
    "p": {
      "fontSize": "1rem",
      "lineHeight": "1.5rem",
      "fontFamily": "serif",
      "fontWeight": 400,
      "fontStyle": "normal",
      "spaceAfter": "1.5rem",
      "nudgeTop": "0.375rem"
    }
  }
}
```

#### Legacy Single-Font Format
```json
{
  "font": "Fira Sans",
  "fontWeight": 400,
  "baselineUnit": "0.5rem",
  "fontFile": "../fonts/FiraSans-Regular.ttf",
  "elements": {
    "h1": {
      "fontSize": "5.25rem",
      "lineHeight": "5rem",
      "fontWeight": 400,
      "spaceAfter": "1.5rem",
      "nudgeTop": "0.19065rem"
    },
    "p": {
      "fontSize": "1rem",
      "lineHeight": "1.5rem",
      "fontWeight": 400,
      "spaceAfter": "1.5rem",
      "nudgeTop": "0.415rem"
    }
  }
}
```

### `dist/index.html`

Interactive HTML demo with:

- Baseline grid overlay (red lines)
- All typography elements with calculated nudges
- Self-contained with embedded font

### `dist/fonts/`

Copy of your font file for the HTML demo to work offline.

## Using the Generated Tokens

Import the tokens into your CSS build process or design system:

### Multi-Font Format
```javascript
const tokens = require("./dist/tokens.json");

// Generate CSS
Object.entries(tokens.elements).forEach(([identifier, element]) => {
  const nudgeTopValue = parseFloat(element.nudgeTop);
  const spaceAfterValue = parseFloat(element.spaceAfter);
  const marginBottom = spaceAfterValue - nudgeTopValue;

  console.log(`
.${identifier} {
  font-size: ${element.fontSize};
  line-height: ${element.lineHeight};
  font-family: ${element.fontFamily ? `'${element.fontFamily}', sans-serif` : 'inherit'};
  font-weight: ${element.fontWeight || 400};
  font-style: ${element.fontStyle || 'normal'};
  padding-top: ${element.nudgeTop};
  margin-bottom: ${marginBottom}rem;
  margin-top: 0;
}
  `);
});
```

### Legacy Single-Font Format
```javascript
const tokens = require("./dist/tokens.json");

// Generate CSS
Object.entries(tokens.elements).forEach(([identifier, element]) => {
  const nudgeTopValue = parseFloat(element.nudgeTop);
  const spaceAfterValue = parseFloat(element.spaceAfter);
  const marginBottom = spaceAfterValue - nudgeTopValue;

  console.log(`
.${identifier} {
  font-size: ${element.fontSize};
  line-height: ${element.lineHeight};
  font-weight: ${element.fontWeight};
  padding-top: ${element.nudgeTop};
  margin-bottom: ${marginBottom}rem;
  margin-top: 0;
}
  `);
});
```

Perfect for design systems that need precise typographic alignment with proper baseline grid spacing.

## Key Features

- **🎨 Multi-font support** - Use multiple font families (sans, serif) with different nudge calculations per element
- **⚖️ Per-element font styling** - Specify `fontFamily`, `fontWeight`, and `fontStyle` for each element
- **🔧 Corrected baseline calculation** - Fixed critical lineGap distribution bug for accurate alignment
- **📏 Precise font metrics reading** - Extracts exact metrics from TTF, WOFF, and OTF files
- **🎨 Complete typescale support** - Full h1-h6 and paragraph element configuration
- **🔤 Automatic font name extraction** - Robust font name detection from various font formats
- **🎯 Baseline nudge calculation** - Generates precise CSS nudges for baseline grid alignment
- **📱 Responsive baseline grids** - Handles tight line-heights with negative nudge compensation
- **🎭 Interactive HTML demos** - Visual examples with baseline grid overlay
- **🧹 Production-ready code** - Clean, ESLint-compliant codebase without debug outputs
- **🔄 CLI and API access** - Command-line tool and programmatic JavaScript API
- **⚡ One-command setup** - `baseline-nudges setup` downloads font and creates config automatically

## Installation

```bash
npm install -g @lyubomir-popov/baseline-nudge-generator
```

Or for local project use:

```bash
npm install --save-dev @lyubomir-popov/baseline-nudge-generator
```

## Using Your Own Font

After running `baseline-nudges setup`, you can replace the downloaded font:

1. **Replace the font file:**

   ```bash
   # Replace with your font file
   cp path/to/your-font.ttf fonts/FiraSans-Regular.ttf

   # Or rename your font and update the config
   cp path/to/your-font.ttf fonts/YourFont-Regular.ttf
   ```

2. **Update the config file:**

   Edit `config/typography-config.json` and change the `fontFile` path:

   ```json
   {
     "baselineUnit": 0.5,
     "fontFile": "../fonts/YourFont-Regular.ttf",
     "elements": [{ "identifier": "h1", "fontSize": 2.5, "lineHeight": 5 }]
   }
   ```

3. **Customize your typography scale:**

   Edit the `elements` array to match your design system:

   ```json
   {
     "elements": [
       {
         "identifier": "h1", // Element identifier or CSS class name
         "fontSize": 3, // Font size in rem
         "lineHeight": 6, // Line height in baseline units (6 × 0.5rem = 3rem)
         "spaceAfter": 5 // Space after in baseline units (5 × 0.5rem = 2.5rem)
       },
       {
         "identifier": "body-text",
         "fontSize": 1,
         "lineHeight": 3,
         "spaceAfter": 3
       }
     ]
   }
   ```

4. **Regenerate with your font:**
   ```bash
   baseline-nudges generate config/typography-config.json
   ```

The font name will be automatically extracted from your font file and used in the generated HTML and tokens.

## Font Format Support

The tool supports various font formats:

### ✅ Supported Formats

- **TTF (TrueType)** - Recommended for best compatibility
- **WOFF (Web Open Font Format)** - Good compatibility
- **OTF (OpenType)** - Good compatibility
- **WOFF2** - Supported via automatic decompression to TTF

### 🔧 WOFF2 Decompression

WOFF2 files are automatically decompressed to TTF format for processing:

```bash
# Decompress WOFF2 manually if needed
baseline-nudges decompress-woff2 input.woff2 output.ttf
```

The setup process automatically downloads Fira Sans in TTF format for maximum compatibility.

## JavaScript API

```javascript
const {
  BaselineNudgeGenerator,
  generateFromConfig,
} = require("@lyubomir-popov/baseline-nudge-generator");

// Generate from config file
const result = await generateFromConfig(
  "./config/typography-config.json",
  "./dist"
);

// Or use the class directly
const generator = new BaselineNudgeGenerator();
const result = await generator.generateFiles(
  "./config/typography-config.json",
  "./dist"
);
```

## CLI Commands

```bash
# Setup project with font download
baseline-nudges setup

# Generate tokens and HTML demo
baseline-nudges generate config/typography-config.json

# Generate to specific output directory
baseline-nudges generate config/typography-config.json custom-output/

# Create example configuration (downloads font automatically)
baseline-nudges init

# Create example configuration with custom name
baseline-nudges init my-typography

# Validate configuration file
baseline-nudges validate config/typography-config.json

# Legacy SCSS generation (backward compatibility)
baseline-nudges generate-legacy config/typography-config.json output.scss

# Watch mode for legacy SCSS (automatic regeneration)
baseline-nudges watch config/typography-config.json output.scss

# Show help
baseline-nudges --help

# Show version
baseline-nudges --version
```

## Requirements

- Node.js 14.0.0 or higher
- Font file in WOFF2, WOFF, TTF, or OTF format (required)

## License

MIT

## Contributing

Issues and pull requests are welcome. Please ensure your contributions include tests and documentation.

## Related Projects

- [Vanilla Framework](https://vanillaframework.io) - The CSS framework this tool originally supported
- [OpenType.js](https://opentype.js.org/) - Font parsing library used for metrics extraction
- [Inter Font](https://rsms.github.io/inter/) - Used in examples and testing
