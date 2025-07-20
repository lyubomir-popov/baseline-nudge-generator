const { BaselineNudgeGenerator } = require('./nudge-generator');

/**
 * Generate tokens and HTML from a configuration file
 * @param {string} configPath - Path to the configuration file
 * @param {string} outputDir - Output directory for generated files
 * @returns {Promise<Object>} Generated tokens and file paths
 */
async function generateFromConfig(configPath, outputDir = '.') {
    const generator = new BaselineNudgeGenerator();
    return await generator.generateFiles(configPath, outputDir);
}

/**
 * Generate tokens from a configuration object
 * @param {Object} config - Configuration object
 * @returns {Object} Generated tokens
 */
async function generateTokens(config) {
    const generator = new BaselineNudgeGenerator();

    // Load font metrics if fontFile is specified
    if (config.fontFile) {
        const fontPath = generator.findFontFile('.', config.fontFile);
        if (fontPath) {
            generator.fontMetrics = await generator.readFontMetrics(fontPath);
        }
    }

    return generator.generateTokens(config);
}

/**
 * Generate HTML from tokens
 * @param {Object} tokens - Generated tokens
 * @returns {string} Generated HTML
 */
function generateHTML(tokens) {
    const generator = new BaselineNudgeGenerator();
    return generator.generateHTML(tokens);
}

/**
 * Generate SCSS from configuration (legacy format)
 * @param {Object} config - Configuration object
 * @returns {string} Generated SCSS
 */
function generateSCSS(config) {
    const generator = new BaselineNudgeGenerator();
    return generator.generateScss(config);
}

/**
 * Read font metrics from a font file
 * @param {string} fontPath - Path to the font file
 * @returns {Promise<Object>} Font metrics
 */
async function readFontMetrics(fontPath) {
    const generator = new BaselineNudgeGenerator();
    return await generator.readFontMetrics(fontPath);
}

module.exports = {
    BaselineNudgeGenerator,
    generateFromConfig,
    generateTokens,
    generateHTML,
    generateSCSS,
    readFontMetrics
};
