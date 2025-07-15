const fontkit = require('fontkit');
const path = require('path');
const opentype = require('opentype.js');

// Standalone font name extraction with opentype.js fallback
async function extractFontName(font, fontPath) {
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
    // Remove any null bytes or invalid characters
    fontName = fontName.replace(/\0/g, '').trim();

    // If we still have an empty string, use filename
    if (!fontName) {
      fontName = path.basename(fontPath, path.extname(fontPath));
    }
  }

  return fontName;
}

async function readFontMetrics(fontPath) {
  try {
    const font = fontkit.openSync(fontPath);
    // Use the standalone extractFontName function with opentype.js fallback
    const fontName = await extractFontName(font, fontPath);

    // Extract font-weight from OS/2 table
    let fontWeight = 400; // Default to normal weight
    if (font.tables && font.tables.os2) {
      const os2Table = font.tables.os2;
      if (os2Table.usWeightClass) {
        fontWeight = os2Table.usWeightClass;
      }
    }

    // Fontkit metrics: ascent, descent, lineGap, unitsPerEm, capHeight, xHeight
    return {
      fontName,
      fontWeight,
      ascent: font.ascent,
      descent: font.descent,
      lineGap: font.lineGap || 0,
      unitsPerEm: font.unitsPerEm,
      capHeight: font.capHeight || font.ascent * 0.7,
      xHeight: font.xHeight || font.ascent * 0.5
    };
  } catch (error) {
    throw new Error(`Fontkit failed to read font metrics: ${error.message}`);
  }
}

module.exports = {
  readFontMetrics
};