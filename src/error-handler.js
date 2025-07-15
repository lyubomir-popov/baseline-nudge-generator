/**
 * Custom error classes for better error handling
 */

class FontFileError extends Error {
  constructor(message, fontPath) {
    super(message);
    this.name = 'FontFileError';
    this.fontPath = fontPath;
  }
}

class ConfigurationError extends Error {
  constructor(message, configPath) {
    super(message);
    this.name = 'ConfigurationError';
    this.configPath = configPath;
  }
}

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class FontMetricsError extends Error {
  constructor(message, fontPath) {
    super(message);
    this.name = 'FontMetricsError';
    this.fontPath = fontPath;
  }
}

/**
 * Format error message for CLI output
 * @param {Error} error - Error to format
 * @returns {string} Formatted error message
 */
function formatErrorForCLI(error) {
  let message = `❌ ${error.name}: ${error.message}`;

  switch (error.name) {
    case 'FontFileError':
      message += `\n   Font file: ${error.fontPath}`;
      message += `\n   💡 Supported formats: .woff2, .woff, .ttf, .otf`;
      break;

    case 'ConfigurationError':
      message += `\n   Config file: ${error.configPath}`;
      message += `\n   💡 Run 'baseline-nudges init' to create a sample config`;
      break;

    case 'ValidationError':
      if (error.errors.length > 0) {
        message += `\n   Validation errors:`;
        error.errors.forEach(err => {
          message += `\n     • ${err}`;
        });
      }
      break;

    case 'FontMetricsError':
      message += `\n   Font file: ${error.fontPath}`;
      message += `\n   💡 Try a different font format or check if the file is corrupted`;
      break;
  }

  return message;
}

/**
 * Handle errors gracefully with user-friendly messages
 * @param {Error} error - Error to handle
 * @param {boolean} isCliContext - Whether this is called from CLI
 */
function handleError(error, isCliContext = false) {
  if (isCliContext) {
    console.error(formatErrorForCLI(error));
    process.exit(1);
  } else {
    throw error;
  }
}

/**
 * Wrap async functions with error handling
 * @param {Function} fn - Async function to wrap
 * @param {boolean} isCliContext - Whether this is CLI context
 * @returns {Function} Wrapped function
 */
function withErrorHandling(fn, isCliContext = false) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, isCliContext);
    }
  };
}

module.exports = {
  FontFileError,
  ConfigurationError,
  ValidationError,
  FontMetricsError,
  formatErrorForCLI,
  handleError,
  withErrorHandling
};
