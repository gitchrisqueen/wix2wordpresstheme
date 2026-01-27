# Wix to WordPress Theme Converter

A fully automated, repeatable pipeline to convert any Wix website into a pixel-perfect WordPress theme.

## 🎯 Overview

This project provides a complete solution for converting Wix websites into WordPress themes with high visual fidelity. The pipeline includes web crawling, asset extraction, theme generation, local WordPress environment, and comprehensive testing.

## 🚀 Current Status

**Phase 1: URL Discovery** ✅ **Complete**

- Sitemap-first discovery with crawl fallback
- robots.txt compliance
- URL normalization and deduplication
- CLI with comprehensive options
- Structured reporting and logging

**Coming Soon**:

- Phase 2: Page snapshots and asset downloads
- Phase 3: Theme generation
- Phase 4: Testing and verification

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose v2+ (for WordPress environment)
- Git

## 🏗️ Installation

```bash
# Clone the repository
git clone https://github.com/gitchrisqueen/wix2wordpresstheme.git
cd wix2wordpresstheme

# Install dependencies
npm install

# Verify installation
npm run typecheck
npm run test
```

## 🔍 Phase 1: URL Discovery

Discover and catalog all pages from a website.

### Quick Start

```bash
# Basic usage - discover all pages from a website
npm run discover -- --baseUrl https://example.com

# Specify output directory
npm run discover -- --baseUrl https://example.wixsite.com/mysite --outDir ./output

# Ignore robots.txt (use only if you own the site)
npm run discover -- --baseUrl https://example.com --respectRobots false

# Increase crawl depth and page limit
npm run discover -- --baseUrl https://example.com --maxDepth 3 --maxPages 1000

# Keep query strings in URLs
npm run discover -- --baseUrl https://example.com --keepQuery

# Verbose logging for debugging
npm run discover -- --baseUrl https://example.com --verbose
```

### Discovery Options

| Option              | Default            | Description                                    |
| ------------------- | ------------------ | ---------------------------------------------- |
| `--baseUrl`         | (required)         | Base URL of the website to discover            |
| `--outDir`          | `crawler/output`   | Output directory for manifest.json             |
| `--respectRobots`   | `true`             | Respect robots.txt directives                  |
| `--maxDepth`        | `2`                | Maximum crawl depth (0 = homepage only)        |
| `--maxPages`        | `500`              | Maximum number of pages to crawl               |
| `--keepQuery`       | `false`            | Keep query strings in URLs                     |
| `--includeUnreach`able | `false`         | Include unreachable URLs in manifest           |
| `--verbose`         | `false`            | Enable verbose debug logging                   |

### Outputs

Discovery generates the following outputs:

1. **manifest.json** - List of discovered pages with metadata
   - Location: `crawler/output/manifest.json` (or custom `--outDir`)
   - Schema: `crawler/schemas/manifest.schema.json`
2. **run.json** - Machine-readable run report
   - Location: `docs/REPORTS/<timestamp>/run.json`
3. **summary.md** - Human-readable summary
   - Location: `docs/REPORTS/<timestamp>/summary.md`
4. **logs.json** - Complete log entries
   - Location: `docs/REPORTS/<timestamp>/logs.json`

See [docs/report-format.md](./docs/report-format.md) for detailed format documentation.

### Discovery Behavior

The discovery process follows these steps:

1. **Normalize base URL** - Handle redirects, www, and trailing slashes
2. **Try sitemaps first** - Attempts multiple sitemap locations:
   - `/sitemap.xml`
   - `/sitemap_index.xml`
   - `/site-map.xml`
   - `/_api/sitemap.xml` (Wix-specific)
3. **Fallback crawl** - If no sitemap found or empty:
   - Breadth-first search (BFS) starting from homepage
   - Respects `--maxDepth` and `--maxPages` limits
   - Filters out images, PDFs, and other non-page resources
4. **Validate URLs** - Checks HTTP status with HEAD request
5. **Generate outputs** - Creates manifest and reports

### Examples

**Example 1: Basic discovery**

```bash
npm run discover -- --baseUrl https://example.wixsite.com/mysite
```

Output:

```
=== Wix2WordPress Discovery ===
Base URL: https://example.wixsite.com/mysite
...
✅ Manifest written to: crawler/output/manifest.json
📊 Reports written to: docs/REPORTS/2026-01-27T15-20-10-000Z
📦 Pages discovered: 42
```

**Example 2: Deep crawl with query strings**

```bash
npm run discover -- --baseUrl https://example.com --maxDepth 4 --maxPages 2000 --keepQuery
```

**Example 3: Ignore robots.txt (own site only)**

```bash
npm run discover -- --baseUrl https://mysite.com --respectRobots false
```

## 🧪 Development

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format
```

## 📚 Documentation

- [RUNBOOK.md](./RUNBOOK.md) - Operational procedures and troubleshooting
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture and design
- [docs/DECISIONS.md](./docs/DECISIONS.md) - Technical decisions and rationale
- [docs/report-format.md](./docs/report-format.md) - Report format documentation
- [docs/](./docs/) - Additional documentation

## 🏛️ Architecture

```
wix2wordpresstheme/
├── crawler/              # URL discovery and crawling (Phase 1 ✅)
│   ├── src/
│   │   ├── cli/         # CLI commands
│   │   ├── discovery/   # Sitemap and crawl logic
│   │   ├── lib/         # Core utilities
│   │   └── types/       # Type definitions
│   ├── schemas/         # JSON schemas
│   └── output/          # Generated manifests
├── theme-generator/      # WordPress theme generator (Coming soon)
├── wordpress-local/      # Docker-based local WP environment
├── tests/               # Test suite
├── scripts/             # Automation scripts
└── docs/                # Documentation
    └── REPORTS/         # Discovery run reports
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

See [LICENSE](./LICENSE) for details.

## 🐛 Issues & Support

For bugs and feature requests, please use the [GitHub Issues](https://github.com/gitchrisqueen/wix2wordpresstheme/issues) page.
