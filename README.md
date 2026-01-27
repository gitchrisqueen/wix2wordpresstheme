# Wix to WordPress Theme Converter

A fully automated, repeatable pipeline to convert any Wix website into a pixel-perfect WordPress theme.

## 🎯 Overview

This project provides a complete solution for converting Wix websites into WordPress themes with high visual fidelity. The pipeline includes web crawling, asset extraction, theme generation, local WordPress environment, and comprehensive testing.

## 🏗️ Architecture

```
wix2wordpresstheme/
├── crawler/              # Playwright-based web crawler
├── theme-generator/      # WordPress theme generator
├── wordpress-local/      # Docker-based local WP environment
├── tests/               # Visual and DOM testing suite
│   ├── visual/         # Visual regression tests
│   └── dom/            # DOM structure tests
├── scripts/             # Automation and utility scripts
├── docs/                # Detailed documentation
└── logs/                # Application logs
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose v2+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/gitchrisqueen/wix2wordpresstheme.git
cd wix2wordpresstheme

# Install dependencies
npm install

# Setup local WordPress environment
npm run docker:up
```

### Basic Usage

```bash
# Crawl a Wix site
npm run crawl -- --url https://example.wixsite.com/site

# Generate WordPress theme
npm run generate-theme

# Run tests
npm run test
```

## 📚 Documentation

- [RUNBOOK.md](./RUNBOOK.md) - Operational procedures and troubleshooting
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture and design decisions
- [docs/](./docs/) - Detailed component documentation

## 🔧 Components

### Crawler (Playwright)
Automated web crawler that captures Wix site structure, styles, assets, and content.

### Theme Generator
Converts crawled data into a WordPress-compatible theme with proper structure and hooks.

### WordPress Local Environment (Docker)
Containerized WordPress setup for theme development and testing.

### Testing Suite
- **Visual Testing**: Pixel-perfect comparison between original and converted site
- **DOM Testing**: Structure and functionality validation

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Run linter
npm run lint

# Run tests
npm run test

# Build for production
npm run build
```

## 📊 Logging

All operations are logged to the `logs/` directory with timestamped files for debugging and monitoring.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

See [LICENSE](./LICENSE) for details.

## 🐛 Issues & Support

For bugs and feature requests, please use the [GitHub Issues](https://github.com/gitchrisqueen/wix2wordpresstheme/issues) page.
