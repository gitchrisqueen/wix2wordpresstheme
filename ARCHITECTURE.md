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
  │ 3. SPEC GEN      │  ✅ Phase 3 (Complete)
  │  (Analysis)      │  • PageSpec inference
  └──────────────────┘  • Design token extraction
         │              • Layout pattern detection
         │              • Section classification
         ▼
  ┌──────────────────┐
  │  PageSpec JSON   │  Structured page specifications
  └──────────────────┘  + Design tokens + Patterns
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
        "children": [{ "type": "text", "text": "Hello World" }]
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

## Phase 3: Spec Generation ✅

**Status**: Complete (2026-01-27)

**Purpose**: Convert crawled HTML/DOM into structured PageSpec, extract design tokens, and detect reusable layout patterns.

### Input

From Phase 2 crawl output:

- `manifest.json` - List of pages
- Per-page data: `html/rendered.html`, `meta/meta.json`, `dom/dom.json`

### Output

```
crawler/output/
├── spec/
│   ├── design-tokens.json      # Global design tokens
│   ├── layout-patterns.json    # Reusable patterns
│   └── spec-summary.json       # Generation summary
└── pages/<slug>/
    └── spec/
        └── pagespec.json       # Per-page specification
```

### Architecture

#### 1. Sectionizer (`spec/sectionizer.ts`)

Converts HTML into ordered, typed sections using heuristics:

**Section types**: header, hero, footer, CTA, contactForm, featureGrid, gallery, testimonial, pricing, FAQ, richText, unknown

**Heuristics**:

- Semantic tags: `<header>`, `<footer>`, `<main>`
- Role attributes: `role="banner"`, `role="contentinfo"`
- Class patterns: `.hero`, `.pricing`, `.testimonial`
- Content patterns: h1 + CTA + image → hero
- Form presence: `<form>` → contactForm

**Extracted per section**:

- Heading (first h1-h6 found)
- Text blocks (p, li, blockquote)
- CTAs (buttons and links)
- Media (images with src/alt)
- DOM anchor (for reference back to original)

#### 2. PageSpec Inference (`spec/pagespecInfer.ts`)

Generates PageSpec from inputs:

**Template hint inference**:

- `slug=""` → home
- `slug match /contact/` → contact
- `slug match /blog/` + multiple articles → blogIndex
- Single h1 + 1-3 CTAs → landing
- Many paragraphs → content
- Otherwise → generic

**Links extraction**: Internal vs external links from `<a href>`

**Forms extraction**: Detects `<form>` with fields, labels, types

#### 3. Design Token Extraction (`spec/designTokens.ts`)

Extracts from inline styles and CSS variables:

**Colors**:

- Parse `style="color: #fff"` attributes
- Parse `:root { --primary: #ff0000 }` from `<style>` tags
- Detect hex (#RGB, #RRGGBB) and rgb()/rgba() values
- Infer primary/secondary from frequency

**Typography**:

- Extract `font-family` from inline styles and CSS
- Deduplicate font families

**Buttons**:

- Find `<button>`, `<a role="button">`, `.button` classes
- Extract background-color, color, border-radius, padding, font-weight
- Identify primary/secondary based on uniqueness

**Output philosophy**: Conservative - output null for values we can't infer reliably.

#### 4. Pattern Detection (`spec/patterns.ts`)

Clusters similar sections across pages:

**Signature generation** (`spec/signatures.ts`):

```
type:hero|h:1|txt:1|med:1|cta:1
```

- Section type
- Heading presence (1/0)
- Text count (0, 1, few, many)
- Media count (bucketed)
- CTA count (bucketed)

**Clustering**:

- Group sections by identical signature
- Only create patterns for signatures with 2+ instances
- Limit examples to first 5
- Sort patterns by frequency (count descending)

### Processing Flow

```
1. Load manifest.json
2. For each page:
   a. Load html, meta, dom
   b. Sectionize HTML → sections[]
   c. Extract links, forms
   d. Infer template hint
   e. Build PageSpec
   f. Validate against schema
   g. Write pagespec.json
3. Collect HTML from all pages
4. Extract design tokens
5. Detect patterns from all sections
6. Write design-tokens.json, layout-patterns.json, spec-summary.json
7. Generate reports
```

### Error Handling

- **Missing files**: Skip page, log error in summary
- **Invalid JSON**: Skip page, log error
- **No sections extracted**: Add warning note to pagespec
- **Schema validation fails**: Throw error, abort
- **Empty tokens**: Output null values, document in sources

### Determinism

- **Section IDs**: `sec_001`, `sec_002`, etc. (predictable)
- **Section order**: Top-to-bottom DOM order
- **Signature**: Same structure → same signature
- **Token frequency**: Stable color/font ordering

### Trade-offs

**Pros**:

- No AI/ML dependencies
- Fast (processes 100 pages in seconds)
- Deterministic outputs
- Conservative (avoids hallucination)

**Cons**:

- Limited accuracy (many "unknown" sections)
- Misses computed styles (only inline + CSS vars)
- Coarse pattern matching (bucketed counts)
- Manual tuning needed for unusual sites

---

## Phase 4: Theme Generator (Hybrid) ✅

**Status**: Ready for Implementation (2026-01-27)

**Purpose**: Convert PageSpec, design tokens, and layout patterns into a functional WordPress block theme with hybrid rendering (blocks + PHP sections).

### Input

From Phase 3 spec output:

- `spec/design-tokens.json` - Global design system
- `spec/layout-patterns.json` - Reusable section patterns
- Per-page: `pages/<slug>/spec/pagespec.json` - Page specifications

### Output

```
theme-generator/output/<theme-slug>/
├── style.css                    # Theme metadata + base styles
├── functions.php                # Theme setup, enqueuing, block registration
├── theme.json                   # Block theme configuration (colors, typography, spacing)
├── index.php                    # Fallback template (required)
├── templates/
│   ├── home.html               # Block template for homepage
│   ├── page.html               # Default page block template
│   ├── contact.html            # Contact page block template
│   └── *.html                  # Other page-specific block templates
├── parts/
│   ├── header.html             # Header block pattern (site-wide)
│   └── footer.html             # Footer block pattern (site-wide)
├── patterns/
│   ├── hero-image-cta.php      # Hero section pattern
│   ├── feature-grid-3col.php   # Feature grid pattern
│   ├── cta-centered.php        # CTA pattern
│   └── *.php                   # Other reusable block patterns
├── sections/
│   ├── header.php              # PHP-rendered header
│   ├── footer.php              # PHP-rendered footer
│   └── form-contact.php        # PHP-rendered contact form
├── assets/
│   ├── css/
│   │   ├── theme.css          # Compiled global styles
│   │   └── blocks.css         # Block-specific styles
│   ├── js/
│   │   ├── theme.js           # Theme scripts (navigation, etc.)
│   │   └── forms.js           # Form handling
│   └── images/                # Copied from Phase 2 downloads
│       └── fonts/             # Web fonts
└── inc/
    ├── block-renderer.php     # Hybrid block rendering logic
    ├── section-loader.php     # PHP section include utilities
    └── template-tags.php      # Helper functions
```

### Architecture: Hybrid Rendering Model

#### Three Rendering Modes

**1. Block Mode** (`mode: "block"`)
- All sections converted to WordPress core/custom blocks
- Pure Gutenberg block templates
- Requires WordPress 5.9+
- Best for: Sites that will be edited with block editor

**2. PHP Mode** (`mode: "php"`)
- Traditional PHP template hierarchy
- All sections rendered server-side with PHP
- Compatible with classic themes
- Best for: Classic theme workflows, older WP versions

**3. Hybrid Mode** (`mode: "hybrid"` - Default)
- Combines blocks for content sections with PHP for system sections
- Flexible and maintainable
- Best for: Most conversions

#### Hybrid Mode Section Mapping

| Section Type | Rendering Method | Rationale |
|--------------|------------------|-----------|
| `header` | PHP (`sections/header.php`) | Navigation is dynamic, better in PHP |
| `footer` | PHP (`sections/footer.php`) | Widget areas, menus - PHP-friendly |
| `hero` | Block (`core/cover` + `core/heading` + `core/buttons`) | Visual composition suits blocks |
| `CTA` | Block Pattern (`patterns/cta-*.php`) | Reusable, editor-friendly |
| `featureGrid` | Block Pattern (`patterns/feature-grid-*.php`) | Structured layout with columns |
| `gallery` | Block (`core/gallery`) | Built-in WordPress gallery |
| `testimonial` | Block Pattern (`patterns/testimonial-*.php`) | Reusable quote + citation |
| `pricing` | Block Pattern (`patterns/pricing-*.php`) | Structured pricing cards |
| `FAQ` | Block Pattern (`patterns/faq-*.php`) | Expandable Q&A |
| `contactForm` | PHP (`sections/form-contact.php`) | Form processing needs PHP |
| `richText` | Block (`core/html` or `core/group`) | Preserve HTML verbatim |
| `unknown` | Block (`core/html`) | Fallback to raw HTML |

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 4: Theme Generation                │
└─────────────────────────────────────────────────────────────┘

Input: PageSpec + Design Tokens + Patterns
       │
       ▼
┌──────────────────────┐
│ 1. Load Inputs       │  Read all PageSpec files, tokens, patterns
└──────────────────────┘  Validate schemas
       │
       ▼
┌──────────────────────┐
│ 2. Generate          │  Extract colors, typography, spacing from tokens
│    theme.json        │  Generate WordPress theme.json (v2 schema)
└──────────────────────┘  Define custom color palette and font families
       │
       ▼
┌──────────────────────┐
│ 3. Build style.css   │  Theme metadata (name, author, version, etc.)
│    + functions.php   │  Enqueue scripts and styles
└──────────────────────┘  Register block patterns and template parts
       │                   Add theme supports (block-styles, editor-styles)
       ▼
┌──────────────────────┐
│ 4. Generate Block    │  For each PageSpec:
│    Templates         │  - Determine template type (home, page, contact, etc.)
└──────────────────────┘  - Convert sections to blocks or PHP placeholders
       │                   - Create templates/*.html files
       ▼
┌──────────────────────┐
│ 5. Create Block      │  Group layout patterns by signature
│    Patterns          │  Generate reusable patterns/*.php
└──────────────────────┘  Register patterns in functions.php
       │
       ▼
┌──────────────────────┐
│ 6. Generate PHP      │  header.php / footer.php for site-wide elements
│    Sections          │  form-contact.php for contact forms
└──────────────────────┘  Include navigation, widget areas
       │
       ▼
┌──────────────────────┐
│ 7. Copy Assets       │  Copy images, fonts from Phase 2 downloads
│                      │  Organize in assets/ directory
└──────────────────────┘  Update asset references in templates
       │
       ▼
┌──────────────────────┐
│ 8. Validate & Report │  Check required files exist
│                      │  Validate theme.json, style.css
└──────────────────────┘  Generate template-mapping.json
       │                   Create generation-summary.json
       ▼
Output: WordPress Theme (ready to install)
```

### Component Breakdown

#### 1. theme.json Generator (`generator/themeJson.ts`)

Converts design tokens to WordPress theme.json (v2 schema):

**Colors**:
```json
{
  "settings": {
    "color": {
      "palette": [
        { "slug": "primary", "color": "#ff0000", "name": "Primary" },
        { "slug": "secondary", "color": "#0000ff", "name": "Secondary" }
      ]
    }
  }
}
```

**Typography**:
```json
{
  "settings": {
    "typography": {
      "fontFamilies": [
        { "slug": "body", "fontFamily": "Roboto, sans-serif", "name": "Body" },
        { "slug": "heading", "fontFamily": "Montserrat, sans-serif", "name": "Heading" }
      ]
    }
  }
}
```

**Spacing**: Inferred from common padding/margin values in sections

#### 2. Block Template Builder (`generator/blockTemplates.ts`)

Converts PageSpec sections to block markup:

**Input (PageSpec)**:
```json
{
  "sections": [
    {
      "id": "sec_001",
      "type": "hero",
      "heading": { "level": 1, "text": "Welcome" },
      "textBlocks": ["Subheading text"],
      "ctas": [{ "text": "Get Started", "url": "/contact" }],
      "media": [{ "type": "image", "src": "hero.jpg", "alt": "Hero" }]
    }
  ]
}
```

**Output (Block Template)**:
```html
<!-- wp:cover {"url":"assets/images/hero.jpg","alt":"Hero"} -->
<div class="wp-block-cover">
  <!-- wp:heading {"level":1} -->
  <h1>Welcome</h1>
  <!-- /wp:heading -->
  
  <!-- wp:paragraph -->
  <p>Subheading text</p>
  <!-- /wp:paragraph -->
  
  <!-- wp:buttons -->
  <div class="wp-block-buttons">
    <!-- wp:button -->
    <div class="wp-block-button">
      <a class="wp-block-button__link" href="/contact">Get Started</a>
    </div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</div>
<!-- /wp:cover -->
```

#### 3. PHP Section Generator (`generator/phpSections.ts`)

Creates traditional PHP template parts:

**Header Section**:
```php
<?php
/**
 * Header section
 * Rendered via: do_action('theme_render_header')
 */
?>
<header id="site-header" role="banner">
  <div class="header-container">
    <?php if ( has_custom_logo() ) : ?>
      <?php the_custom_logo(); ?>
    <?php endif; ?>
    
    <nav id="site-navigation" role="navigation">
      <?php
      wp_nav_menu( array(
        'theme_location' => 'primary',
        'menu_class'     => 'primary-menu',
      ) );
      ?>
    </nav>
  </div>
</header>
```

#### 4. Pattern Generator (`generator/patterns.ts`)

Creates reusable block patterns from layout patterns:

**Input (Layout Pattern)**:
```json
{
  "signature": "type:hero|h:1|txt:1|med:1|cta:1",
  "count": 5,
  "examples": [
    { "pageSlug": "home", "sectionId": "sec_001" },
    { "pageSlug": "about", "sectionId": "sec_002" }
  ]
}
```

**Output (Pattern File)**:
```php
<?php
/**
 * Title: Hero with Image and CTA
 * Slug: my-wix-theme/hero-image-cta
 * Categories: featured
 */
?>
<!-- wp:pattern {"slug":"my-wix-theme/hero-image-cta"} -->
<!-- wp:cover -->
<div class="wp-block-cover">
  <!-- wp:heading {"level":1} -->
  <h1><?php esc_html_e( 'Hero Heading', 'my-wix-theme' ); ?></h1>
  <!-- /wp:heading -->
  
  <!-- wp:paragraph -->
  <p><?php esc_html_e( 'Description text', 'my-wix-theme' ); ?></p>
  <!-- /wp:paragraph -->
  
  <!-- wp:buttons -->
  <div class="wp-block-buttons">
    <!-- wp:button -->
    <div class="wp-block-button">
      <a class="wp-block-button__link"><?php esc_html_e( 'Call to Action', 'my-wix-theme' ); ?></a>
    </div>
    <!-- /wp:button -->
  </div>
  <!-- /wp:buttons -->
</div>
<!-- /wp:cover -->
<!-- /wp:pattern -->
```

#### 5. Asset Copier (`generator/assets.ts`)

- Copies downloaded assets from `crawler/output/pages/*/assets/files/`
- Organizes by type: `images/`, `fonts/`, `css/`, `js/`
- Updates asset URLs in templates to point to theme directory
- Maintains hash-based filenames from Phase 2

#### 6. Theme Validator (`generator/validator.ts`)

Checks generated theme:

- Required files exist: `style.css`, `functions.php`, `index.php`
- `style.css` has valid theme header
- `theme.json` is valid JSON and conforms to schema
- Block templates are syntactically valid
- Asset references resolve to existing files

### Template Mapping Logic

Maps PageSpec `templateHint` to WordPress template:

| templateHint | WordPress Template | Description |
|--------------|-------------------|-------------|
| `home` | `templates/home.html` or `front-page.php` | Homepage |
| `contact` | `templates/contact.html` | Contact page |
| `landing` | `templates/landing.html` | Landing page |
| `blogIndex` | `templates/archive.html` or `index.php` | Blog index |
| `content` | `templates/page.html` | Standard content page |
| `generic` | `templates/page.html` | Fallback page template |

Template mapping saved to `template-mapping.json` for reference.

### Error Handling & Fallbacks

**Missing PageSpec**: Skip page, log warning
**Null design tokens**: Use WordPress defaults
**Unknown section type**: Fallback to `core/html` with original HTML
**Invalid block syntax**: Wrap in HTML comment, log error
**Asset not found**: Use placeholder or skip, log warning

### Determinism & Reproducibility

- Section order preserved from PageSpec
- Block attribute order consistent
- Pattern slugs generated from signature hash
- Asset filenames preserved from Phase 2
- Color slugs based on frequency order
- Template file naming follows WordPress conventions

### Trade-offs

**Pros**:
- **Hybrid flexibility** - Blocks where appropriate, PHP for complex logic
- **Editor-friendly** - Content sections editable in Gutenberg
- **Maintainable** - Clear separation of content and logic
- **WordPress-native** - Uses core blocks and standard theme structure

**Cons**:
- **Complexity** - More moving parts than pure PHP or pure block approach
- **WordPress version** - Requires 5.9+ for full block theme support
- **Learning curve** - Developers need to understand both blocks and PHP
- **Approximation** - Generated blocks won't perfectly match Wix design

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
