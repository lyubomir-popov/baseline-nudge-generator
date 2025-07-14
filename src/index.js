const { BaselineNudgeGenerator } = require('./nudge-generator');

module.exports = {
  BaselineNudgeGenerator,
  createNudgeGenerator: (options) => new BaselineNudgeGenerator(options),
  
  // New methods for the updated functionality
  generateFromConfig: async (configPath, outputDir) => {
    const generator = new BaselineNudgeGenerator();
    return await generator.generateFiles(configPath, outputDir);
  },
  
  generateTokens: (config, fontMetrics) => {
    const generator = new BaselineNudgeGenerator(fontMetrics);
    return generator.generateTokens(config);
  },
  
  generateHTML: (tokens) => {
    const generator = new BaselineNudgeGenerator();
    return generator.generateHTML(tokens);
  }
}; 