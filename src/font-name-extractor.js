/**
 * Robust Font Name Extraction Utility
 * Handles problematic font names with comprehensive validation and fallback strategies
 * @author Lyubomir Popov
 */

const path = require('path');

/**
 * OpenType Name Table ID Priority Order
 * Based on OpenType specification and common font naming practices
 */
const NAME_ID_PRIORITY = [
    { id: 16, description: 'Typographic Family Name', priority: 1 },
    { id: 1, description: 'Font Family Name', priority: 2 },
    { id: 4, description: 'Full Font Name', priority: 3 },
    { id: 6, description: 'PostScript Name', priority: 4 }
];

/**
 * Font-specific cleanup patterns
 * Some fonts need specific cleanup based on their naming patterns
 */
const FONT_SPECIFIC_CLEANUP = {
    'Questa Regular': {
        patterns: [/\s*Webfont$/i, /\s*Regular$/i],
        replacement: ''
    },
    'Inter': {
        patterns: [/\s*Variable$/i, /\s*VF$/i],
        replacement: ''
    },
    'IBM Plex': {
        patterns: [/\s*Var$/i, /\s*Variable$/i],
        replacement: ''
    }
};

/**
 * Invalid name patterns that should be rejected
 */
const INVALID_NAME_PATTERNS = [
    /^\.+$/,                           // Only dots
    /^\s*$/,                           // Empty or whitespace only
    /^.{1}$/,                          // Single character
    /ilovetypography/i,                // Common licensing text
    /for\s+use\s+only/i,              // Licensing restriction
    /version\s+\d/i,                   // Version information
    /git-/i,                           // Git commit info
    /\d{4}-\d{2}-\d{2}/,              // Date patterns
    /\.(ttf|otf|woff|woff2)$/i,       // File extensions
    /test\s*font/i,                    // Test fonts
    /sample/i,                         // Sample fonts
    /demo/i,                           // Demo fonts
    /placeholder/i,                    // Placeholder names
    /untitled/i,                       // Untitled fonts
    /^font\s*$/i,                      // Generic "font" name
    /^regular\s*$/i,                   // Just "regular"
    /^bold\s*$/i,                      // Just "bold"
    /^italic\s*$/i,                    // Just "italic"
    /^\d+$/,                           // Just numbers
    /[^\x20-\x7E]/,                    // Non-ASCII characters (basic check)
];

/**
 * Common font name cleanup patterns
 * More conservative - preserves meaningful weight/style descriptors
 */
const CLEANUP_PATTERNS = [
    // Remove technical suffixes first
    { pattern: /\s*-webfont$/i, replacement: '' },
    { pattern: /-webfont$/i, replacement: '' },
    { pattern: /\s*webfont$/i, replacement: '' },
    { pattern: /\s*Web\s*Font$/i, replacement: '' },
    { pattern: /\s*VF$/i, replacement: '' },
    { pattern: /\s*Variable$/i, replacement: '' },
    { pattern: /\s*Var$/i, replacement: '' },

    // Remove version info
    { pattern: /\s*\d+\s*$/, replacement: '' },
    { pattern: /\s*v\d+(\.\d+)*\s*$/i, replacement: '' },
    { pattern: /\s*version\s*\d+\s*$/i, replacement: '' },
    { pattern: /\s*git-[a-f0-9]+\s*$/i, replacement: '' },

    // Remove brackets and parentheses content
    { pattern: /\s*\([^)]*\)\s*$/, replacement: '' },
    { pattern: /\s*\[[^\]]*\]\s*$/, replacement: '' },
    { pattern: /\s*\{[^}]*\}\s*$/, replacement: '' },

    // Only remove "Regular" and "Normal" if they appear to be redundant
    // (i.e., only if there are no other weight/style descriptors)
    { pattern: /^(.+?)\s*-\s*Regular$/i, replacement: '$1', condition: 'noOtherWeightStyle' },
    { pattern: /^(.+?)\s*Regular$/i, replacement: '$1', condition: 'noOtherWeightStyle' },
    { pattern: /^(.+?)\s*-\s*Normal$/i, replacement: '$1', condition: 'noOtherWeightStyle' },
    { pattern: /^(.+?)\s*Normal$/i, replacement: '$1', condition: 'noOtherWeightStyle' },

    // Normalize spacing
    { pattern: /\s+/g, replacement: ' ' },
];

/**
 * Validates if a font name is suitable for use
 * @param {string} name - The font name to validate
 * @returns {boolean} - True if the name is valid
 */
function isValidFontName(name) {
    if (!name || typeof name !== 'string') {
        return false;
    }

    const trimmed = name.trim();

    // Check against invalid patterns
    for (const pattern of INVALID_NAME_PATTERNS) {
        if (pattern.test(trimmed)) {
            return false;
        }
    }

    // Must be at least 2 characters
    if (trimmed.length < 2) {
        return false;
    }

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(trimmed)) {
        return false;
    }

    return true;
}

/**
 * Cleans up a font name by removing common suffixes and patterns
 * More conservative approach that preserves meaningful descriptors
 * @param {string} name - The font name to clean
 * @returns {string} - The cleaned font name
 */
function cleanupFontName(name) {
    if (!name || typeof name !== 'string') {
        return '';
    }

    let cleaned = name.trim();

    // Apply font-specific cleanup first
    for (const [fontName, config] of Object.entries(FONT_SPECIFIC_CLEANUP)) {
        if (cleaned.toLowerCase().includes(fontName.toLowerCase())) {
            for (const pattern of config.patterns) {
                cleaned = cleaned.replace(pattern, config.replacement);
            }
        }
    }

    // Check if this has meaningful weight/style descriptors
    const hasWeightStyle = /\b(thin|light|regular|medium|semibold|bold|heavy|black|ultra|extra|italic|oblique)\b/i.test(cleaned);

    // Apply general cleanup patterns
    for (const { pattern, replacement, condition } of CLEANUP_PATTERNS) {
        if (condition === 'noOtherWeightStyle' && hasWeightStyle) {
            // Skip patterns that would remove weight/style info if other descriptors exist
            continue;
        }
        cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned.trim();
}

/**
 * Extracts font family name from filename as fallback
 * Preserves meaningful weight/style descriptors
 * @param {string} fontPath - Path to the font file
 * @returns {string|null} - Extracted font name or null
 */
function extractFontNameFromPath(fontPath) {
    try {
        const filename = path.basename(fontPath, path.extname(fontPath));

        // Remove technical prefixes (numbers, prefixes) and suffixes
        let name = filename
            .replace(/^\d+-/, '')           // Remove leading numbers like "2-" or "5-"
            .replace(/[-_]/g, ' ')          // Replace separators with spaces
            .replace(/\bwebfont\b/gi, '')   // Remove "webfont" but preserve weight/style
            .trim();

        // Clean up the result (this will preserve weight/style if meaningful)
        name = cleanupFontName(name);

        if (isValidFontName(name)) {
            return name;
        }

        // Try parent directory name
        const parentDir = path.basename(path.dirname(fontPath));
        const dirName = parentDir
            .replace(/[-_]/g, ' ')
            .replace(/\bfonts?\b/gi, '')
            .trim();

        const cleanedDirName = cleanupFontName(dirName);
        if (isValidFontName(cleanedDirName)) {
            return cleanedDirName;
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extracts font name from OpenType name table using priority order
 * @param {Object} nameTable - Font name table object
 * @returns {string|null} - Extracted font name or null
 */
function extractFontNameFromNameTable(nameTable) {
    if (!nameTable || typeof nameTable !== 'object') {
        return null;
    }

    // Try name table records in priority order
    const nameProperties = [
        'preferredFamily',      // Name ID 16
        'fontFamily',          // Name ID 1
        'fullName',            // Name ID 4
        'postScriptName'       // Name ID 6
    ];

    for (const prop of nameProperties) {
        if (nameTable[prop]) {
            let name = null;

            // Try English first
            if (nameTable[prop].en) {
                name = nameTable[prop].en;
            } else if (typeof nameTable[prop] === 'string') {
                name = nameTable[prop];
            } else if (typeof nameTable[prop] === 'object') {
                // Try other languages
                const values = Object.values(nameTable[prop]);
                if (values.length > 0) {
                    name = values[0];
                }
            }

            if (name && typeof name === 'string') {
                const cleaned = cleanupFontName(name);
                if (isValidFontName(cleaned)) {
                    return cleaned;
                }
            }
        }
    }

    return null;
}

/**
 * Extracts font name from opentype.js font object
 * @param {Object} otFont - OpenType.js font object
 * @returns {string|null} - Extracted font name or null
 */
function extractFontNameFromOpenType(otFont) {
    if (!otFont || !otFont.names) {
        return null;
    }

    const nameProperties = [
        'preferredFamily',
        'fontFamily',
        'fullName',
        'postScriptName'
    ];

    for (const prop of nameProperties) {
        if (otFont.names[prop]) {
            let name = null;

            if (otFont.names[prop].en) {
                name = otFont.names[prop].en;
            } else if (typeof otFont.names[prop] === 'string') {
                name = otFont.names[prop];
            } else if (typeof otFont.names[prop] === 'object') {
                const values = Object.values(otFont.names[prop]);
                if (values.length > 0) {
                    name = values[0];
                }
            }

            if (name && typeof name === 'string') {
                const cleaned = cleanupFontName(name);
                if (isValidFontName(cleaned)) {
                    return cleaned;
                }
            }
        }
    }

    return null;
}

/**
 * Main font name extraction function with comprehensive fallback strategy
 * @param {string} fontPath - Path to the font file
 * @param {Object} nameTable - Font name table (fontkit)
 * @param {Object} otFont - OpenType.js font object (optional)
 * @returns {string} - Extracted font name or fallback
 */
function extractRobustFontName(fontPath, nameTable = null, otFont = null) {
    // Try name table first (most reliable)
    if (nameTable) {
        const nameFromTable = extractFontNameFromNameTable(nameTable);
        if (nameFromTable) {
            return nameFromTable;
        }
    }

    // Try opentype.js as fallback
    if (otFont) {
        const nameFromOpenType = extractFontNameFromOpenType(otFont);
        if (nameFromOpenType) {
            return nameFromOpenType;
        }
    }

    // Try extracting from file path
    const nameFromPath = extractFontNameFromPath(fontPath);
    if (nameFromPath) {
        return nameFromPath;
    }

    // Last resort: use filename without extension
    const filename = path.basename(fontPath, path.extname(fontPath));
    return filename.replace(/[-_]/g, ' ').trim() || 'Unknown Font';
}

module.exports = {
    extractRobustFontName,
    isValidFontName,
    cleanupFontName,
    extractFontNameFromPath,
    extractFontNameFromNameTable,
    extractFontNameFromOpenType,
    NAME_ID_PRIORITY,
    INVALID_NAME_PATTERNS,
    CLEANUP_PATTERNS
};
