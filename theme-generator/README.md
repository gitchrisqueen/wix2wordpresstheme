# Theme Generator Module

**Status**: ✅ Complete (Phase 4)

Converts crawled Wix site data (PageSpec and design tokens) into a WordPress-compatible hybrid theme with proper structure, hooks, and block editor support.

## 🎯 Purpose

The theme generator module is responsible for:

- Loading PageSpec, design tokens, and layout patterns from Phase 3
- Generating a complete WordPress theme with hybrid rendering
- Creating block templates for the Block Editor
- Generating PHP section partials for complex layouts
- Converting design tokens to theme.json
- Creating reusable block patterns
- Managing assets and generating mappings
- Producing comprehensive reports

## 🚀 Usage

### Basic Usage

```bash
# Generate theme from spec output
npm run generate -- --baseUrl https://example.com

# With custom options
npm run generate -- \
  --baseUrl https://example.com \
  --inDir ./crawler/output \
  --outDir ./theme/output \
  --themeName my-custom-theme \
  --mode hybrid \
  --verbose
```

### Options

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

### Rendering Modes

1. **block** - Block-first, fully editable in Block Editor
2. **php** - Classic PHP rendering for pixel-perfect control
3. **hybrid** *(recommended)* - Blocks for simple content, PHP for complex sections

## 📁 Module Structure

```
theme-generator/
├── src/
│   ├── cli/
│   │   └── generate.ts           # CLI entry point
│   ├── generator/                # Core generator modules
│   │   ├── runner.ts             # Main orchestration
│   │   ├── scaffold.ts           # Theme structure creation
│   │   ├── themeJson.ts          # theme.json generation
│   │   ├── blockTemplates.ts     # Block template generation
│   │   ├── phpSections.ts        # PHP section partials
│   │   ├── patterns.ts           # Block pattern generation
│   │   ├── assets.ts             # Asset management
│   │   └── reports.ts            # Report generation
│   ├── types/
│   │   └── generator.ts          # Type definitions
│   └── __tests__/                # Unit tests
├── schemas/
│   └── generation-summary.schema.json  # JSON schema
├── config.json                   # Generator configuration
└── README.md                     # This file
```

## 📤 Output Format

The generator creates a complete WordPress theme:

```
output/<themeName>/
├── style.css                     # Theme header + base styles (WordPress compliant)
├── functions.php                 # Theme setup, hooks, pattern registration
├── header.php                    # Header template with wp_head()
├── footer.php                    # Footer template with wp_footer()
├── theme.json                    # Block editor configuration
├── index.php                     # Required WordPress template with Loop
├── block-templates/
│   ├── page-home.html           # Block template for home page
│   └── page-*.html              # Block templates for other pages
├── patterns/
│   └── *.php                    # Block patterns from layout patterns
├── parts/
│   └── sections/
│       ├── header.php           # Section type templates
│       ├── hero.php
│       ├── footer.php
│       └── ...                  # 11 section types total
├── inc/
│   └── render.php               # Rendering helpers
├── assets/
│   └── imported/                # Copied assets with hashes
└── .generated/
    ├── generation.json          # Full generation metadata
    ├── asset-map.json           # Original URL → theme path mapping
    └── page-mapping.json        # Slug → template → mode mapping
```

Plus summary files:
- `{outDir}/generate-summary.json` - Overall generation statistics
- `docs/REPORTS/<timestamp>/run.json` - Machine-readable report
- `docs/REPORTS/<timestamp>/summary.md` - Human-readable summary

## ⚙️ How It Works

### 1. Input Loading
- Loads manifest.json (list of pages)
- Loads design-tokens.json (colors, fonts, buttons)
- Loads layout-patterns.json (reusable patterns)
- Loads per-page pagespec.json files

### 2. Theme Scaffold Creation
- Creates WordPress theme directory structure
- Generates style.css with theme header
- Creates functions.php with theme setup
- Generates inc/render.php with helper functions
- Creates required index.php template

### 3. theme.json Generation
- Maps design tokens to WordPress theme.json v2
- Color palette from color tokens
- Typography settings from font tokens
- Button styles from component tokens
- Graceful handling of missing values

### 4. Block Template Generation
- Converts each PageSpec to a block template
- Uses WordPress core blocks (group, heading, paragraph, image, buttons)
- Smart PHP fallback for complex sections in hybrid mode
- Deterministic template naming: `page-{slug}.html`

### 5. PHP Section Generation
- Creates PHP partial templates for 11 section types
- Each template receives section data and renders it
- Uses WordPress escaping functions (esc_html, esc_url, esc_attr)
- Supports hybrid rendering (called from block templates)

### 6. Block Pattern Generation
- Converts layout patterns to WordPress block patterns
- Auto-generates titles and descriptions
- Proper WordPress pattern PHP file format
- Categories: hero, content, layout, call-to-action

### 7. Asset Management
- Copies assets from crawler output to theme
- Generates asset-map.json for URL resolution
- Hash-based deduplication
- resolve_asset_url() helper function

### 8. Report Generation
- generation.json with full metadata
- page-mapping.json with slug → template mapping
- generate-summary.json with statistics
- Timestamped reports in docs/REPORTS/

### 9. Theme Validation
- Checks for all required WordPress theme files
- Validates PHP syntax using `php -l` (if PHP available)
- Verifies presence of required WordPress hooks (wp_head, wp_footer)
- Validates theme support declarations
- Reports errors and warnings
- Automated compliance testing

## 🔧 Technologies

- **TypeScript**: Type-safe development
- **Node.js**: Runtime environment
- **PHP Validation**: Syntax checking with php -l
- **fs/path**: File operations
- **WordPress Standards**: Core blocks, theme.json v2, proper escaping

## 📝 Development Status

**Status**: ✅ Complete (2026-01-28)

**Features**:
- [x] CLI command
- [x] Three rendering modes (block, php, hybrid)
- [x] Complete theme scaffold with WordPress compliance
- [x] Block templates with WordPress Loop fallbacks
- [x] PHP section partials (11 types)
- [x] Block patterns
- [x] theme.json generation
- [x] Asset management
- [x] Comprehensive reporting
- [x] Schema validation
- [x] PHP syntax validation
- [x] WordPress compliance tests
- [x] Unit tests
- [x] Documentation

**WordPress Compliance**:
- [x] Required files: style.css, index.php, functions.php, header.php, footer.php
- [x] WordPress hooks: wp_head(), wp_footer()
- [x] Theme support: title-tag, post-thumbnails, menus
- [x] Navigation menu registration
- [x] WordPress Loop with fallback content
- [x] Function name sanitization
- [x] Automated validation

## 🧪 Testing

```bash
# Run all tests (includes theme-generator tests)
npm run test

# Run specific test file
npm run test theme-generator/src/__tests__/generator-modules.test.ts

# Run WordPress compliance tests
npm run test theme-generator/src/__tests__/theme-compliance.test.ts
```

**Test Coverage**: 2 test suites (18 tests total), all passing
- generator-modules.test.ts: 6 module export tests
- theme-compliance.test.ts: 12 WordPress compliance tests

## 📚 Documentation

- [README.md](../../README.md) - Main project README with Phase 4 section
- [RUNBOOK.md](../../RUNBOOK.md) - Operational guide with troubleshooting
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Technical architecture
- [docs/DECISIONS.md](../../docs/DECISIONS.md) - Design decisions
- [PHASE4-SUMMARY.md](../../PHASE4-SUMMARY.md) - Phase 4 completion summary

## 🎓 Examples

### Example 1: Basic Theme Generation

```bash
npm run generate -- --baseUrl https://example.com
```

Generates a hybrid theme with default settings in `theme/output/wix2wp/`

### Example 2: Block-Only Theme

```bash
npm run generate -- \
  --baseUrl https://example.com \
  --mode block \
  --themeName my-block-theme
```

Generates a fully block-based theme (maximum editability)

### Example 3: PHP-Only Theme

```bash
npm run generate -- \
  --baseUrl https://example.com \
  --mode php \
  --themeName pixel-perfect
```

Generates a PHP-based theme (maximum fidelity)

### Example 4: Custom Configuration

```bash
npm run generate -- \
  --baseUrl https://example.com \
  --inDir ./custom-spec \
  --outDir ./custom-output \
  --themeName branded-theme \
  --mode hybrid \
  --emitPatterns true \
  --emitThemeJson true \
  --verbose
```

Full control over all options with verbose logging

## 🤝 Contributing

This module follows the project's TypeScript and WordPress coding standards. All changes should:
- Pass TypeScript strict mode compilation
- Pass ESLint checks
- Include appropriate tests
- Update documentation
- Follow WordPress best practices

## 🔗 Related Modules

- **crawler** (Phase 1 & 2): URL discovery and page crawling
- **spec** (Phase 3): PageSpec and design token extraction
- **tests** (Phase 5): Visual regression and validation (coming soon)

