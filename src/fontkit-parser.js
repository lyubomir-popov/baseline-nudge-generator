const fontkit = require('fontkit');
const path = require('path');
const opentype = require('opentype.js');
const { extractRobustFontName } = require('./font-name-extractor');

// Robust font name extraction with comprehensive fallback strategy
async function extractFontName(font, fontPath) {
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