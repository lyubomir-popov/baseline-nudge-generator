# @lyubomir-popov/baseline-nudge-generator

Automatic font metrics reader that generates baseline grid nudges for CSS typogr3. **Regenerate with your font:**

```bash
baseline-nudges generate config/typography-config.json
```

The font name will be automatically extracted from your font file and used in the generated HTML and CSS.

## Configuration Format

The `typography-config.json` file defines your typography scale and baseline grid settings:

```json
{
  "baselineUnit": 0.5,
  "fontFile": "../fonts/FiraSans-Regular.ttf",
  "elements": [
    {
      "classname": "h1",
      "fontSize": 2.5,
      "lineHeight": 5,
      "spaceAfter": 4
    },
    {
      "classname": "p",
      "fontSize": 1,
      "lineHeight": 3,
      "spaceAfter": 3
    }
  ]
}
```

### Configuration Properties

- **`baselineUnit`** (number): The baseline grid unit in rem. Common values are 0.5rem or 0.25rem.
- **`fontFile`** (string): Relative path to your font file from the config directory.
- **`elements`** (array): Array of typography elements to generate.

### Element Properties

Each element in the `elements` array has these properties:

- **`classname`** (string): CSS class name for the element (e.g., "h1", "p", "caption").
- **`fontSize`** (number): Font size in rem units (e.g., 2.5 = 2.5rem).
- **`lineHeight`** (integer): Number of baseline units for line height (e.g., 5 = 5 × 0.5rem = 2.5rem).
- **`spaceAfter`** (integer): Number of baseline units for space after the element (e.g., 4 = 4 × 0.5rem = 2rem). Note: The actual CSS margin-bottom will be adjusted by subtracting the baseline nudge (padding-top) to ensure that nudge + spaceAfter equals an exact multiple of the baseline unit.

### Important: LineHeight vs FontSize

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

```json
{
  "font": "Fira Sans",
  "baselineUnit": 0.5,
  "fontFile": "../fonts/FiraSans-Regular.ttf",
  "elements": [
    {
      "classname": "h1",
      "fontSize": 2.5,
      "lineHeight": 2.5,
      "paddingTop": 0.375,
      "marginBottom": 1.625
    }
  ]
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

````javascript
const tokens = require('./dist/tokens.json');

// Generate CSS
tokens.elements.forEach(element => {
  console.log(`
.${element.classname} {
  font-size: ${element.fontSize}rem;
  line-height: ${element.lineHeight}rem;
  padding-top: ${element.paddingTop}rem;
  margin-bottom: ${element.marginBottom}rem;
}
  `);
});
```ystems. Perfect for design systems that need precise typographic alignment.

## What's New

- **One-command setup:** Run `baseline-nudges setup` to download font and create config automatically
- **Reliable font source:** Uses Fira Sans from Google Fonts GitHub mirror (won't break)
- **Automatic font name extraction:** Extracts font name from TTF/WOFF files automatically
- **Simplified format support:** TTF, WOFF, OTF supported (WOFF2 removed for reliability)
- **Out-of-the-box experience:** No manual font file management needed

## Features

- **Font metrics reading** - Extracts precise metrics from webfont files (TTF, WOFF, OTF)
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
````

Or for local project use:

```bash
npm install --save-dev @lyubomir-popov/baseline-nudge-generator
```

## Quick Start

1. **Install the package:**

   ```bash
   npm install -g @lyubomir-popov/baseline-nudge-generator
   ```

2. **Set up your project (one command does it all):**

   ```bash
   baseline-nudges setup
   ```

   This will:

   - Download Fira Sans font to `fonts/FiraSans-Regular.ttf`
   - Create `config/typography-config.json` with the font path
   - Extract the font name automatically

3. **Generate tokens and HTML:**

   ```bash
   baseline-nudges generate config/typography-config.json
   ```

   This creates:

   - `dist/tokens.json` - Design tokens with calculated nudge values
   - `dist/index.html` - Visual demo with baseline grid overlay
   - `dist/fonts/FiraSans-Regular.ttf` - Font file for the HTML demo

4. **View the result:**
   ```bash
   open dist/index.html
   ```

**That's it!** You now have working baseline grid typography with automatic font name extraction.

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
     "elements": [
       {
         "classname": "h1",
         "fontSize": 2.5,
         "lineHeight": 5
       }
     ]
   }
   ```

3. **Customize your typography scale:**

   Edit the `elements` array to match your design system:

   ```json
   {
     "elements": [
       {
         "classname": "h1", // CSS class name (can be "h1", ".heading-1", etc.)
         "fontSize": 3, // Font size in rem
         "lineHeight": 6, // Line height in baseline units (6 × 0.5rem = 3rem)
         "spaceAfter": 5 // Space after in baseline units (5 × 0.5rem = 2.5rem)
       },
       {
         "classname": "body-text",
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

### ❌ Not Supported

- **WOFF2** - Removed for reliability (use TTF/WOFF instead)

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

# Show help
baseline-nudges --help
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
