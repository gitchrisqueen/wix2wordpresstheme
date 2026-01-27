# Crawler Module

Playwright-based web crawler for extracting complete Wix site data including structure, styles, assets, and content.

## 📁 Structure

```
crawler/
├── src/                      # Source code (to be implemented)
│   ├── crawler.ts           # Main crawler orchestrator
│   ├── page-scraper.ts      # Individual page scraping logic
│   ├── asset-downloader.ts  # Download images, fonts, etc.
│   ├── style-extractor.ts   # Extract and process CSS
│   ├── dom-analyzer.ts      # Analyze DOM structure
│   └── utils/               # Utility functions
├── output/                   # Crawled data output (generated)
├── downloads/                # Downloaded assets (generated)
├── config.json              # Crawler configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🎯 Purpose

The crawler module is responsible for:

- Navigating Wix websites using headless browser automation
- Discovering all pages through sitemap or navigation analysis
- Extracting DOM structure and content
- Capturing CSS styles (inline and external)
- Downloading all assets (images, fonts, videos, scripts)
- Taking screenshots for visual testing
- Outputting structured data for theme generation

## 🚀 Usage (Not Yet Implemented)

```bash
# From project root
npm run crawl -- --url https://example.wixsite.com/site

# With options
npm run crawl -- --url https://example.wixsite.com/site \
  --output ./crawler/output \
  --headless true \
  --screenshots true
```

## ⚙️ Configuration

The `config.json` file will contain:

- Browser settings (headless, viewport size)
- Crawl behavior (concurrent requests, timeout)
- Asset download options (file types, size limits)
- Output format options

## 📤 Output Format

The crawler will output:

```
output/
├── site-metadata.json    # Site-level information
├── pages/                # Per-page data
│   ├── home.json
│   ├── about.json
│   └── ...
├── styles/               # Extracted CSS
│   ├── global.css
│   └── page-specific/
├── assets/               # Downloaded files
│   ├── images/
│   ├── fonts/
│   └── videos/
└── screenshots/          # Page screenshots
    ├── home.png
    └── ...
```

## 🔧 Technologies

- **Playwright**: Browser automation
- **TypeScript**: Type-safe development
- **Node.js**: Runtime environment

## 📝 Development Status

**Status**: Structure only - no implementation yet

**Next Steps**:

1. Install Playwright and dependencies
2. Implement basic crawler functionality
3. Add page discovery logic
4. Implement asset downloader
5. Add style extraction
6. Create configuration system
7. Add logging and error handling
