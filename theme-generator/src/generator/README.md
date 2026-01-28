# Generator Modules Documentation

This directory contains the core generator modules for converting crawled Wix data into a WordPress theme.

## Module Overview

### 1. blockTemplates.ts
Generates WordPress block templates from PageSpec data.

**Export:**
```typescript
generateBlockTemplates(
  themeDir: string,
  pageSpec: PageSpec,
  mode: GeneratorMode,
  assetMap: Map<string, string>,
  metadata: GenerationMetadata,
  logger: Logger
): BlockTemplateResult
```

**Features:**
- Supports three generation modes: `block`, `hybrid`, `php`
- Generates HTML block template files in `block-templates/page-{slug}.html`
- Uses WordPress core blocks: `wp:group`, `wp:heading`, `wp:paragraph`, `wp:image`, `wp:buttons`
- In hybrid mode, inserts PHP fallback for complex sections
- Tracks PHP fallback usage in metadata

**Output:**
- Files: `block-templates/page-{slug}.html`
- Returns: `{ templatePath, mode }`

---

### 2. phpSections.ts
Generates PHP section partial templates for WordPress theme.

**Export:**
```typescript
generatePHPSections(
  themeDir: string,
  mode: GeneratorMode,
  metadata: GenerationMetadata,
  logger: Logger
): void
```

**Features:**
- Creates PHP templates for 11 section types:
  - `header`, `hero`, `footer`, `cta`, `contactForm`
  - `featureGrid`, `gallery`, `testimonial`, `pricing`
  - `faq`, `richText`
- Each template uses WordPress escaping functions
- Templates expect `$section` variable with section data
- Uses helper functions from `inc/render.php`

**Output:**
- Files: `parts/sections/{sectionType}.php`
- All templates include proper escaping: `esc_html()`, `esc_url()`, `esc_attr()`

---

### 3. patterns.ts
Generates WordPress block patterns from layout pattern data.

**Export:**
```typescript
generateBlockPatterns(
  themeDir: string,
  layoutPatterns: LayoutPatterns | null,
  metadata: GenerationMetadata,
  logger: Logger
): void
```

**Features:**
- Converts layout patterns to WordPress block patterns
- Auto-generates pattern title and description from pattern stats
- Maps section types to appropriate WordPress categories
- Handles pattern statistics (heading count, text count, media count, CTA count)
- Updates `metadata.patternsEmitted`

**Output:**
- Files: `patterns/{patternId}.php`
- Registered with categories: `hero`, `content`, `layout`, `call-to-action`, etc.

---

### 4. assets.ts
Handles asset copying and asset map generation.

**Exports:**
```typescript
copyAssets(
  inDir: string,
  themeDir: string,
  manifest: Manifest,
  logger: Logger
): Map<string, string>

generateAssetMap(
  themeDir: string,
  assetMap: Map<string, string>,
  logger: Logger
): void
```

**Features:**
- Copies assets from crawler output to theme directory
- Maintains original filenames with MD5 hash suffix
- Maps original URLs to theme asset paths
- Handles missing assets gracefully
- Generates `.generated/asset-map.json`

**Output:**
- Files: `assets/imported/{filename}-{hash}{ext}`
- Map: `.generated/asset-map.json`

**Additional Functions:**
- `copySingleAsset()` - Copy a single asset file
- `resolveAssetUrl()` - Resolve asset URL to local theme path
- `getAssetType()` - Determine asset type from extension

---

### 5. reports.ts
Generates generation reports and summaries.

**Export:**
```typescript
generateReports(
  options: GeneratorOptions,
  themeDir: string,
  pageMappings: PageTemplateMapping[],
  metadata: GenerationMetadata,
  pageSpecs: Map<string, PageSpec>,
  logger: Logger
): void
```

**Features:**
- Generates 4 types of reports:
  1. `.generated/generation.json` - Full generation metadata
  2. `.generated/page-mapping.json` - Page to template mappings
  3. `{outDir}/generate-summary.json` - Summary in output directory
  4. `docs/REPORTS/{timestamp}/run.json` and `summary.md` - Comprehensive report

**Output:**
- **generation.json**: Version, timestamp, options, metadata
- **page-mapping.json**: Slug to template mappings
- **generate-summary.json**: GenerationSummary schema
- **run.json**: Machine-readable report with all details
- **summary.md**: Human-readable markdown report with tables and next steps

---

## Usage Example

```typescript
import { Logger, LogLevel } from '../../../crawler/src/lib/logger.js';
import { generateBlockTemplates } from './blockTemplates';
import { generatePHPSections } from './phpSections';
import { generateBlockPatterns } from './patterns';
import { copyAssets, generateAssetMap } from './assets';
import { generateReports } from './reports';

const logger = new Logger(LogLevel.INFO);
const themeDir = '/path/to/theme';
const metadata: GenerationMetadata = {
  mode: 'hybrid',
  pagesRendered: 0,
  patternsEmitted: 0,
  phpFallbacksUsed: 0,
  warnings: [],
  timestamp: new Date().toISOString(),
};

// 1. Generate block templates for each page
const result = generateBlockTemplates(
  themeDir,
  pageSpec,
  'hybrid',
  assetMap,
  metadata,
  logger
);

// 2. Generate PHP section templates
generatePHPSections(themeDir, 'hybrid', metadata, logger);

// 3. Generate block patterns
generateBlockPatterns(themeDir, layoutPatterns, metadata, logger);

// 4. Copy assets and generate map
const assetMap = copyAssets(inDir, themeDir, manifest, logger);
generateAssetMap(themeDir, assetMap, logger);

// 5. Generate reports
generateReports(options, themeDir, pageMappings, metadata, pageSpecs, logger);
```

---

## Design Patterns

### Error Handling
All modules handle errors gracefully:
- Log warnings for non-critical failures
- Add warnings to metadata
- Continue processing remaining items
- Never throw unhandled exceptions

### Logging
All modules use structured logging:
- `logger.info()` - Major steps completed
- `logger.debug()` - Detailed operations
- `logger.warn()` - Non-critical issues

### Determinism
All modules are designed to be deterministic:
- Same input → same output (where possible)
- File hashing ensures consistent naming
- Timestamps use ISO format

### WordPress Best Practices
- All PHP uses proper escaping functions
- Block templates follow WordPress block editor syntax
- Pattern registration includes proper metadata
- Section templates use WordPress template hierarchy

---

## File Structure

```
theme-generator/src/generator/
├── assets.ts           # Asset copying and mapping
├── blockTemplates.ts   # WordPress block template generation
├── patterns.ts         # WordPress block pattern generation
├── phpSections.ts      # PHP section template generation
├── reports.ts          # Report and summary generation
├── runner.ts           # Main generator orchestration
├── scaffold.ts         # Theme scaffold creation
└── themeJson.ts        # theme.json generation
```

---

## Testing

Smoke tests verify all modules export expected functions:

```bash
npm test -- theme-generator/src/__tests__/generator-modules.test.ts
```

---

## Next Steps

1. **Integration**: Wire these modules into `runner.ts`
2. **End-to-End Tests**: Test full generation pipeline
3. **Visual Tests**: Compare generated output with original site
4. **Documentation**: Update main README with usage examples
