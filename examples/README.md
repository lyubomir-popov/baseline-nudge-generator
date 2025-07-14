# Baseline Nudge Demo

This folder contains a live demonstration of the baseline nudge generator in action.

## Files

- `baseline-demo.html` - Interactive HTML demo with baseline grid visualization
- `typography-config.json` - Configuration file with typography scale settings
- `README.md` - This file

## How to Use

1. **Start the demo server** (from the project root):
   ```bash
   npm run demo
   ```
   This will start a local server and show you the URL to open.

2. **Open the demo** in your browser:
   ```
   http://localhost:8000/examples/baseline-demo.html
   ```

## Features

### Interactive Baseline Grid
- Toggle the red baseline grid on/off using the checkbox
- Red lines appear every 0.5rem (baselineUnit) to show the grid
- See how all typography elements align perfectly to these grid lines

### Live Configuration Loading
- The demo loads `typography-config.json` dynamically
- Calculates nudge values in real-time
- Applies the correct `padding-top` and `margin-bottom` values

### Typography Elements
Each element shows:
- **Font size** and **line height** from the config
- **Padding-top** equal to the calculated nudge value
- **Margin-bottom** equal to `(spaceAfter - nudge)`
- Visual alignment to the baseline grid

### Legal Font Loading
The demo uses the `@fontsource/inter` npm package, which provides the Inter font with proper licensing (OFL-1.1).

## How It Works

1. **Configuration**: The JSON config defines typography elements with font sizes and line heights
2. **Font Metrics**: Real font metrics are used to calculate precise baseline positions
3. **Nudge Calculation**: The system calculates how much to nudge each element to align with the grid
4. **CSS Application**: Styles are applied with:
   - `padding-top: {nudge}rem`
   - `margin-bottom: {spaceAfter - nudge}rem`

## What You'll See

The demo shows only the core typography elements (h1, h2, h3, h4, h5, h6, p) to avoid any styling that might interfere with baseline grid alignment. Each element displays:

- **Font size** and **line height** from the config
- **Padding-top** equal to the calculated nudge value
- **Margin-bottom** equal to `(spaceAfter - nudge)`
- Perfect visual alignment to the baseline grid

## Why This Approach

- **Clean demonstration**: Only baseline-aligned elements are shown
- **No interference**: Headers, explanatory text, and non-grid elements are removed
- **Pure alignment**: You can clearly see how each typography element aligns to the red grid lines
- **Practical application**: Shows exactly what you'd implement in your design system

## Technical Details

The demo simulates the actual font parsing that would happen with a real font file. In practice, the baseline nudge generator:

1. Reads font metrics from `.woff2`, `.woff`, `.ttf`, or `.otf` files
2. Calculates exact baseline positions for each font size
3. Determines the nudge needed to align to the baseline grid
4. Outputs CSS tokens with the calculated values

### Key Requirements for Baseline Grid Alignment

- **Line heights must be integer multiples of the baseline unit** (e.g., 4rem, 6rem, 8rem with 0.5rem baseline)
- **Font metrics must be extracted from actual font files** for precise calculations
- **All elements must use the calculated nudge values** to maintain alignment

### Automatic Line-Height Calculation

The generator uses this formula for optimal readability:

```
line-height = (ceil(font-size / baselineUnit) + 1) * baselineUnit
```

**Example with baselineUnit = 0.5rem:**
- **1rem font-size:** 1rem ÷ 0.5rem = 2 baseline units fit in font-size
- Add 1 extra baseline unit = 2 + 1 = 3 baseline units  
- 3 × 0.5rem = **1.5rem line-height** (1.5 ratio)

This ensures readable typography that perfectly aligns to the baseline grid.

This ensures perfect baseline alignment across all typography elements in your design system. 