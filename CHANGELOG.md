# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.1] - 2025-01-24

### Added

- **📚 Enhanced CLI documentation**: Comprehensive `--help` and `--info` commands with detailed explanations
- **📖 Complete functionality guide**: All commands, options, and advanced features documented
- **🔍 Technical details**: API usage examples, common use cases, and compatibility information
- **📋 Configuration examples**: Both new and legacy format examples with explanations
- **🎯 Usage patterns**: Clear categorization of setup, generation, and utility commands

## [1.4.0] - 2025-01-XX

### Added

- **🎨 Multi-font support**: Use multiple font families (sans, serif) with different nudge calculations per element
- **⚖️ Per-element font styling**: Specify `fontFamily`, `fontWeight`, and `fontStyle` for each element
- **🔧 Enhanced token generation**: Tokens now include all font properties (fontStyle, fontWeight, fontFamily)
- **📏 Improved HTML generation**: CSS now properly applies font family, weight, and style
- **🔤 Enhanced font name extraction**: More robust font name detection from various font formats
- **📝 Better configuration format**: New multi-font configuration format with fontFiles array
- **🎨 Complete typescale support**: Full h1-h6 and paragraph element configuration with font styling
- **📐 Fractional baseline support**: Support for fractional line heights and spacing values in multiples of 0.25 (e.g., 1.25, 1.5, 1.75, 2.25, 2.5, 2.75, 3.0) for quadrupled baseline grid resolution

### Changed

- **Token structure**: Tokens now include fontStyle, fontWeight, and fontFamily properties for each element
- **HTML generation**: CSS rules now include proper font-family, font-weight, and font-style declarations
- **Configuration format**: Added support for new multi-font format while maintaining backward compatibility
- **Font metrics handling**: Improved font metrics mapping for multiple font families
- **Error handling**: Better error messages for font family resolution
- **Validation**: LineHeight and spaceAfter now support fractional values that are multiples of 0.25 for finer typographic control

### Fixed

- **Font property inheritance**: Fixed font properties not being properly passed through to tokens
- **CSS generation**: Fixed font properties not being included in generated CSS
- **Multi-font validation**: Improved validation for multi-font configurations
- **Output directory handling**: Fixed generator creating files in both specified output directory and dist/ directory
- **File overwriting**: Fixed issue where multiple config runs would overwrite each other's output files

## [1.3.1] - 2024-XX-XX

### Previous releases

- See git history for changes prior to structured changelog

## [1.1.0] - 2025-07-15

### Added

- **One-command setup**: Added `baseline-nudges setup` command that downloads Fira Sans and creates config automatically
- **Reliable font source**: Uses Fira Sans from Google Fonts GitHub mirror for consistent downloads
- **Automatic font name extraction**: Extracts font name from TTF/WOFF files automatically for HTML generation
- **Dist folder output**: Generated files now go to `dist/` folder with proper structure
- **Font copying**: Fonts are copied to `dist/fonts/` so HTML demos work out-of-the-box
- **Configuration validation**: Added comprehensive validation for configuration files with helpful error messages
- **Error handling**: Implemented custom error classes and better error formatting for CLI
- **Testing framework**: Added simple test runner with basic tests for validation and API
- **API exports**: Created proper `src/index.js` with clean API for programmatic use
- **CLI improvements**: Added `validate` command to check configuration files
- **Code quality**: Added ESLint configuration for consistent code style
- **Documentation**: Updated README with comprehensive setup and configuration instructions

### Changed

- **Package structure**: Config files are now user-generated and excluded from npm package
- **Format support**: Removed WOFF2 support for better reliability, focus on TTF/WOFF/OTF
- **Output location**: Changed from config directory to `dist/` directory for generated files
- **Font handling**: No fonts are shipped with package, all downloaded during setup
- **Error messages**: More user-friendly error messages with context and suggestions
- **Code structure**: Better separation of concerns between CLI, validation, and core logic
- **Package scripts**: Simplified scripts, removed dev dependencies
- **Validation**: LineHeight validation now ensures positive numbers that are multiples of 0.25 (baseline unit multiples)

### Fixed

- **Missing index.js**: Fixed npm package main entry point
- **Async consistency**: Improved async/await usage throughout the codebase
- **CLI error handling**: Better error handling in CLI commands
- **Font paths**: Fixed relative font paths in generated HTML
- **Package size**: Reduced package size by excluding generated files and fonts

### Removed

- **WOFF2 support**: Removed due to compatibility issues with current fontkit version
- **Generated files**: No longer ship fonts, config files, or generated output with npm package
- **Dev dependencies**: Removed unnecessary development scripts and dependencies
- **Test artifacts**: Cleaned up temporary test files and outdated scripts
