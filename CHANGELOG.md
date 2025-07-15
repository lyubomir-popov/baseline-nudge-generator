# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Validation**: LineHeight validation now ensures positive integers (baseline unit multiples)

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

## [1.0.9] - 2024-XX-XX

### Previous releases

- See git history for changes prior to structured changelog
