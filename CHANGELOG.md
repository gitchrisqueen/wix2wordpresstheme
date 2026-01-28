# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **Critical bug in asset discovery**: Fixed srcset parsing to correctly handle Cloudinary image URLs with embedded commas in transformation parameters. Previous implementation split URLs incorrectly, resulting in 0 assets being downloaded. Now correctly extracts URLs by finding the last space (separator from descriptor), enabling proper asset discovery for Wix sites using Cloudinary.
  - Fixed `parseSrcset()` function in `crawler/src/crawl/assetsDiscover.ts`
  - Fixed inline srcset parsing in `discoverFromDOM()` for img and source elements
  - Added test cases for Cloudinary URLs with commas in path

### Added

- Initial project structure and scaffolding
- Complete folder organization (crawler, theme-generator, wordpress-local, tests, scripts, docs, logs)
- Comprehensive documentation (README, RUNBOOK, ARCHITECTURE, CONTRIBUTING)
- Docker-based WordPress local environment configuration
- Configuration files for all modules
- Logging infrastructure setup
- Package.json with npm scripts
- .gitignore for proper file exclusions
- .env.example for environment configuration

### Changed

- N/A

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

## [0.1.0] - 2024-01-27

### Added

- Initial repository scaffolding
- Project structure with clear separation of concerns
- Documentation framework
- Development environment setup

---

## Release Notes Format

### Added

New features and capabilities

### Changed

Changes to existing functionality

### Deprecated

Features that will be removed in future releases

### Removed

Features that have been removed

### Fixed

Bug fixes and corrections

### Security

Security improvements and vulnerability fixes
