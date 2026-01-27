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
  │  1. CRAWLER      │  Playwright-based scraper
  │  (Playwright)    │  • Page navigation
  └──────────────────┘  • Asset extraction
         │              • Style capturing
         │              • Content extraction
         ▼
  ┌──────────────────┐
  │  Crawled Data    │  JSON + Assets
  └──────────────────┘
         │
         ▼
  ┌──────────────────┐
  │ 2. THEME GEN     │  Theme builder
  │  (Node.js)       │  • Template generation
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
  │ 3. WP LOCAL      │  Docker environment
  │  (Docker)        │  • WordPress install
  └──────────────────┘  • MySQL database
         │              • Theme deployment
         │              • Plugin support
         ▼
  ┌──────────────────┐
  │ 4. TESTS         │  Quality assurance
  │  (Jest+Playwright)│ • Visual regression
  └──────────────────┘  • DOM validation
         │              • Performance tests
         │              • Accessibility checks
         ▼
  Output: WordPress Theme + Test Report
```

## 🏛️ Component Architecture

### 1. Crawler Module

**Purpose:** Extract complete Wix site data including structure, styles, assets, and content.

**Technology Stack:**
- Playwright (browser automation)
- Node.js (runtime)
- TypeScript (language)

**Key Components:**

```
crawler/
├── src/
│   ├── crawler.ts           # Main crawler orchestrator
│   ├── page-scraper.ts      # Individual page scraping logic
│   ├── asset-downloader.ts  # Download images, fonts, etc.
│   ├── style-extractor.ts   # Extract and process CSS
│   ├── dom-analyzer.ts      # Analyze DOM structure
│   └── utils/
│       ├── logger.ts        # Logging utilities
│       ├── retry.ts         # Retry logic for failed requests
│       └── validator.ts     # Data validation
├── output/                   # Crawled data output directory
├── config.json              # Crawler configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

**Data Flow:**
1. Accept Wix site URL
2. Navigate to site using Playwright
3. Discover all pages (sitemap or navigation)
4. For each page:
   - Capture DOM structure
   - Extract inline and linked styles
   - Download all assets (images, fonts, videos)
   - Extract content (text, metadata)
   - Take screenshots for testing
5. Output structured JSON + asset files

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
      - "8080:80"
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

| Component | Technologies |
|-----------|-------------|
| Crawler | TypeScript, Playwright, Node.js |
| Theme Gen | TypeScript, Node.js, Handlebars |
| WordPress | Docker, WordPress, MySQL, PHP |
| Testing | Jest, Playwright, Pixelmatch |
| Logging | Winston, Morgan |
| Build | npm/yarn, TypeScript compiler |
| CI/CD | GitHub Actions (future) |

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
