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

**Phase 2: Page Snapshots & Asset Downloads** ✅ **Complete**

- Playwright-based page capture with retry logic
- Desktop and mobile screenshots
- Rendered HTML and structured DOM snapshots
- Metadata extraction (title, meta tags, OG, headings)
- Asset discovery from DOM, CSS, and network
- Concurrent page processing with configurable limits
- Per-page output with JSON validation

**Phase 3: PageSpec and Design Token Extraction** ✅ **Complete**

- PageSpec generation with section inference
- Design token extraction (colors, fonts, buttons)
- Layout pattern detection across pages
- Heuristic-based section classification
- Conservative inference with "unknown" fallbacks
- Schema validation and deterministic output

**Phase 4: Hybrid WordPress Theme Generation** ✅ **Complete**

- Three rendering modes: block, php, and hybrid
- Block templates with WordPress core blocks
- PHP section rendering with fallbacks
- Block patterns from layout patterns
- theme.json generation from design tokens
- Asset management and mapping
- Comprehensive reporting and metadata

**Coming Soon**:

- Phase 5: Testing and verification

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

| Option                 | Default          | Description                             |
| ---------------------- | ---------------- | --------------------------------------- |
| `--baseUrl`            | (required)       | Base URL of the website to discover     |
| `--outDir`             | `crawler/output` | Output directory for manifest.json      |
| `--respectRobots`      | `true`           | Respect robots.txt directives           |
| `--maxDepth`           | `2`              | Maximum crawl depth (0 = homepage only) |
| `--maxPages`           | `500`            | Maximum number of pages to crawl        |
| `--keepQuery`          | `false`          | Keep query strings in URLs              |
| `--includeUnreach`able | `false`          | Include unreachable URLs in manifest    |
| `--verbose`            | `false`          | Enable verbose debug logging            |

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

## 📸 Phase 2: Page Crawl & Snapshots

Capture comprehensive snapshots of discovered pages using Playwright.

### Quick Start

```bash
# Basic usage - crawl pages from manifest
npm run discover -- --baseUrl https://example.com
npm run crawl -- --baseUrl https://example.com --manifest crawler/output/manifest.json

# Custom output directory and concurrency
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json \
  --outDir ./crawl-output \
  --concurrency 5

# Mobile-first capture
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json \
  --breakpoints mobile

# Limit pages and skip asset downloads
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json \
  --maxPages 10 \
  --downloadAssets false
```

### Crawl Options

| Option             | Default          | Description                                    |
| ------------------ | ---------------- | ---------------------------------------------- |
| `--baseUrl`        | (required)       | Base URL of the website                        |
| `--manifest`       | (required)       | Path to manifest.json from discovery           |
| `--outDir`         | `crawler/output` | Output directory for crawl results             |
| `--maxPages`       | (all)            | Maximum number of pages to crawl               |
| `--concurrency`    | `3`              | Number of concurrent page captures             |
| `--timeoutMs`      | `45000`          | Page load timeout in milliseconds              |
| `--retries`        | `2`              | Number of retries per page on failure          |
| `--waitUntil`      | `networkidle`    | Wait strategy (networkidle, domcontentloaded)  |
| `--settleMs`       | `750`            | Additional wait time after page load           |
| `--breakpoints`    | `desktop,mobile` | Comma-separated viewport names                 |
| `--downloadAssets` | `true`           | Download page assets (images, fonts, CSS)      |
| `--respectRobots`  | `true`           | Respect robots.txt from discovery              |
| `--allowPartial`   | `false`          | Allow partial success (don't exit on failures) |
| `--verbose`        | `false`          | Enable verbose debug logging                   |

### Outputs

Crawl generates per-page artifacts organized by slug:

```
crawler/output/pages/<slug>/
├── page.json              # Page summary
├── html/
│   └── rendered.html      # Full rendered HTML
├── dom/
│   └── dom.json          # Structured DOM snapshot
├── meta/
│   └── meta.json         # Metadata (title, OG, headings)
├── screenshots/
│   ├── desktop.png       # Desktop viewport screenshot
│   └── mobile.png        # Mobile viewport screenshot
└── assets/
    ├── manifest.json     # Asset list with hashes
    └── files/            # Downloaded assets
```

Plus summary files:

1. **crawl-summary.json** - Overall crawl statistics
   - Location: `crawler/output/crawl-summary.json`
2. **crawl-errors.json** - Failed pages (if any)
   - Location: `crawler/output/crawl-errors.json`
3. **run.json** - Machine-readable run report
   - Location: `docs/REPORTS/<timestamp>/run.json`
4. **summary.md** - Human-readable summary
   - Location: `docs/REPORTS/<timestamp>/summary.md`

### Examples

**Example 1: Full pipeline**

```bash
# Step 1: Discover pages
npm run discover -- --baseUrl https://example.wixsite.com/mysite

# Step 2: Crawl discovered pages
npm run crawl -- \
  --baseUrl https://example.wixsite.com/mysite \
  --manifest crawler/output/manifest.json
```

**Example 2: High-speed shallow crawl**

```bash
npm run discover -- --baseUrl https://example.com --maxDepth 1
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json \
  --concurrency 10 \
  --downloadAssets false \
  --breakpoints desktop
```

**Example 3: Detailed crawl with retries**

```bash
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json \
  --retries 5 \
  --timeoutMs 60000 \
  --settleMs 2000 \
  --verbose
```

## 🎨 Phase 3: PageSpec & Design Token Extraction

Generate structured specifications and design tokens from crawled pages.

### Quick Start

```bash
# Basic usage - generate specs from crawl output
npm run discover -- --baseUrl https://example.com
npm run crawl -- --baseUrl https://example.com --manifest crawler/output/manifest.json
npm run spec -- --baseUrl https://example.com

# Specify custom input/output directories
npm run spec -- \
  --baseUrl https://example.com \
  --inDir ./crawler/output \
  --outDir ./crawler/output

# Limit number of pages to process
npm run spec -- \
  --baseUrl https://example.com \
  --maxPages 10

# Enable verbose logging
npm run spec -- \
  --baseUrl https://example.com \
  --verbose
```

### Spec Options

| Option       | Default          | Description                                 |
| ------------ | ---------------- | ------------------------------------------- |
| `--baseUrl`  | (required)       | Base URL of the website                     |
| `--inDir`    | `crawler/output` | Input directory with crawl output           |
| `--outDir`   | `crawler/output` | Output directory for spec files             |
| `--strategy` | `heuristic`      | Inference strategy (only heuristic for now) |
| `--maxPages` | (all)            | Maximum number of pages to process          |
| `--verbose`  | `false`          | Enable verbose debug logging                |

### Outputs

Spec generation creates the following outputs:

```
crawler/output/
├── spec/
│   ├── design-tokens.json      # Global design tokens
│   ├── layout-patterns.json    # Reusable layout patterns
│   └── spec-summary.json       # Generation summary
└── pages/<slug>/
    └── spec/
        └── pagespec.json       # Per-page specification
```

**Per-page PageSpec (`pagespec.json`):**

- Ordered sections with type inference (hero, footer, CTA, etc.)
- Section content: headings, text blocks, CTAs, media
- Forms and form fields
- Internal and external links
- Template hints (home, landing, content, etc.)

**Global Design Tokens (`design-tokens.json`):**

- Color palette (primary, secondary, palette)
- Typography (font families, base size, headings)
- Component styles (buttons: primary/secondary)
- Extraction metadata (pages analyzed, methods used)

**Layout Patterns (`layout-patterns.json`):**

- Detected repeating section patterns
- Pattern signatures and examples
- Statistics (count, heading/text/media/CTA counts)

**Summary Report (`spec-summary.json`):**

- Pages processed and success/failure counts
- Total sections and patterns detected
- Per-page status and warnings

Plus timestamped reports:

1. **run.json** - Machine-readable run report
   - Location: `docs/REPORTS/<timestamp>/run.json`
2. **summary.md** - Human-readable summary
   - Location: `docs/REPORTS/<timestamp>/summary.md`

### Examples

**Example 1: Full pipeline**

```bash
# Step 1: Discover pages
npm run discover -- --baseUrl https://example.wixsite.com/mysite

# Step 2: Crawl pages
npm run crawl -- \
  --baseUrl https://example.wixsite.com/mysite \
  --manifest crawler/output/manifest.json

# Step 3: Generate specs
npm run spec -- --baseUrl https://example.wixsite.com/mysite
```

**Example 2: Limited processing**

```bash
npm run spec -- \
  --baseUrl https://example.com \
  --maxPages 5 \
  --verbose
```

**Example 3: Custom directories**

```bash
npm run spec -- \
  --baseUrl https://example.com \
  --inDir ./custom-crawl \
  --outDir ./custom-specs
```

## 🎨 Phase 4: WordPress Theme Generation

Generate a hybrid WordPress theme from PageSpec and design tokens.

### Quick Start

```bash
# Basic usage - generate theme from spec output
npm run discover -- --baseUrl https://example.com
npm run crawl -- --baseUrl https://example.com --manifest crawler/output/manifest.json
npm run spec -- --baseUrl https://example.com
npm run generate -- --baseUrl https://example.com

# Specify custom directories and theme name
npm run generate -- \
  --baseUrl https://example.com \
  --inDir ./crawler/output \
  --outDir ./theme/output \
  --themeName my-custom-theme

# Choose generation mode
npm run generate -- \
  --baseUrl https://example.com \
  --mode hybrid    # or 'block' or 'php'

# Control pattern and theme.json generation
npm run generate -- \
  --baseUrl https://example.com \
  --emitPatterns true \
  --emitThemeJson true

# Enable verbose logging
npm run generate -- \
  --baseUrl https://example.com \
  --verbose
```

### Generation Options

| Option             | Default          | Description                                      |
| ------------------ | ---------------- | ------------------------------------------------ |
| `--baseUrl`        | (required)       | Base URL of the website                          |
| `--inDir`          | `crawler/output` | Input directory with spec output                 |
| `--outDir`         | `theme/output`   | Output directory for generated theme             |
| `--themeName`      | `wix2wp`         | Theme name (slug format)                         |
| `--mode`           | `hybrid`         | Generation mode: block, php, or hybrid           |
| `--emitPatterns`   | `true`           | Generate WordPress block patterns                |
| `--emitThemeJson`  | `true`           | Generate theme.json from design tokens           |
| `--verbose`        | `false`          | Enable verbose debug logging                     |

### Generation Modes

**block (Block-first, editor-friendly)**
- Uses WordPress core blocks for all content
- Fully editable in the Block Editor
- Best for simple, content-focused sites

**php (Classic PHP rendering)**
- Uses PHP templates for all sections
- Pixel-perfect reproduction
- Best for complex layouts requiring precise control

**hybrid (Best of both worlds - RECOMMENDED)**
- Uses blocks for simple content
- PHP fallbacks for complex sections
- Balances editability and fidelity
- Allows per-section mode selection

### Outputs

Theme generation creates the following outputs:

```
theme/output/<themeName>/
├── style.css                    # Theme header and base styles
├── functions.php                # Theme setup and hooks
├── theme.json                   # Block editor theme configuration
├── index.php                    # Required WordPress template
├── block-templates/             # Block templates for pages
│   ├── page-home.html
│   ├── page-about.html
│   └── ...
├── patterns/                    # Reusable block patterns
│   ├── pat_hero_001.php
│   └── ...
├── parts/
│   └── sections/                # PHP section partials
│       ├── header.php
│       ├── hero.php
│       ├── footer.php
│       └── ...
├── inc/
│   └── render.php               # Rendering helpers
├── assets/
│   ├── imported/                # Copied assets
│   └── css/
└── .generated/
    ├── generation.json          # Generation metadata
    ├── asset-map.json           # Asset URL mapping
    └── page-mapping.json        # Page to template mapping
```

Plus summary files:

1. **generate-summary.json** - Overall generation statistics
   - Location: `theme/output/generate-summary.json`
2. **run.json** - Machine-readable run report
   - Location: `docs/REPORTS/<timestamp>/run.json`
3. **summary.md** - Human-readable summary
   - Location: `docs/REPORTS/<timestamp>/summary.md`

### Understanding the Generated Theme

**Block Templates**

Block templates are HTML files in `block-templates/` that use WordPress block markup:

```html
<!-- wp:group -->
<div class="wp-block-group">
  <!-- wp:heading -->
  <h1>Welcome</h1>
  <!-- /wp:heading -->
  
  <!-- wp:paragraph -->
  <p>This is editable content.</p>
  <!-- /wp:paragraph -->
</div>
<!-- /wp:group -->
```

In hybrid mode, complex sections use PHP fallbacks:

```html
<!-- wp:html -->
<?php render_section("sec_003", $data); ?>
<!-- /wp:html -->
```

**theme.json**

The theme.json file maps design tokens to WordPress theme settings:

- Colors: Primary, secondary, and palette colors
- Typography: Font families and sizes
- Spacing: Units and presets
- Styles: Global and element-specific styles

**PHP Section Partials**

PHP templates in `parts/sections/` render specific section types:

- `header.php` - Site header
- `hero.php` - Hero sections
- `cta.php` - Call-to-action sections
- `footer.php` - Site footer
- etc.

Each partial receives section data and uses WordPress escaping functions.

**Block Patterns**

Patterns in `patterns/` directory provide reusable layouts:

- Auto-generated from layout-patterns.json
- Categorized (hero, content, layout, cta)
- Appear in Block Editor pattern inserter
- Fully customizable by users

### Examples

**Example 1: Full pipeline**

```bash
# Step 1: Discover pages
npm run discover -- --baseUrl https://example.wixsite.com/mysite

# Step 2: Crawl pages
npm run crawl -- \
  --baseUrl https://example.wixsite.com/mysite \
  --manifest crawler/output/manifest.json

# Step 3: Generate specs
npm run spec -- --baseUrl https://example.wixsite.com/mysite

# Step 4: Generate theme
npm run generate -- --baseUrl https://example.wixsite.com/mysite
```

**Example 2: Block-only theme**

```bash
npm run generate -- \
  --baseUrl https://example.com \
  --mode block \
  --themeName my-block-theme
```

**Example 3: PHP fallback theme**

```bash
npm run generate -- \
  --baseUrl https://example.com \
  --mode php \
  --themeName pixel-perfect-theme
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
