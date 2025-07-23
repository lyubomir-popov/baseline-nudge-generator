const fs = require('fs');
const path = require('path');

/**
 * Check if a number is a multiple of 0.5
 * @param {number} value - Number to check
 * @returns {boolean} True if the number is a multiple of 0.5
 */
function isMultipleOfHalf(value) {
    if (typeof value !== 'number' || value <= 0) {
        return false;
    }
    // Check if the value is a multiple of 0.5 by multiplying by 2 and checking if it's an integer
    return Number.isInteger(value * 2);
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @param {string} configPath - Path to config file (for relative font file resolution)
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateConfig(config, configPath = '') {
    const errors = [];
    const warnings = [];

    // Check if config is an object
    if (!config || typeof config !== 'object') {
        errors.push('Configuration must be a valid JSON object');
        return { isValid: false, errors, warnings };
    }

    // Required fields
    if (!config.baselineUnit) {
        errors.push('baselineUnit is required');
    } else if (typeof config.baselineUnit !== 'number' || config.baselineUnit <= 0) {
        errors.push('baselineUnit must be a positive number');
    }

    // Font file validation - support both single fontFile and multiple fontFiles
    if (config.fontFiles) {
        // New format with multiple font files
        if (!Array.isArray(config.fontFiles)) {
            errors.push('fontFiles must be an array');
        } else {
            config.fontFiles.forEach((fontFile, index) => {
                const prefix = `fontFiles[${index}]`;
                
                if (!fontFile.path) {
                    errors.push(`${prefix}.path is required`);
                } else if (typeof fontFile.path !== 'string') {
                    errors.push(`${prefix}.path must be a string`);
                } else {
                    // Check if font file exists
                    const fontPath = path.resolve(path.dirname(configPath), fontFile.path);
                    if (!fs.existsSync(fontPath)) {
                        errors.push(`Font file not found: ${fontFile.path} (resolved to: ${fontPath})`);
                    } else {
                        // Check font file extension
                        const ext = path.extname(fontFile.path).toLowerCase();
                        const supportedExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
                        if (!supportedExtensions.includes(ext)) {
                            warnings.push(`Font file extension "${ext}" may not be supported. Supported: ${supportedExtensions.join(', ')}`);
                        }
                    }
                }

                if (!fontFile.family) {
                    errors.push(`${prefix}.family is required`);
                } else if (typeof fontFile.family !== 'string') {
                    errors.push(`${prefix}.family must be a string`);
                }


            });
        }
    } else if (config.fontFile) {
        // Legacy format with single font file
        if (typeof config.fontFile !== 'string') {
            errors.push('fontFile must be a string');
        } else {
            // Check if font file exists
            const fontPath = path.resolve(path.dirname(configPath), config.fontFile);
            if (!fs.existsSync(fontPath)) {
                errors.push(`Font file not found: ${config.fontFile} (resolved to: ${fontPath})`);
            } else {
                // Check font file extension
                const ext = path.extname(config.fontFile).toLowerCase();
                const supportedExtensions = ['.woff2', '.woff', '.ttf', '.otf'];
                if (!supportedExtensions.includes(ext)) {
                    warnings.push(`Font file extension "${ext}" may not be supported. Supported: ${supportedExtensions.join(', ')}`);
                }
            }
        }
    } else {
        errors.push('Either fontFile (legacy) or fontFiles (new format) is required');
    }

    // Elements validation
    if (config.elements) {
        // New format
        if (!Array.isArray(config.elements)) {
            errors.push('elements must be an array');
        } else {
            config.elements.forEach((element, index) => {
                const prefix = `elements[${index}]`;

                // Support both 'identifier' (new) and 'classname' (legacy) for backward compatibility
                if (!element.identifier && !element.classname) {
                    errors.push(`${prefix}.identifier is required`);
                } else if (element.identifier && typeof element.identifier !== 'string') {
                    errors.push(`${prefix}.identifier must be a string`);
                } else if (element.classname && typeof element.classname !== 'string') {
                    errors.push(`${prefix}.classname must be a string`);
                }

                if (element.fontSize === undefined) {
                    errors.push(`${prefix}.fontSize is required`);
                } else if (typeof element.fontSize !== 'number' || element.fontSize <= 0) {
                    errors.push(`${prefix}.fontSize must be a positive number`);
                }

                if (element.lineHeight === undefined) {
                    errors.push(`${prefix}.lineHeight is required`);
                } else if (!isMultipleOfHalf(element.lineHeight)) {
                    errors.push(`${prefix}.lineHeight must be a positive number that is a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, 2.5, etc.)`);
                }

                if (element.spaceAfter !== undefined) {
                    if (!isMultipleOfHalf(element.spaceAfter)) {
                        errors.push(`${prefix}.spaceAfter must be a positive number that is a multiple of 0.5 (e.g., 1.0, 1.5, 2.0, 2.5, etc.)`);
                    }
                }

                // Validate fontFamily if fontFiles is used
                if (config.fontFiles && element.fontFamily) {
                    const availableFamilies = config.fontFiles.map(f => f.family);
                    if (!availableFamilies.includes(element.fontFamily)) {
                        errors.push(`${prefix}.fontFamily "${element.fontFamily}" not found in fontFiles. Available: ${availableFamilies.join(', ')}`);
                    }
                }

                // Validate fontWeight if specified
                if (element.fontWeight !== undefined) {
                    if (typeof element.fontWeight !== 'number' || element.fontWeight < 100 || element.fontWeight > 900) {
                        errors.push(`${prefix}.fontWeight must be a number between 100 and 900`);
                    }
                }

                // Validate fontStyle if specified
                if (element.fontStyle !== undefined) {
                    if (typeof element.fontStyle !== 'string' || !['normal', 'italic'].includes(element.fontStyle)) {
                        errors.push(`${prefix}.fontStyle must be either 'normal' or 'italic'`);
                    }
                }

                // Check if line height is reasonable
                if (element.fontSize && element.lineHeight && config.baselineUnit) {
                    const lineHeightRem = element.lineHeight * config.baselineUnit;
                    const ratio = lineHeightRem / element.fontSize;
                    if (ratio < 1) {
                        warnings.push(`${prefix}: line-height (${lineHeightRem}rem) is smaller than font-size (${element.fontSize}rem)`);
                    } else if (ratio > 3) {
                        warnings.push(`${prefix}: line-height ratio (${ratio.toFixed(1)}) is unusually large`);
                    }
                }
            });
        }
    } else {
        // Legacy format validation
        const requiredLegacyFields = ['fontSizes', 'lineHeights', 'spAfter'];
        requiredLegacyFields.forEach(field => {
            if (!config[field]) {
                errors.push(`${field} is required in legacy format`);
            } else if (typeof config[field] !== 'object') {
                errors.push(`${field} must be an object`);
            }
        });
    }

    // Optional fields validation
    if (config.font && typeof config.font !== 'string') {
        errors.push('font must be a string');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate configuration file
 * @param {string} configPath - Path to configuration file
 * @returns {Object} Validation result
 */
function validateConfigFile(configPath) {
    try {
        if (!fs.existsSync(configPath)) {
            return {
                isValid: false,
                errors: [`Configuration file not found: ${configPath}`],
                warnings: []
            };
        }

        const configContent = fs.readFileSync(configPath, 'utf8');
        let config;

        try {
            config = JSON.parse(configContent);
        } catch (parseError) {
            return {
                isValid: false,
                errors: [`Invalid JSON in configuration file: ${parseError.message}`],
                warnings: []
            };
        }

        return validateConfig(config, configPath);
    } catch (error) {
        return {
            isValid: false,
            errors: [`Error reading configuration file: ${error.message}`],
            warnings: []
        };
    }
}

module.exports = {
    validateConfig,
    validateConfigFile
};
