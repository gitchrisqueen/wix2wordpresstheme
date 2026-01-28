# RUNBOOK - Wix to WordPress Theme Converter

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Phase 1: Discovery](#phase-1-discovery)
5. [Running the Pipeline](#running-the-pipeline)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring & Logging](#monitoring--logging)
8. [Maintenance](#maintenance)
9. [Emergency Procedures](#emergency-procedures)

## System Overview

The Wix to WordPress Theme Converter is a pipeline system consisting of multiple stages:

1. **Discovery** (Phase 1) ✅ - Extract URL list from Wix site
2. **Crawling** (Phase 2) ✅ - Extract data, assets, and snapshots
3. **Spec Generation** (Phase 3) - Extract design tokens and page specs
4. **Theme Generation** (Phase 4) - Convert to WordPress theme
5. **Deployment** (Phase 5) - Install in local WordPress
6. **Testing** (Phase 6) - Validate conversion quality

**Current Status**: Phases 1-2 (Discovery and Crawling) are complete and operational.

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Docker**: v20.0.0 or higher (for WordPress environment)
- **Docker Compose**: v2.0.0 or higher (for WordPress environment)

### System Requirements

- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: Minimum 10GB free
- **Network**: Stable internet connection for crawling

### Verify Installation

```bash
node --version
npm --version
docker --version
docker-compose --version
```

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/gitchrisqueen/wix2wordpresstheme.git
cd wix2wordpresstheme
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Setup

```bash
# Run tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Phase 1: Discovery

### Overview

The discovery phase identifies all pages on a Wix website by:

1. Attempting to parse sitemap(s)
2. Falling back to lightweight crawling if no sitemap found
3. Normalizing and deduplicating URLs
4. Validating URL accessibility
5. Generating a manifest.json with all discovered pages

### Running Discovery

#### Basic Usage

```bash
npm run discover -- --baseUrl https://example.wixsite.com/mysite
```

#### Common Options

```bash
# Specify custom output directory
npm run discover -- --baseUrl https://example.com --outDir ./my-output

# Increase crawl depth and page limit
npm run discover -- --baseUrl https://example.com --maxDepth 3 --maxPages 1000

# Ignore robots.txt (only if you own the site)
npm run discover -- --baseUrl https://example.com --respectRobots false

# Keep query strings (for query-based routing sites)
npm run discover -- --baseUrl https://example.com --keepQuery

# Enable verbose logging
npm run discover -- --baseUrl https://example.com --verbose
```

#### Full Options Reference

| Option                 | Default          | Description                          |
| ---------------------- | ---------------- | ------------------------------------ |
| `--baseUrl <url>`      | (required)       | Base URL of the website              |
| `--outDir <path>`      | `crawler/output` | Output directory for manifest        |
| `--respectRobots`      | `true`           | Respect robots.txt directives        |
| `--maxDepth <number>`  | `2`              | Maximum crawl depth                  |
| `--maxPages <number>`  | `500`            | Maximum pages to crawl               |
| `--keepQuery`          | `false`          | Keep query strings in URLs           |
| `--includeUnreachable` | `false`          | Include unreachable URLs in manifest |
| `--verbose`            | `false`          | Enable verbose debug logging         |

### Expected Output

A successful discovery run produces:

1. **manifest.json** in the specified output directory

   ```
   crawler/output/manifest.json
   ```

2. **Reports** in timestamped directory
   ```
   docs/REPORTS/2026-01-27T15-20-10-000Z/
   ├── run.json      # Machine-readable report
   ├── summary.md    # Human-readable summary
   └── logs.json     # Complete logs
   ```

### Understanding the Manifest

The manifest.json contains:

```json
{
  "version": "1.0.0",
  "baseUrl": "https://example.com",
  "generatedAt": "2026-01-27T15:20:10.000Z",
  "discovery": {
    "method": "sitemap|crawl|hybrid",
    "respectRobots": true,
    "sitemapsTried": ["https://example.com/sitemap.xml"],
    "crawl": { "maxDepth": 2, "maxPages": 500 }
  },
  "pages": [
    {
      "url": "https://example.com/about",
      "path": "/about",
      "canonical": "https://example.com/about",
      "title": null,
      "status": 200,
      "depth": 1,
      "source": "sitemap|crawl",
      "lastmod": null
    }
  ],
  "stats": {
    "pagesFound": 42,
    "pagesIncluded": 40,
    "excludedExternal": 10,
    "excludedDuplicates": 5,
    "excludedByRules": 7
  }
}
```

### Discovery Methods

- **sitemap**: All pages discovered from sitemap(s)
- **crawl**: All pages discovered by crawling (no sitemap found)
- **hybrid**: Pages from both sitemap and supplemental crawl

### Troubleshooting Discovery

#### No Pages Found

**Symptoms**: manifest.json has zero pages

**Solutions**:

1. Verify the base URL is accessible:
   ```bash
   curl -I https://example.com
   ```
2. Check if robots.txt is blocking discovery:
   ```bash
   curl https://example.com/robots.txt
   ```
3. Try with robots disabled (if you own the site):
   ```bash
   npm run discover -- --baseUrl https://example.com --respectRobots false
   ```
4. Increase crawl depth:
   ```bash
   npm run discover -- --baseUrl https://example.com --maxDepth 3
   ```

#### Too Many Pages

**Symptoms**: Discovery finds too many irrelevant pages

**Solutions**:

1. Reduce max pages:
   ```bash
   npm run discover -- --baseUrl https://example.com --maxPages 100
   ```
2. Reduce crawl depth:
   ```bash
   npm run discover -- --baseUrl https://example.com --maxDepth 1
   ```
3. Check if query strings are causing duplicates - remove `--keepQuery` if set

#### Discovery Takes Too Long

**Symptoms**: Command runs for many minutes

**Solutions**:

1. Reduce maxPages limit
2. Reduce maxDepth
3. Check for crawl loops in verbose mode:
   ```bash
   npm run discover -- --baseUrl https://example.com --verbose
   ```

#### robots.txt Blocking Too Many Pages

**Symptoms**: Many "Blocked by robots.txt" warnings in logs

**Solutions**:

1. If you own the site, use `--respectRobots false`
2. Review robots.txt to understand what's blocked
3. Contact site owner to adjust robots.txt if necessary

#### Connection Errors

**Symptoms**: "Failed to fetch" errors in logs

**Solutions**:

1. Check internet connection
2. Verify site is accessible in browser
3. Check for rate limiting (wait and retry)
4. Check if site blocks automated requests (User-Agent)

## Phase 2: Crawling

### Running the Crawl

After discovery, crawl the pages to capture snapshots and assets:

```bash
# Basic crawl
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json

# With custom options
npm run crawl -- \
  --baseUrl https://example.com \
  --manifest crawler/output/manifest.json \
  --outDir crawler/output \
  --concurrency 5 \
  --maxPages 50 \
  --downloadAssets true \
  --breakpoints desktop,mobile \
  --verbose
```

### Configuration

**Performance Tuning**:

- `--concurrency`: Higher = faster but more resource intensive (default: 3)
- `--timeoutMs`: Increase for slow sites (default: 45000)
- `--settleMs`: Increase for dynamic content (default: 750)
- `--downloadAssets false`: Skip asset downloads for speed

**Reliability**:

- `--retries`: Number of retry attempts per page (default: 2)
- `--waitUntil networkidle`: Wait for network to settle (strictest)
- `--waitUntil domcontentloaded`: Faster, less strict (fallback on retry)
- `--allowPartial true`: Don't fail entire crawl if some pages fail

**Viewport Configuration**:

- `desktop`: 1920x1080 viewport
- `mobile`: 375x667 viewport
- `tablet`: 768x1024 viewport

### Output Structure

```
crawler/output/
├── manifest.json                 # From Phase 1
├── crawl-summary.json           # Crawl statistics
├── crawl-errors.json            # Failed pages (if any)
└── pages/
    ├── home/
    │   ├── page.json            # Page summary
    │   ├── html/rendered.html   # Full HTML
    │   ├── dom/dom.json         # Structured DOM
    │   ├── meta/meta.json       # Metadata
    │   ├── screenshots/
    │   │   ├── desktop.png
    │   │   └── mobile.png
    │   └── assets/
    │       ├── manifest.json
    │       └── files/
    └── about/
        └── ...
```

### Troubleshooting Crawl

#### Page Timeouts

**Symptoms**: Pages fail with timeout errors

**Solutions**:

1. Increase timeout:
   ```bash
   npm run crawl -- ... --timeoutMs 90000
   ```
2. Increase settle time for dynamic content:
   ```bash
   npm run crawl -- ... --settleMs 2000
   ```
3. Use faster wait strategy:
   ```bash
   npm run crawl -- ... --waitUntil domcontentloaded
   ```

#### Screenshots Are Blank

**Symptoms**: Screenshots captured but show blank/loading state

**Solutions**:

1. Increase settle time:
   ```bash
   npm run crawl -- ... --settleMs 2000
   ```
2. Check if site requires JavaScript - may need authentication or cookies
3. Try desktop-only first to verify:
   ```bash
   npm run crawl -- ... --breakpoints desktop
   ```

#### High Memory Usage

**Symptoms**: System becomes slow, OOM errors

**Solutions**:

1. Reduce concurrency:
   ```bash
   npm run crawl -- ... --concurrency 1
   ```
2. Limit pages per run:
   ```bash
   npm run crawl -- ... --maxPages 10
   ```
3. Disable asset downloads temporarily:
   ```bash
   npm run crawl -- ... --downloadAssets false
   ```

#### Asset Download Failures

**Symptoms**: Many assets show "failed" status in assets/manifest.json

**Solutions**:

1. Check asset URLs are accessible manually
2. Verify CORS/authentication isn't blocking access
3. Continue without assets if not critical:
   ```bash
   npm run crawl -- ... --downloadAssets false
   ```

#### Incomplete DOM Snapshots

**Symptoms**: dom.json missing expected elements

**Solutions**:

1. Increase settle time for client-side rendering:
   ```bash
   npm run crawl -- ... --settleMs 3000
   ```
2. Check console errors with verbose mode:
   ```bash
   npm run crawl -- ... --verbose
   ```
3. Verify JavaScript isn't failing - check error.txt in page folder

#### Rate Limiting

**Symptoms**: Multiple pages fail after initial successes

**Solutions**:

1. Reduce concurrency:
   ```bash
   npm run crawl -- ... --concurrency 1
   ```
2. Add delay between pages (not implemented - manual batching):
   ```bash
   # Crawl in batches
   npm run crawl -- ... --maxPages 10
   # Wait, then continue with next batch
   ```
3. Check site's robots.txt for crawl-delay directive

### Viewing Reports

```bash
# Find latest report directory
ls -lt docs/REPORTS/ | head -2

# View summary
cat docs/REPORTS/<timestamp>/summary.md

# Parse run stats with jq
cat docs/REPORTS/<timestamp>/run.json | jq '.stats'

# View warnings
cat docs/REPORTS/<timestamp>/run.json | jq '.warnings[]'

# View errors
cat docs/REPORTS/<timestamp>/run.json | jq '.errors[]'
```

## Running the Pipeline

### Full Pipeline (Future)

```bash
# Not yet implemented
npm run pipeline -- --url https://example.wixsite.com/site
```

### Step-by-Step Execution (Future Phases)

#### Step 1: Crawl Wix Site

```bash
npm run crawl -- --url https://example.wixsite.com/site --output ./crawler/output
```

**Expected Output:**

- JSON files with page structure
- Downloaded assets (images, CSS, JS)
- Screenshots of each page

#### Step 2: Generate WordPress Theme

```bash
npm run generate-theme -- --input ./crawler/output --output ./theme-generator/output
```

**Expected Output:**

- WordPress theme directory structure
- style.css with theme metadata
- Template files (header.php, footer.php, etc.)
- Assets directory with optimized resources

#### Step 3: Deploy to Local WordPress

```bash
npm run deploy-theme -- --theme ./theme-generator/output
```

**Expected Output:**

- Theme copied to WordPress themes directory
- Theme activated
- WordPress restarted

#### Step 4: Run Tests

```bash
npm run test -- --theme-name converted-wix-theme
```

**Expected Output:**

- Visual comparison results
- DOM structure validation
- Test report in HTML format

## Phase 3: Spec Generation

Generate PageSpec, design tokens, and layout patterns from crawl output.

### Prerequisites

- Completed Phase 2 crawl with outputs in `crawler/output`
- Manifest file and per-page data available

### Basic Command

```bash
npm run spec -- --baseUrl https://example.com
```

### With Options

```bash
npm run spec -- \
  --baseUrl https://example.com \
  --inDir crawler/output \
  --outDir crawler/output \
  --maxPages 10 \
  --verbose
```

### Output Structure

```
crawler/output/
├── spec/
│   ├── design-tokens.json      # Global design tokens
│   ├── layout-patterns.json    # Reusable section patterns
│   └── spec-summary.json       # Generation summary
└── pages/<slug>/
    └── spec/
        └── pagespec.json       # Per-page specification
```

### Troubleshooting Spec Generation

#### No Sections Extracted

Check HTML files exist and contain semantic structure.

#### Missing Design Tokens

Tokens are extracted from inline styles and CSS variables - verify HTML has style information.

#### Schema Validation Errors

Ensure all Phase 2 files are valid JSON.

## Phase 4: Theme Generation

Generate a WordPress theme from PageSpec and design tokens using hybrid block + PHP rendering.

### Prerequisites

- Completed Phase 3 with PageSpec files in `crawler/output/pages/<slug>/spec/`
- Design tokens in `crawler/output/spec/design-tokens.json`
- Layout patterns in `crawler/output/spec/layout-patterns.json`

### Basic Command

```bash
npm run generate -- --baseUrl https://example.com
```

### With Options

```bash
npm run generate -- \
  --baseUrl https://example.com \
  --inDir crawler/output \
  --outDir theme-generator/output \
  --themeName "My Wix Theme" \
  --themeSlug my-wix-theme \
  --mode hybrid \
  --verbose
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `--baseUrl <url>` | (required) | Original Wix site URL |
| `--inDir <path>` | `crawler/output` | Input directory with specs |
| `--outDir <path>` | `theme-generator/output` | Output directory for theme |
| `--themeName <name>` | Auto-generated | Human-readable theme name |
| `--themeSlug <slug>` | Auto-generated | Theme directory name |
| `--mode <mode>` | `hybrid` | Rendering mode: `block`, `php`, or `hybrid` |
| `--includeAssets` | `true` | Copy downloaded assets to theme |
| `--verbose` | `false` | Enable verbose debug logging |

### Rendering Modes

#### Hybrid Mode (Recommended)

Combines WordPress blocks with PHP sections for optimal flexibility:

```bash
npm run generate -- --baseUrl https://example.com --mode hybrid
```

- **Blocks**: hero, CTA, featureGrid, pricing, FAQ, testimonial
- **PHP sections**: header, footer, contactForm
- **Fallback**: richText and unknown types rendered as HTML blocks

#### Block Mode

Pure WordPress blocks (requires Gutenberg):

```bash
npm run generate -- --baseUrl https://example.com --mode block
```

- All sections converted to core or custom blocks
- Best for sites that will use block editor
- Requires WordPress 5.9+

#### PHP Mode

Traditional PHP templates:

```bash
npm run generate -- --baseUrl https://example.com --mode php
```

- All sections rendered in PHP templates
- Best for classic theme workflows
- Compatible with older WordPress versions

### Output Structure

```
theme-generator/output/<theme-slug>/
├── style.css                    # Theme metadata + base styles
├── functions.php                # Theme setup and enqueuing
├── theme.json                   # Block theme configuration
├── index.php                    # Fallback template
├── templates/
│   ├── home.html               # Home page block template
│   ├── page.html               # Default page block template
│   ├── contact.html            # Contact page block template
│   └── ...                     # Other page templates
├── parts/
│   ├── header.html             # Header block pattern
│   └── footer.html             # Footer block pattern
├── patterns/
│   ├── hero-*.php              # Hero section patterns
│   ├── cta-*.php               # CTA patterns
│   └── ...                     # Other reusable patterns
├── sections/
│   ├── header.php              # PHP header section
│   ├── footer.php              # PHP footer section
│   └── form-contact.php        # Contact form PHP section
├── assets/
│   ├── css/
│   │   └── theme.css          # Compiled theme styles
│   ├── js/
│   │   └── theme.js           # Theme scripts
│   └── images/                # Downloaded assets
└── inc/
    ├── block-renderer.php     # Block rendering utilities
    └── section-loader.php     # PHP section loader
```

### Generation Process

1. **Load inputs** - PageSpec, design tokens, patterns
2. **Generate theme.json** - Colors, typography, spacing from tokens
3. **Create style.css** - Theme header + global styles
4. **Build functions.php** - Enqueue scripts, register blocks, theme support
5. **Generate templates** - Block templates for each page type
6. **Create patterns** - Reusable block patterns from layout patterns
7. **Generate PHP sections** - Header, footer, forms
8. **Copy assets** - Images, fonts, other downloaded files
9. **Validate output** - Check required files and structure

### Troubleshooting Theme Generation

#### Missing PageSpec Files

**Symptoms**: Generator reports "No PageSpec found for page X"

**Solutions**:

1. Verify Phase 3 completed successfully:
   ```bash
   ls crawler/output/pages/*/spec/pagespec.json
   ```
2. Check spec-summary.json for errors:
   ```bash
   cat crawler/output/spec/spec-summary.json | jq '.errors'
   ```
3. Re-run Phase 3 if specs are missing:
   ```bash
   npm run spec -- --baseUrl https://example.com
   ```

#### Invalid Design Tokens

**Symptoms**: Theme has missing colors or fonts

**Solutions**:

1. Check design-tokens.json exists and is valid:
   ```bash
   cat crawler/output/spec/design-tokens.json | jq .
   ```
2. Verify tokens have values (may be null if not extracted):
   ```bash
   cat crawler/output/spec/design-tokens.json | jq '.colors'
   ```
3. If many tokens are null, check that Phase 2 HTML includes inline styles or CSS variables

#### Theme Validation Errors

**Symptoms**: Generated theme is missing required files

**Solutions**:

1. Check generation summary for errors:
   ```bash
   cat theme-generator/output/<theme-slug>/generation-summary.json | jq '.errors'
   ```
2. Verify all required files exist:
   ```bash
   ls theme-generator/output/<theme-slug>/{style.css,functions.php,index.php}
   ```
3. Re-run with verbose logging to see where generation failed:
   ```bash
   npm run generate -- --baseUrl https://example.com --verbose
   ```

#### Block Rendering Issues

**Symptoms**: Blocks don't render correctly in WordPress

**Solutions**:

1. Verify WordPress version supports blocks (5.9+)
2. Check theme.json syntax is valid:
   ```bash
   cat theme-generator/output/<theme-slug>/theme.json | jq .
   ```
3. Try switching to PHP mode as fallback:
   ```bash
   npm run generate -- --baseUrl https://example.com --mode php
   ```

#### Assets Not Copied

**Symptoms**: Images or fonts missing in theme

**Solutions**:

1. Verify assets were downloaded in Phase 2:
   ```bash
   find crawler/output/pages/*/assets/files -type f | wc -l
   ```
2. Check includeAssets flag is enabled (default):
   ```bash
   npm run generate -- --baseUrl https://example.com --includeAssets true
   ```
3. Look for asset copy errors in generation log:
   ```bash
   cat theme-generator/output/<theme-slug>/generation.log | grep -i "asset"
   ```

#### Template Mapping Confusion

**Symptoms**: Unclear which Wix pages map to which WordPress templates

**Solutions**:

1. Review the template mapping file:
   ```bash
   cat theme-generator/output/<theme-slug>/template-mapping.json | jq .
   ```
2. Check PageSpec template hints:
   ```bash
   cat crawler/output/pages/*/spec/pagespec.json | jq '.templateHint'
   ```

### Viewing Reports

```bash
# Find latest report directory
ls -lt docs/REPORTS/ | head -2

# View summary
cat docs/REPORTS/<timestamp>/summary.md

# Parse generation stats with jq
cat docs/REPORTS/<timestamp>/run.json | jq '.stats'

# View generation warnings
cat docs/REPORTS/<timestamp>/run.json | jq '.warnings[]'

# View generation errors
cat docs/REPORTS/<timestamp>/run.json | jq '.errors[]'
```

## Troubleshooting

### Common Issues

#### Crawler Fails to Connect

**Symptoms:** Timeout errors, connection refused
**Solutions:**

1. Check internet connection
2. Verify Wix site is accessible
3. Check for rate limiting
4. Review crawler logs: `logs/crawler-[timestamp].log`

```bash
# Check crawler logs
tail -f logs/crawler-*.log
```

#### Docker Container Won't Start

**Symptoms:** Port already in use, container exits immediately
**Solutions:**

1. Check port availability:
   ```bash
   lsof -i :8080
   ```
2. Stop conflicting containers:
   ```bash
   docker-compose down
   docker ps -a
   ```
3. Reset Docker environment:
   ```bash
   npm run docker:reset
   ```

#### Theme Generation Fails

**Symptoms:** Incomplete theme, missing files
**Solutions:**

1. Verify crawler output exists
2. Check crawler output format
3. Review generator logs: `logs/generator-[timestamp].log`
4. Re-run with verbose logging:
   ```bash
   npm run generate-theme -- --verbose
   ```

#### Tests Fail

**Symptoms:** Visual differences, DOM mismatches
**Solutions:**

1. Check baseline images exist
2. Update baseline if intentional change:
   ```bash
   npm run test:update-baseline
   ```
3. Review test screenshots in `tests/visual/screenshots/`
4. Check test logs: `logs/test-[timestamp].log`

### Error Codes

| Code | Description                 | Action                |
| ---- | --------------------------- | --------------------- |
| E001 | Crawler connection failed   | Check URL and network |
| E002 | Invalid crawler output      | Re-run crawler        |
| E003 | Theme generation failed     | Check crawler data    |
| E004 | WordPress deployment failed | Check Docker status   |
| E005 | Test execution failed       | Review test logs      |

## Monitoring & Logging

### Log Locations

- **Crawler**: `logs/crawler-[timestamp].log`
- **Generator**: `logs/generator-[timestamp].log`
- **WordPress**: `logs/wordpress-[timestamp].log`
- **Tests**: `logs/test-[timestamp].log`

### Log Levels

- **ERROR**: Critical failures
- **WARN**: Potential issues
- **INFO**: Normal operations
- **DEBUG**: Detailed diagnostics

### Viewing Logs

```bash
# Tail all logs
npm run logs:tail

# View specific component
npm run logs:view -- --component crawler

# Search logs
npm run logs:search -- --pattern "error"
```

### Health Checks

```bash
# Check all components
npm run health-check

# Check specific component
npm run health-check -- --component wordpress
```

## Maintenance

### Regular Tasks

#### Daily

- Review error logs
- Monitor disk space

#### Weekly

- Update dependencies:
  ```bash
  npm update
  ```
- Clean old logs:
  ```bash
  npm run logs:clean
  ```

#### Monthly

- Update Docker images:
  ```bash
  docker-compose pull
  ```
- Review and archive outputs:
  ```bash
  npm run archive-outputs
  ```

### Backup Procedures

```bash
# Backup crawler outputs
npm run backup -- --component crawler

# Backup generated themes
npm run backup -- --component themes

# Full backup
npm run backup:full
```

## Emergency Procedures

### Complete System Reset

```bash
# Stop all services
npm run docker:down

# Clean all data
npm run clean:all

# Reinstall
npm install

# Restart
npm run docker:up
```

### Rollback Last Operation

```bash
# View recent operations
npm run history

# Rollback specific operation
npm run rollback -- --operation [ID]
```

### Contact & Escalation

For critical issues:

1. Check GitHub Issues
2. Review documentation
3. Contact maintainers

## Performance Tuning

### Crawler Performance

- Adjust concurrent requests in `crawler/config.json`
- Modify timeout settings
- Enable/disable headless mode

### Docker Performance

- Adjust memory limits in `docker-compose.yml`
- Configure volume mounts
- Optimize image caching

### Testing Performance

- Run tests in parallel
- Adjust screenshot comparison threshold
- Skip non-critical tests

## Appendix

### Useful Commands Cheatsheet

```bash
# Full pipeline
npm run pipeline -- --url [URL]

# Individual steps
npm run crawl -- --url [URL]
npm run generate-theme
npm run deploy-theme
npm run test

# Docker operations
npm run docker:up
npm run docker:down
npm run docker:logs
npm run docker:reset

# Maintenance
npm run logs:clean
npm run clean:all
npm run health-check
```

### Configuration Files

- `.env` - Environment variables
- `crawler/config.json` - Crawler settings
- `theme-generator/config.json` - Generator settings
- `docker-compose.yml` - Docker configuration
- `tests/config.json` - Test settings
