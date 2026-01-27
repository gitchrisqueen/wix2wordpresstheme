# ARCHITECTURE - Wix to WordPress Theme Converter

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Wix to WordPress Pipeline                    │
└─────────────────────────────────────────────────────────────────┘

  Input: Wix Site URL
         │
         ▼
  ┌──────────────────┐
  │  1. DISCOVERY    │  ✅ Phase 1 (Complete)
  │  (Fetch + Cheerio)│ • Sitemap parsing
  └──────────────────┘  • URL crawling
         │              • robots.txt compliance
         │              • URL normalization
         ▼
  ┌──────────────────┐
  │  manifest.json   │  Discovered URLs + metadata
  └──────────────────┘
         │
         ▼
  ┌──────────────────┐
  │  2. CRAWLER      │  ✅ Phase 2 (Complete)
  │  (Playwright)    │  • Page capture (screenshots)
  └──────────────────┘  • DOM extraction
         │              • Metadata extraction
         │              • Asset discovery + download
         ▼
  ┌──────────────────┐
  │  Crawled Data    │  Per-page snapshots + assets
  └──────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ 3. SPEC GEN      │  Phase 3 (Coming)
  │  (Analysis)      │  • PageSpec inference
  └──────────────────┘  • Design token extraction
         │              • Layout detection
         │              • Component mapping
         ▼
  ┌──────────────────┐
  │  PageSpec JSON   │  Structured page specifications
  └──────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ 4. THEME GEN     │  Phase 4 (Coming)
  │  (Generator)     │  • Template generation
  └──────────────────┘  • Asset optimization
         │              • WordPress structure
         │              • Style conversion
         ▼
  ┌──────────────────┐
  │  WP Theme        │  WordPress-ready theme
  └──────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ 5. WP LOCAL      │  Phase 5 (Coming)
  │  (Docker)        │  • WordPress install
  └──────────────────┘  • MySQL database
         │              • Theme deployment
         │              • Plugin support
         ▼
  ┌──────────────────┐
  │ 6. TESTS         │  Phase 6 (Coming)
  │  (Vitest+Playwright)│ • Visual regression
  └──────────────────┘  • DOM validation
         │              • Performance tests
         │              • Accessibility checks
         ▼
  Output: WordPress Theme + Test Report
```

## 🏛️ Component Architecture

### 1. Discovery Module (✅ Phase 1 Complete)

**Purpose:** Discover and catalog all pages on a Wix site.

**Technology Stack:**

- Node.js (runtime)
- TypeScript (language)
- fetch API (HTTP requests)
- cheerio (HTML parsing for fallback crawl)
- fast-xml-parser (sitemap parsing)
- robots-parser (robots.txt compliance)
- zod (schema validation)
- commander (CLI)

**Key Components:**

```
crawler/
├── src/
│   ├── cli/
│   │   └── discover.ts        # Main CLI entry point
│   ├── discovery/
│   │   ├── sitemap.ts         # Sitemap parser with recursion
│   │   └── crawl.ts           # Fallback crawler (BFS)
│   ├── lib/
│   │   ├── url.ts             # URL normalization & filtering
│   │   ├── robots.ts          # robots.txt parser
│   │   ├── logger.ts          # Structured logging
│   │   └── report.ts          # Report generation
│   └── types/
│       └── manifest.ts        # Manifest types & validation
├── schemas/
│   └── manifest.schema.json   # JSON schema for manifest
├── output/
│   └── manifest.json          # Generated manifest
└── __tests__/                 # Unit tests
    ├── url.test.ts
    ├── sitemap.test.ts
    └── robots.test.ts
```

**Discovery Flow:**

1. **Normalize base URL** - Handle redirects, www, trailing slashes
2. **Try sitemaps** - Attempt multiple locations:
   - `/sitemap.xml`
   - `/sitemap_index.xml`
   - `/site-map.xml`
   - `/_api/sitemap.xml` (Wix-specific)
3. **Parse sitemaps** - Handle both urlset and sitemapindex recursively
4. **Fallback crawl** - If no sitemap or empty:
   - BFS crawl starting from homepage
   - Max depth (default 2) and max pages (default 500)
   - Extracts links from HTML using cheerio
   - Filters out images, PDFs, and other assets
5. **Validate URLs** - Check HTTP status (HEAD request with GET fallback)
6. **Generate outputs** - Create manifest.json + reports

**Output Format - manifest.json:**

```json
{
  "version": "1.0.0",
  "baseUrl": "https://example.com",
  "generatedAt": "2026-01-27T15:20:10.000Z",
  "discovery": {
    "method": "sitemap|crawl|hybrid",
    "respectRobots": true,
    "sitemapsTried": ["..."],
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

**Reports Generated:**

- `docs/REPORTS/<timestamp>/run.json` - Machine-readable run report
- `docs/REPORTS/<timestamp>/summary.md` - Human-readable summary
- `docs/REPORTS/<timestamp>/logs.json` - Complete log entries

---

## Phase 2: Crawler (Playwright) ✅

### Purpose

Capture comprehensive snapshots of discovered pages using Playwright, including:

- Full-page screenshots (multiple viewports)
- Rendered HTML
- Structured DOM snapshots
- Metadata extraction
- Asset discovery and download

### Directory Structure

```
crawler/
├── src/
│   ├── cli/
│   │   └── crawl.ts            # Crawl CLI command
│   ├── crawl/
│   │   ├── runner.ts           # Queue & concurrency orchestration
│   │   ├── pageCapture.ts      # Single page capture logic
│   │   ├── domExtract.ts       # DOM serialization
│   │   ├── metaExtract.ts      # Metadata extraction
│   │   ├── assetsDiscover.ts   # Asset discovery (DOM/CSS)
│   │   └── assetsDownload.ts   # Asset fetching & hashing
│   ├── lib/
│   │   ├── hash.ts             # SHA-256 hashing utilities
│   │   ├── slug.ts             # Stable slug generation
│   │   └── fileio.ts           # Safe file operations
│   └── types/
│       └── crawl.ts            # Crawl types & schemas
├── schemas/
│   ├── meta.schema.json        # Metadata output schema
│   ├── dom.schema.json         # DOM snapshot schema
│   ├── assets-manifest.schema.json  # Assets manifest schema
│   └── crawl-summary.schema.json    # Crawl summary schema
└── output/
    ├── manifest.json           # From Phase 1
    ├── crawl-summary.json      # Crawl statistics
    └── pages/
        └── <slug>/             # Per-page artifacts
            ├── page.json
            ├── html/rendered.html
            ├── dom/dom.json
            ├── meta/meta.json
            ├── screenshots/
            │   ├── desktop.png
            │   └── mobile.png
            └── assets/
                ├── manifest.json
                └── files/
```

### Crawl Flow

1. **Load manifest** - Read discovered URLs from Phase 1
2. **Initialize browser** - Launch Chromium with custom config
3. **Process queue** - Concurrent page capture with worker pool
4. **Per page**:
   a. Navigate with retry logic (networkidle → domcontentloaded fallback)
   b. Wait for page settle (default 750ms)
   c. Capture screenshots for each breakpoint
   d. Extract rendered HTML
   e. Serialize DOM to structured JSON
   f. Extract metadata (title, OG, headings, canonical)
   g. Discover assets (images, fonts, CSS, JS)
   h. Download assets (with deduplication & hashing)
5. **Generate summaries** - crawl-summary.json and reports

### Browser Configuration

- **Engine**: Chromium (headless)
- **User Agent**: Chrome 120 (configurable)
- **Viewports**:
  - Desktop: 1920x1080
  - Mobile: 375x667
  - Tablet: 768x1024
- **Cache**: Disabled for determinism
- **HTTPS Errors**: Ignored (configurable)

### Wait Strategy

Default behavior:

1. `page.goto(url, { waitUntil: 'networkidle' })`
2. Additional settle time (`--settleMs`, default 750ms)
3. Verify `document.readyState === 'complete'`

On timeout/failure, retry with fallback:

1. `waitUntil: 'domcontentloaded'` (faster, less strict)
2. Logged as downgrade in reports

### Concurrency Model

- One browser instance
- Multiple contexts (one per page)
- Worker pool for concurrent processing
- Configurable concurrency (`--concurrency`, default 3)
- Context isolation (each page gets fresh context)
- Automatic cleanup after page capture

### DOM Extraction

**Captured attributes**: `id`, `class`, `href`, `src`, `srcset`, `alt`, `role`, `aria-label`, `name`, `type`, `rel`, `title`

**Skipped tags**: `script`, `style`, `noscript`, `iframe`, `svg`

**Output format**:

```json
{
  "url": "https://example.com/page",
  "capturedAt": "2026-01-27T18:00:00.000Z",
  "hash": "abc123...",
  "root": {
    "type": "element",
    "tag": "body",
    "children": [
      {
        "type": "element",
        "tag": "h1",
        "attributes": { "class": "title" },
        "children": [
          { "type": "text", "text": "Hello World" }
        ]
      }
    ]
  },
  "keyElements": {
    "nav": "nav[role='navigation']",
    "footer": "footer",
    "main": "main"
  }
}
```

### Metadata Extraction

Extracts:

- `title` - Document title
- `metaDescription` - Meta description tag
- `canonical` - Canonical URL
- `og` - Open Graph metadata (title, description, image, url, type)
- `headings` - All h1-h6 elements with text content

### Asset Discovery

**Sources**:

1. **DOM attributes**:
   - `img[src]`, `img[srcset]`
   - `source[srcset]`
   - `link[rel="icon"]`, `link[rel="apple-touch-icon"]`
   - `meta[property="og:image"]`
   - `video[poster]`
   - `link[rel="stylesheet"]`
   - `script[src]`

2. **CSS references**:
   - Parse loaded stylesheets
   - Extract `url()` references
   - Download fonts and background images

**Asset types**: `image`, `font`, `css`, `js`, `other`

**Download policy**:

- Same-origin by default
- Third-party assets require explicit flag
- Deduplication by normalized URL
- Hash-based file naming (`{shortHash}.{ext}`)
- SHA-256 hashing for verification

### Output Schemas

All outputs validated against JSON schemas:

- `meta.schema.json` - Metadata structure
- `dom.schema.json` - DOM snapshot structure
- `assets-manifest.schema.json` - Asset list structure
- `crawl-summary.schema.json` - Run summary structure

### Error Handling

**Per-page failures**:

- Retry with exponential backoff (up to `--retries`, default 2)
- Downgrade wait strategy on retry
- Save `error.png` screenshot and `error.txt` stack trace
- Add entry to `crawl-errors.json`
- Continue to next page if `--allowPartial true`

**Recovery strategies**:

- Timeout → Retry with longer timeout or faster wait strategy
- Network error → Retry with backoff
- Screenshot failure → Continue without screenshots
- Asset download failure → Mark as failed, continue

### Reports Generated

- `crawler/output/crawl-summary.json` - Statistics and per-page results
- `crawler/output/crawl-errors.json` - Failed pages (if any)
- `docs/REPORTS/<timestamp>/run.json` - Machine-readable run report
- `docs/REPORTS/<timestamp>/summary.md` - Human-readable summary

---

### 2. Crawler Module (Phase 2 - Coming Soon)

**Purpose:** Extract complete page data including DOM, styles, assets, and content.

**Planned Technology Stack:**

- Playwright (browser automation)
- Node.js (runtime)
- TypeScript (language)

**Planned Components:**

```
crawler/
├── src/
│   ├── crawler.ts           # Main crawler orchestrator
│   ├── page-scraper.ts      # Individual page scraping logic
│   ├── asset-downloader.ts  # Download images, fonts, etc.
│   ├── style-extractor.ts   # Extract and process CSS
│   └── dom-analyzer.ts      # Analyze DOM structure
└── output/                   # Crawled data output directory
```

**Planned Data Flow:**

1. Load manifest.json from discovery phase
2. For each page in manifest:
   - Navigate to page using Playwright
   - Capture DOM structure
   - Extract inline and linked styles
   - Download all assets (images, fonts, videos)
   - Extract content (text, metadata)
   - Take screenshots for testing
3. Output structured JSON + asset files

**Output Format:**

```json
{
  "site": {
    "url": "https://example.wixsite.com",
    "title": "Example Site",
    "metadata": {}
  },
  "pages": [
    {
      "url": "/",
      "title": "Home",
      "dom": {},
      "styles": [],
      "assets": [],
      "content": {}
    }
  ],
  "assets": {
    "images": [],
    "fonts": [],
    "videos": []
  }
}
```

### 2. Theme Generator Module

**Purpose:** Convert crawled data into a WordPress-compatible theme.

**Technology Stack:**

- Node.js (runtime)
- TypeScript (language)
- Template engines (Handlebars/EJS)

**Key Components:**

```
theme-generator/
├── src/
│   ├── generator.ts         # Main theme generator
│   ├── template-builder.ts  # Build PHP templates
│   ├── style-converter.ts   # Convert CSS to WP styles
│   ├── asset-optimizer.ts   # Optimize and organize assets
│   ├── functions-builder.ts # Generate functions.php
│   └── templates/
│       ├── style.css.hbs    # Theme stylesheet template
│       ├── functions.php.hbs# Functions template
│       ├── header.php.hbs   # Header template
│       ├── footer.php.hbs   # Footer template
│       └── page.php.hbs     # Page template
├── output/                   # Generated themes
├── config.json              # Generator configuration
└── package.json             # Dependencies
```

**Generation Process:**

1. Load crawled data
2. Analyze structure and create theme plan
3. Generate WordPress theme structure:
   - `style.css` (theme metadata)
   - `functions.php` (theme setup, hooks)
   - Template files (header, footer, page, etc.)
   - Assets directory (CSS, JS, images)
4. Convert styles to WordPress-compatible format
5. Optimize assets (compress images, minify CSS/JS)
6. Generate theme metadata
7. Create theme package

**WordPress Theme Structure:**

```
theme-output/
├── style.css               # Theme metadata
├── functions.php           # Theme functions
├── header.php              # Header template
├── footer.php              # Footer template
├── index.php               # Main template
├── page.php                # Page template
├── single.php              # Single post template
├── assets/
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   ├── images/            # Images
│   └── fonts/             # Fonts
├── inc/                    # Include files
│   ├── customizer.php     # Theme customizer
│   └── template-tags.php  # Template helper functions
└── languages/              # Translation files
```

### 3. WordPress Local Environment

**Purpose:** Provide isolated WordPress environment for theme development and testing.

**Technology Stack:**

- Docker (containerization)
- Docker Compose (orchestration)
- WordPress (CMS)
- MySQL (database)

**Key Components:**

```
wordpress-local/
├── docker-compose.yml      # Docker services configuration
├── wordpress/              # WordPress installation (auto-generated)
├── themes/                 # Custom themes directory
├── plugins/                # Custom plugins directory
├── data/                   # MySQL data (persistent)
├── config/
│   ├── php.ini            # PHP configuration
│   └── wp-config.php      # WordPress configuration
└── scripts/
    ├── init.sh            # Initialize WordPress
    ├── deploy-theme.sh    # Deploy theme
    └── backup.sh          # Backup database
```

**Docker Services:**

```yaml
services:
  wordpress:
    image: wordpress:latest
    ports:
      - '8080:80'
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
    volumes:
      - ./data:/var/lib/mysql
```

### 4. Testing Module

**Purpose:** Validate theme conversion quality through visual and DOM testing.

**Technology Stack:**

- Jest (test framework)
- Playwright (browser automation)
- Pixelmatch (visual comparison)
- Axe (accessibility testing)

**Key Components:**

```
tests/
├── visual/
│   ├── visual-regression.test.ts  # Visual comparison tests
│   ├── baseline/                  # Baseline screenshots
│   ├── current/                   # Current screenshots
│   ├── diff/                      # Difference images
│   └── config.json               # Visual test config
├── dom/
│   ├── structure.test.ts         # DOM structure tests
│   ├── functionality.test.ts     # Interactive element tests
│   ├── accessibility.test.ts     # A11y tests
│   └── config.json              # DOM test config
├── performance/
│   └── load-time.test.ts        # Performance tests
├── jest.config.js               # Jest configuration
└── test-utils.ts                # Shared test utilities
```

**Testing Process:**

**Visual Testing:**

1. Load original Wix page
2. Take screenshot (baseline)
3. Load converted WordPress page
4. Take screenshot (current)
5. Compare pixel-by-pixel
6. Generate diff image
7. Calculate similarity score
8. Report differences

**DOM Testing:**

1. Load both pages
2. Extract DOM structure
3. Compare element hierarchy
4. Validate semantic HTML
5. Check interactive elements
6. Test responsive behavior
7. Run accessibility audit

### 5. Scripts Module

**Purpose:** Automation scripts for common operations.

**Key Scripts:**

```
scripts/
├── pipeline.sh             # Full pipeline orchestration
├── setup.sh                # Initial setup
├── crawl.sh                # Run crawler
├── generate.sh             # Generate theme
├── deploy.sh               # Deploy to WordPress
├── test.sh                 # Run tests
├── backup.sh               # Backup data
├── clean.sh                # Clean temporary files
├── logs.sh                 # Log management
└── utils/
    ├── colors.sh          # Terminal colors
    ├── logging.sh         # Logging functions
    └── error-handler.sh   # Error handling
```

## 🔧 Technical Decisions

### Language Choice: TypeScript/Node.js

**Rationale:**

- Playwright's native support
- Rich ecosystem for web scraping
- WordPress/web technology familiarity
- Easy JSON/data manipulation
- Strong async/await support

### Browser Automation: Playwright

**Rationale:**

- Modern browser support
- Reliable automation APIs
- Built-in wait mechanisms
- Network interception
- Cross-browser testing
- Better Wix site compatibility

**Alternatives Considered:**

- Puppeteer: Less cross-browser support
- Selenium: More complex, slower
- Cheerio: No JavaScript execution

### Containerization: Docker

**Rationale:**

- Isolated environment
- Consistent across systems
- Easy setup/teardown
- Production-like environment
- Version management

### Testing: Jest + Playwright

**Rationale:**

- Comprehensive test framework
- Good TypeScript support
- Parallel test execution
- Rich assertion library
- Visual testing capabilities

## 🔐 Security Considerations

### Crawler Security

- Respect robots.txt
- Rate limiting to avoid DDoS
- No credential storage
- Sanitize extracted content

### WordPress Security

- Isolated Docker environment
- No external network access (except localhost)
- Regular image updates
- Secure database credentials

### Theme Security

- Escape all output
- Sanitize user inputs
- Use WordPress security functions
- No eval() or dangerous functions

## 📊 Data Flow

### Pipeline Data Flow

```
1. User Input
   └─> Wix Site URL

2. Crawler
   ├─> Page Discovery
   ├─> Content Extraction
   ├─> Style Analysis
   └─> Asset Download

3. Intermediate Storage (JSON)
   ├─> pages.json
   ├─> styles.json
   ├─> assets.json
   └─> metadata.json

4. Theme Generator
   ├─> Template Generation
   ├─> Style Conversion
   ├─> Asset Optimization
   └─> Theme Packaging

5. WordPress Deployment
   ├─> Theme Installation
   ├─> Theme Activation
   └─> Content Import (future)

6. Testing
   ├─> Visual Comparison
   ├─> DOM Validation
   └─> Test Report Generation

7. Output
   ├─> WordPress Theme (ZIP)
   ├─> Test Report (HTML)
   └─> Conversion Logs
```

## 🚀 Extensibility

### Plugin System

The architecture supports future plugins for:

- Custom post types
- Additional page builders
- Alternative CMS targets (not just WordPress)
- Custom style frameworks
- Advanced animations

### Modular Design

Each component is designed to be:

- Independently testable
- Swappable with alternatives
- Configurable via JSON
- Extensible through interfaces

### Future Enhancements

- Content migration (beyond structure)
- Dynamic content support
- E-commerce conversion
- Multi-language support
- Advanced animation conversion
- Form builder integration
- SEO metadata preservation

## 📈 Scalability

### Horizontal Scaling

- Crawler can process multiple pages in parallel
- Theme generation is stateless
- Tests can run in parallel

### Performance Optimization

- Asset caching
- Incremental crawling (detect changes)
- Lazy loading for assets
- Image optimization (WebP, compression)
- CSS/JS minification

## 🔍 Monitoring & Observability

### Logging Strategy

- Structured logging (JSON format)
- Log levels: ERROR, WARN, INFO, DEBUG
- Separate logs per component
- Timestamp and correlation IDs
- Centralized log aggregation ready

### Metrics

- Crawl duration
- Page count
- Asset count and size
- Theme generation time
- Test pass/fail rate
- Visual similarity score

### Health Checks

- Component status
- Docker container health
- WordPress availability
- Database connectivity

## 🧪 Testing Strategy

### Unit Tests

- Individual component functions
- Utility functions
- Data transformers

### Integration Tests

- Component interactions
- End-to-end pipeline
- Docker environment

### Visual Tests

- Pixel-perfect comparison
- Responsive breakpoints
- Browser compatibility

### Performance Tests

- Load time benchmarks
- Asset size limits
- Memory usage

## 📚 Technology Stack Summary

| Component | Technologies                    |
| --------- | ------------------------------- |
| Crawler   | TypeScript, Playwright, Node.js |
| Theme Gen | TypeScript, Node.js, Handlebars |
| WordPress | Docker, WordPress, MySQL, PHP   |
| Testing   | Jest, Playwright, Pixelmatch    |
| Logging   | Winston, Morgan                 |
| Build     | npm/yarn, TypeScript compiler   |
| CI/CD     | GitHub Actions (future)         |

## 🔄 Development Workflow

1. **Setup**: Install dependencies, start Docker
2. **Development**: Modify component code
3. **Testing**: Run unit and integration tests
4. **Validation**: Test with sample Wix site
5. **Review**: Code review and documentation
6. **Deployment**: Merge to main branch

## 📝 Configuration Management

### Environment Variables

- Database credentials
- WordPress URLs
- API keys (future)
- Feature flags

### Config Files

- `crawler/config.json` - Crawling behavior
- `theme-generator/config.json` - Theme options
- `docker-compose.yml` - Container settings
- `tests/config.json` - Test thresholds

### Version Control

- Git for source code
- Semantic versioning
- Tagged releases
- Changelog maintenance
