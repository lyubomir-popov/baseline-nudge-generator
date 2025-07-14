# @lyubomir-popov/baseline-nudge-generator

Automatic font metrics reader that generates baseline grid nudges for CSS typography systems. Perfect for design systems that need precise typographic alignment.

## Features

- **Font metrics reading** - Extracts precise metrics from webfont files (WOFF2, WOFF, TTF, OTF)
- **Baseline nudge calculation** - Generates precise CSS nudges for baseline grid alignment
- **JSON token generation** - Outputs design tokens with nudge values for each typography element
- **HTML example generation** - Creates a visual example page with baseline grid overlay
- **Flexible input format** - Accepts typography triplets (classname, font-size, line-height)
- **CLI tool** - Easy-to-use command-line interface
- **File watching** - Automatically regenerates when font settings change (legacy mode)
- **JavaScript API** - Programmatic access for build tools and automation
- **Backward compatibility** - Supports legacy SCSS generation for existing projects

## Installation

```bash
npm install -g @lyubomir-popov/baseline-nudge-generator
```

Or for local project use:

```bash
npm install --save-dev @lyubomir-popov/baseline-nudge-generator
```

## Development Workflow

### Local Development

For development and testing with the included demo:

```bash
# Clone the repository
git clone <repository-url>
cd baseline-nudge-generator

# Install dependencies
npm install

# Start development server with file watcher
npm run dev
```

This will:
- Start a Python HTTP server on `http://localhost:8001`
- Watch `examples/typography-config.json` for changes
- Automatically regenerate tokens and CSS when config changes
- Serve the demo page with baseline grid overlay

### Demo Configuration

The project includes a working demo in the `examples/` directory:

```json
{
  "font": "Inter",
  "baselineUnit": 0.5,
  "fontFile": "Inter-Regular.woff2",
  "elements": [
    { "classname": "h1", "fontSize": 5, "lineHeight": 11 },
    { "classname": "h2", "fontSize": 3.5, "lineHeight": 8 },
    { "classname": "h3", "fontSize": 3, "lineHeight": 7 },
    { "classname": "h4", "fontSize": 2.5, "lineHeight": 6 },
    { "classname": "h5", "fontSize": 2, "lineHeight": 5 },
    { "classname": "h6", "fontSize": 1.5, "lineHeight": 4 },
    { "classname": "p", "fontSize": 1, "lineHeight": 3 }
  ]
}
```

**Automatic Font Download**: The Inter font file is automatically downloaded during `npm install` and `npm run dev`.

### Demo Features

The demo page (`examples/index.html`) includes:
- **Clean typography display** - Only h1-h6 and p elements (no classes)
- **Baseline grid overlay** - Always visible red lines every 0.5rem
- **Dynamic CSS generation** - Reads from `tokens.json` and applies styles
- **Real font metrics** - Uses actual Inter font file for calculations
- **Automatic setup** - Font downloaded automatically, ready to use out of the box

> **Note:** The demo uses only element selectors (h1-h6, p) for clarity and simplicity. However, the configuration format supports both element names (e.g. "h1") and custom class names (e.g. ".my-heading").

### Available Scripts

```bash
npm run dev      # Start server + watcher (development)
npm run watch    # Watch config file for changes
npm run serve    # Start HTTP server only
npm start        # Run CLI tool
```

## Quick Start Guide

### 1. Create a test project

```bash
mkdir my-typography-test
cd my-typography-test
```

### 2. Initialize configuration

```bash
baseline-nudges init
```

This creates a `typography-config.json` file:

```json
{
  "font": "Inter",
  "baselineUnit": 0.5,
  "fontFile": "your-font.woff2",
  "elements": [
    { "classname": "h1", "fontSize": 4, "lineHeight": 8.5 },
    { "classname": "h2", "fontSize": 3.5, "lineHeight": 7.5 },
    { "classname": "h3", "fontSize": 3, "lineHeight": 6.5 },
    { "classname": "h4", "fontSize": 2.5, "lineHeight": 5.5 },
    { "classname": "h5", "fontSize": 2, "lineHeight": 4.5 },
    { "classname": "h6", "fontSize": 1.5, "lineHeight": 4 },
    { "classname": "p", "fontSize": 1, "lineHeight": 3 }
  ]
}
```

### 3. Add your font file (REQUIRED)

The tool requires a font file to calculate accurate baseline nudges.

**Download and add font file:**
```bash
# Option A: Download Inter font for testing
curl -o Inter-Regular.woff2 "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2"

# Option B: Copy your own font file
cp path/to/your/font.woff2 .

# Option C: Update the config to match your font filename
# Edit typography-config.json and change "fontFile": "your-font.woff2" to your actual filename
```

**Where to get font files:**
- [Google Fonts](https://fonts.google.com/) - Download font families
- [Font Squirrel](https://www.fontsquirrel.com/) - Free web fonts
- [Inter Font](https://github.com/rsms/inter/releases) - Open source font
- Commercial font providers (Adobe Fonts, Monotype, etc.)

**Important**: You must provide your own font files. This package does not include any fonts due to licensing restrictions.

### 4. Generate tokens and HTML

```bash
baseline-nudges generate typography-config.json
```

### 5. View results

```bash
open index.html
```

**Expected output:**
- `tokens.json` - Design tokens with calculated nudge values
- `index.html` - Visual example with baseline grid overlay
- Console output showing font metrics used

## Input Format

The tool accepts a JSON configuration with:

```json
{
  "font": "Inter",                    // Font family name (for Google Fonts import)
  "baselineUnit": 0.5,                // Baseline grid unit in rem (e.g., 0.5rem = 8px)
  "fontFile": "your-font.woff2",      // REQUIRED: Font file for accurate metrics
  "elements": [                       // Array of typography elements
    {
      "classname": "h1",              // CSS class name or HTML element name
      "fontSize": 4,                  // Font size in rem
      "lineHeight": 8.5               // Line height in baseline units
    },
    {
      "classname": "h2",
      "fontSize": 3.5,
      "lineHeight": 7.5
    },
    {
      "classname": "h3",
      "fontSize": 3,
      "lineHeight": 6.5
    },
    {
      "classname": "h4",
      "fontSize": 2.5,
      "lineHeight": 5.5
    },
    {
      "classname": "h5",
      "fontSize": 2,
      "lineHeight": 4.5
    },
    {
      "classname": "h6",
      "fontSize": 1.5,
      "lineHeight": 4
    },
    {
      "classname": "p",
      "fontSize": 1,
      "lineHeight": 3
    }
  ]
}
```

> **Note:** The `classname` field can be either an HTML element name (e.g. "h1", "p") or a custom class name (e.g. ".my-heading"). The demo uses only element names for simplicity, but the generator supports both.

**Key points:**
- `fontSize` is in rem units
- `lineHeight` is in multiples of `baselineUnit`
- `fontFile` is REQUIRED for accurate calculations
- Font file must be in the same directory as your config file

**Classname flexibility:**
- Use HTML tag names: `"h1"`, `"h2"`, `"p"`, etc.
- Use CSS class names: `"heading-1"`, `"body-text"`, `".large-title"`, etc.
- System handles both formats automatically

## Font Files

**Required formats:**
- `.woff2` (recommended)
- `.woff`
- `.ttf`
- `.otf`

**Font file discovery:**
The tool looks for your font file in this order:
1. Exact filename as specified
2. Filename with common extensions (.woff2, .woff, .ttf, .otf)
3. Errors if not found

**Where to get font files:**
- [Google Fonts](https://fonts.google.com/) - Click "Download family" 
- [Font Squirrel](https://www.fontsquirrel.com/) - Free web fonts
- [Inter Font](https://github.com/rsms/inter/releases) - Used in examples
- Commercial font providers (Adobe Fonts, Monotype, etc.)

## Generated Output

### tokens.json
```json
{
  "font": "Inter",
  "baselineUnit": "0.5rem",
  "elements": {
    "h1": {
      "fontSize": "4rem",
      "lineHeight": "4.25rem",        // lineHeight × baselineUnit (8.5 × 0.5)
      "spaceAfter": "2rem",           // Default spacing after element
      "nudgeTop": "0.182rem"          // Calculated nudge for baseline alignment
    },
    "h2": {
      "fontSize": "3.5rem",
      "lineHeight": "3.75rem",        // lineHeight × baselineUnit (7.5 × 0.5)
      "spaceAfter": "2rem",
      "nudgeTop": "0.136rem"
    }
  }
}
```

### index.html
Clean HTML example with:
- All typography elements (h1-h6, p) applied
- Baseline grid overlay (red lines every 0.5rem, always visible)
- Dynamic CSS generation from tokens.json
- Real font metrics from font file
- Proper baseline alignment demonstration

### _generated-nudges.scss (Legacy Mode)
When using legacy SCSS generation, the tool creates:

```scss
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Generated by @lyubomir-popov/baseline-nudge-generator

$baseline-unit: 0.5rem;
$font-sizes: (
  h1: 4rem,
  h2: 3.5rem,
  h3: 3rem,
  h4: 2.5rem,
  h5: 2rem,
  h6: 1.5rem,
  p: 1rem,
  small: 0.875rem,
);
$line-heights: (
  h1: 8.5 * $baseline-unit,
  h2: 7.5 * $baseline-unit,
  h3: 6.5 * $baseline-unit,
  h4: 5.5 * $baseline-unit,
  h5: 4.5 * $baseline-unit,
  h6: 4 * $baseline-unit,
  p: 3 * $baseline-unit,
  small: 2 * $baseline-unit,
);
$nudges: (
  h1: 0.182rem,
  h2: 0.136rem,
  h3: 0.089rem,
  h4: 0.043rem,
  h5: 0.291rem,
  h6: 0.245rem,
  p: 0.477rem,
  small: 0.261rem,
);
$space-after: (
  h1: 2rem,
  h2: 2rem,
  h3: 2rem,
  h4: 2rem,
  h5: 2rem,
  h6: 2rem,
  p: 2rem,
  small: 2rem,
);
$font-ascent: 1825;
$font-descent: -443;
$font-line-gap: 0;
$font-units-per-em: 2048;
$font-cap-height: 1467;
$font-x-height: 1062;
```

## CLI Usage

### New Format Commands

```bash
# Initialize new format configuration
baseline-nudges init [name]

# Generate tokens and HTML example
baseline-nudges generate <config.json> [output-dir]

# Examples
baseline-nudges init my-typography
baseline-nudges generate typography-config.json
baseline-nudges generate typography-config.json output/
```

### Legacy Format Commands (Backward Compatibility)

```bash
# Initialize legacy format configuration (for existing projects)
baseline-nudges init-legacy [name]

# Generate SCSS file from legacy configuration
baseline-nudges generate-legacy <config.json> [output.scss]

# Watch mode for legacy format
baseline-nudges watch <config.json> [output.scss]
```

## JavaScript API

### New Format API

```javascript
const { 
  BaselineNudgeGenerator, 
  generateFromConfig, 
  generateTokens, 
  generateHTML 
} = require('@lyubomir-popov/baseline-nudge-generator');

// Generate from config file
const result = await generateFromConfig('./typography.json', './output');

// Generate tokens from config object
const config = {
  font: "Inter",
  baselineUnit: 0.5,
  fontFile: "your-font.woff2",
  elements: [
    { classname: "h1", fontSize: 4, lineHeight: 8.5 },
    { classname: "body-text", fontSize: 1, lineHeight: 3 }
  ]
};
const tokens = generateTokens(config);

// Generate HTML from tokens
const html = generateHTML(tokens);
```

### Legacy API

```javascript
const { BaselineNudgeGenerator } = require('@lyubomir-popov/baseline-nudge-generator');

const generator = new BaselineNudgeGenerator();

// Generate SCSS (legacy)
generator.generateFile('./config.json', './output.scss');

// Watch for changes (legacy)
generator.watch('./config.json', './output.scss');
```

## Testing the Package

### Complete test example:

```bash
# 1. Create test directory
mkdir baseline-test && cd baseline-test

# 2. Install package
npm install -g @lyubomir-popov/baseline-nudge-generator

# 3. Initialize config
baseline-nudges init test-typography

# 4. Download font file (for testing)
curl -o Inter-Regular.woff2 "https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.woff2"

# 5. Update config to use the downloaded font
# Edit test-typography.json and change "fontFile": "your-font.woff2" to "fontFile": "Inter-Regular.woff2"

# 6. Generate tokens and HTML
baseline-nudges generate test-typography.json

# 7. View results
open index.html
```

### What to look for in the HTML output:
- Red baseline grid lines when "Toggle Baseline Grid" is clicked
- Text should align perfectly to the grid lines
- Font metrics panel shows actual values from your font file
- Each element shows its calculated nudge value
- No warning messages (all metrics are from font file)

## Error Handling

The tool will error out in these cases:

**No font file specified:**
```
Error: Font file is required. Add "fontFile": "your-font.woff2" to your config file.
```

**Font file not found:**
```
Error: Font file not found: Inter-Regular.woff2
Checked directory: /path/to/your/directory
Supported formats: .woff2, .woff, .ttf, .otf

Please ensure your font file is in the same directory as your config file.
```

**Font file can't be read:**
```
Error: Could not read font metrics from font.woff2: [detailed error]
```

## Integration with Design Systems

Use the generated tokens in your CSS:

```css
/* Example: Using tokens in CSS */
.h1 {
  font-family: 'Inter', sans-serif;
  font-size: 3rem;                 /* From tokens.elements.h1.fontSize */
  line-height: 3rem;               /* From tokens.elements.h1.lineHeight */
  padding-top: 0.182rem;           /* From tokens.elements.h1.nudgeTop */
  margin-bottom: 1.818rem;         /* spaceAfter - nudgeTop */
}
```

Convert to CSS custom properties:
```css
:root {
  --h1-font-size: 3rem;
  --h1-line-height: 3rem;
  --h1-nudge-top: 0.182rem;
  --h1-margin-bottom: 1.818rem;
}
```

## How Baseline Alignment Works

1. **Font metrics extraction**: Reads ascent, descent, unitsPerEm from font file
2. **Baseline calculation**: Calculates where text naturally sits vs. where it should sit
3. **Nudge computation**: Determines padding-top needed to align text to baseline grid
4. **Spacing adjustment**: Adjusts margin-bottom to maintain proper spacing

Formula: `nudge = ceil(baselineOffset / baselineUnit) * baselineUnit - baselineOffset`

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