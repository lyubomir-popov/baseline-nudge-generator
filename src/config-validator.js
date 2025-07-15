const fs = require('fs');
const path = require('path');

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

  if (!config.fontFile) {
    errors.push('fontFile is required');
  } else if (typeof config.fontFile !== 'string') {
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

  // Elements validation
  if (config.elements) {
    // New format
    if (!Array.isArray(config.elements)) {
      errors.push('elements must be an array');
    } else {
      config.elements.forEach((element, index) => {
        const prefix = `elements[${index}]`;

        if (!element.classname) {
          errors.push(`${prefix}.classname is required`);
        } else if (typeof element.classname !== 'string') {
          errors.push(`${prefix}.classname must be a string`);
        }

        if (element.fontSize === undefined) {
          errors.push(`${prefix}.fontSize is required`);
        } else if (typeof element.fontSize !== 'number' || element.fontSize <= 0) {
          errors.push(`${prefix}.fontSize must be a positive number`);
        }

        if (element.lineHeight === undefined) {
          errors.push(`${prefix}.lineHeight is required`);
        } else if (typeof element.lineHeight !== 'number' || element.lineHeight <= 0 || !Number.isInteger(element.lineHeight)) {
          errors.push(`${prefix}.lineHeight must be a positive integer (number of baseline units)`);
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
