# Technical Decisions

This document records key technical decisions made during the development of the wix2wordpresstheme project, along with the rationale and trade-offs.

## Phase 1: Discovery

### Decision: Sitemap-First Discovery with Crawl Fallback

**Date**: 2026-01-27

**Context**: We need a reliable method to discover all pages on a Wix site.

**Decision**: Use a sitemap-first approach, falling back to lightweight crawling if no sitemap is found or the sitemap is empty.

**Rationale**:

- **Sitemaps are authoritative** - When available, they provide the canonical list of pages intended for indexing
- **Performance** - Parsing sitemaps is much faster than crawling
- **Completeness** - Sitemaps typically include all important pages
- **Crawl as backup** - Some sites don't have sitemaps or have incomplete ones, so crawling ensures we don't miss pages

**Trade-offs**:

- Sitemaps may be outdated or incomplete
- Crawling is slower and more resource-intensive
- Crawling may discover pages not meant for indexing

**Alternatives Considered**:

1. **Crawl-only approach**: More complete but slower and may discover too many irrelevant pages
2. **Sitemap-only approach**: Faster but would fail for sites without sitemaps

### Decision: Lightweight Fetch + Cheerio for Fallback Crawl (No Playwright Yet)

**Date**: 2026-01-27

**Context**: We need to implement crawling for sites without sitemaps, but we also want to keep Phase 1 simple and fast.

**Decision**: Use `fetch` + `cheerio` for the fallback crawler in Phase 1, deferring Playwright-based crawling to Phase 2.

**Rationale**:

- **Simplicity** - fetch + cheerio is much simpler than Playwright
- **Performance** - No browser overhead means faster discovery
- **Sufficient for Phase 1** - We only need URL discovery, not full page rendering or asset extraction
- **Phase 2 readiness** - We can switch to Playwright in Phase 2 when we need to capture screenshots and rendered DOM

**Trade-offs**:

- Won't discover pages that require JavaScript to render navigation
- May miss dynamically loaded content
- Can't handle sites with heavy client-side routing

**Alternatives Considered**:

1. **Playwright from the start**: More powerful but adds complexity and overhead to Phase 1
2. **No fallback crawl**: Simpler but would fail for sites without sitemaps

**TODO for Phase 2**: Implement Playwright-based crawl for full page rendering and snapshot capture.

### Decision: Respect robots.txt by Default

**Date**: 2026-01-27

**Context**: We need to decide whether to respect robots.txt directives.

**Decision**: Respect robots.txt by default with an explicit `--respectRobots false` flag to override.

**Rationale**:

- **Ethical crawling** - Respecting robots.txt is the right thing to do
- **Avoid blocking** - Sites may block crawlers that don't respect robots.txt
- **Flexibility** - Allow override for users who own the site or have permission
- **Best practice** - Following web standards and conventions

**Trade-offs**:

- Some pages may be excluded that the user wants to include
- Requires an additional HTTP request to fetch robots.txt

**Alternatives Considered**:

1. **Always respect robots.txt (no override)**: Too restrictive for users who own the site
2. **Never respect robots.txt**: Unethical and may cause issues

### Decision: Normalize URLs with Configurable Query Handling

**Date**: 2026-01-27

**Context**: URLs need to be deduplicated and normalized to avoid processing the same page multiple times.

**Decision**: Normalize URLs by default (lowercase, remove trailing slashes, strip query strings) with a `--keepQuery` flag to preserve query strings when needed.

**Rationale**:

- **Deduplication** - Many URLs point to the same content (e.g., `/page` and `/page/`)
- **Performance** - Fewer duplicate pages to process
- **Query strings often irrelevant** - Most query strings are for tracking or session management
- **Flexibility** - Allow keeping query strings for sites that use them for content differentiation

**Trade-offs**:

- May lose some pages that differ only by query string
- Requires careful handling of query-based routing

**Alternatives Considered**:

1. **Always keep query strings**: Would result in many duplicates
2. **Never keep query strings**: Would miss pages on query-based sites

### Decision: Use Zod for Runtime Validation

**Date**: 2026-01-27

**Context**: We need to validate the manifest structure at runtime.

**Decision**: Use Zod for runtime type validation and JSON Schema for documentation.

**Rationale**:

- **Type safety** - Zod provides TypeScript types from schemas
- **Runtime validation** - Catches errors before writing invalid manifests
- **Developer experience** - Clear error messages when validation fails
- **JSON Schema compatibility** - We can maintain both for different use cases

**Trade-offs**:

- Adds a dependency
- Requires maintaining both Zod schemas and JSON Schema

**Alternatives Considered**:

1. **AJV only**: More standard but less TypeScript integration
2. **TypeScript types only**: No runtime validation
3. **Manual validation**: Error-prone and harder to maintain

### Decision: BFS Crawl with Configurable Depth and Page Limits

**Date**: 2026-01-27

**Context**: Crawling needs bounds to prevent infinite loops and excessive resource usage.

**Decision**: Use breadth-first search (BFS) with configurable `--maxDepth` (default 2) and `--maxPages` (default 500).

**Rationale**:

- **BFS is systematic** - Discovers pages in order of distance from homepage
- **Depth limit prevents deep rabbit holes** - Most important pages are within 2-3 clicks
- **Page limit prevents runaway** - Protects against very large sites
- **Configurable** - Users can adjust for their specific needs

**Trade-offs**:

- May not discover all pages on very large or deep sites
- BFS may be slower than DFS for finding specific pages

**Alternatives Considered**:

1. **Depth-first search (DFS)**: Could go very deep before discovering broad content
2. **No limits**: Could run forever on large sites or infinite loops

### Decision: Filter Out Common Non-Page Resources

**Date**: 2026-01-27

**Context**: Crawlers often discover many non-page URLs (images, PDFs, etc.) that we don't want to process.

**Decision**: Maintain an exclusion list of common file extensions and path prefixes (admin, API, etc.).

**Rationale**:

- **Focus on pages** - We only want HTML pages, not assets
- **Performance** - Skipping assets saves time and bandwidth
- **Practical** - Most sites follow common patterns for assets and admin paths

**Trade-offs**:

- May miss some edge cases where pages have unusual extensions
- Hardcoded list may need updates over time

**Alternatives Considered**:

1. **Content-type detection**: Would require HEAD requests for every URL, slowing discovery
2. **No filtering**: Would include many irrelevant URLs

### Decision: CLI-First with Commander.js

**Date**: 2026-01-27

**Context**: We need a user-friendly way to run discovery.

**Decision**: Build a CLI using Commander.js with clear help text and examples.

**Rationale**:

- **Scriptability** - CLI is easy to automate and integrate
- **Standard interface** - Follows Unix conventions
- **Commander.js is mature** - Well-tested and widely used
- **Good help output** - Makes the tool self-documenting

**Trade-offs**:

- Not as user-friendly as a GUI for non-technical users
- Requires users to have Node.js installed

**Alternatives Considered**:

1. **Web UI**: More user-friendly but adds complexity
2. **Programmatic API**: Flexible but less accessible
3. **Configuration file only**: Less flexible for one-off runs

## General Decisions

### Decision: TypeScript with Strict Mode

**Date**: 2026-01-27

**Context**: We need to choose a language and type system.

**Decision**: Use TypeScript with `strict: true` and additional strict checks.

**Rationale**:

- **Type safety** - Catches errors at compile time
- **Better IDE support** - IntelliSense, refactoring, etc.
- **Self-documenting** - Types serve as inline documentation
- **JavaScript interop** - Can use any npm package

**Trade-offs**:

- Slightly more verbose than plain JavaScript
- Requires build step

**Alternatives Considered**:

1. **Plain JavaScript**: Simpler but less safe
2. **Other languages (Python, Go)**: Would require more setup and different ecosystem

### Decision: Vitest for Testing

**Date**: 2026-01-27

**Context**: We need a testing framework.

**Decision**: Use Vitest for unit tests.

**Rationale**:

- **Fast** - Faster than Jest for most use cases
- **ESM native** - Better support for ES modules
- **Vite ecosystem** - Compatible with Vite if we add a UI later
- **Jest-compatible API** - Easy migration path from Jest

**Trade-offs**:

- Newer than Jest, less mature
- Smaller community and fewer resources

**Alternatives Considered**:

1. **Jest**: More mature but slower and ESM support is awkward
2. **Mocha/Chai**: Older but less integrated

### Decision: ESLint + Prettier for Code Quality

**Date**: 2026-01-27

**Context**: We need consistent code style and quality checks.

**Decision**: Use ESLint for linting and Prettier for formatting, with TypeScript ESLint plugin.

**Rationale**:

- **Industry standard** - Most TypeScript projects use this combination
- **Separation of concerns** - ESLint for quality, Prettier for style
- **Configurable** - Can adjust rules to match team preferences
- **IDE integration** - Works with VS Code, WebStorm, etc.

**Trade-offs**:

- Configuration can be complex
- Requires discipline to run before committing

**Alternatives Considered**:

1. **ESLint only**: Can't format as well as Prettier
2. **Prettier only**: Can't catch logic errors
3. **TSLint**: Deprecated in favor of ESLint

---

## Phase 2: Crawl + Snapshots

### Decision: Playwright for Page Capture

**Date**: 2026-01-27

**Context**: Need to capture full page snapshots including screenshots, rendered HTML, and dynamic content.

**Decision**: Use Playwright (Chromium) for Phase 2 page capture.

**Rationale**:

- **Full browser environment** - Can execute JavaScript and capture fully rendered pages
- **Screenshot capability** - Built-in screenshot API with viewport control
- **Multiple viewports** - Easy to capture desktop, mobile, and tablet views
- **Network control** - Can intercept and monitor network requests for asset discovery
- **Mature and maintained** - Industry-standard tool with good TypeScript support
- **Headless by default** - No GUI overhead in production

**Trade-offs**:

- **Resource intensive** - Requires more CPU/memory than simple HTTP requests
- **Slower** - Browser startup and page load take longer than fetch
- **Binary dependencies** - Requires browser binaries to be installed

**Alternatives Considered**:

1. **Puppeteer**: Similar to Playwright but Playwright has better API and cross-browser support
2. **jsdom**: Lighter but can't handle complex sites or capture screenshots
3. **Static HTTP + Cheerio**: Too limited for dynamic sites and visual capture

### Decision: Concurrent Page Processing with Context Isolation

**Date**: 2026-01-27

**Context**: Need to balance speed with resource usage when crawling multiple pages.

**Decision**: Use a single browser instance with multiple isolated contexts, processed by a worker pool.

**Rationale**:

- **Performance** - Concurrent processing is much faster than sequential
- **Resource efficiency** - One browser instance is cheaper than multiple instances
- **Isolation** - Separate contexts prevent state leakage between pages
- **Memory management** - Close contexts after each page to prevent memory leaks
- **Configurable** - Allow users to tune concurrency based on their resources

**Trade-offs**:

- **Complexity** - More complex than sequential processing
- **Memory usage** - Can use significant memory with high concurrency
- **Failure isolation** - One page crash doesn't affect others

**Configuration**: Default concurrency of 3, configurable via `--concurrency`

### Decision: Network Idle Wait Strategy with Fallback

**Date**: 2026-01-27

**Context**: Pages need time to fully render before capture, but timeout behavior varies.

**Decision**: Use `networkidle` as primary wait strategy with automatic fallback to `domcontentloaded` on retry.

**Rationale**:

- **Completeness** - `networkidle` ensures most dynamic content has loaded
- **Reliability** - Fallback prevents complete failure on slow/flaky pages
- **Configurable settle time** - Additional wait after navigation allows for final rendering
- **Logged downgrades** - Track when fallback is used for debugging

**Trade-offs**:

- **Slower** - `networkidle` takes longer than simpler strategies
- **Not perfect** - Some lazy-loaded content may still be missed
- **Timeouts possible** - Sites with ongoing network activity may never reach idle

**Configuration**: Default `waitUntil: 'networkidle'` with `settleMs: 750`

### Decision: Structured DOM Snapshot vs Full HTML

**Date**: 2026-01-27

**Context**: Need machine-readable DOM structure for later analysis while preserving full HTML.

**Decision**: Capture both rendered HTML (verbatim) and structured DOM (pruned JSON).

**Rationale**:

- **Rendered HTML** - Preserves exact output for debugging and fallback
- **Structured DOM** - Enables programmatic analysis and comparison
- **Pruned tree** - Removes scripts, styles, and SVGs to reduce size
- **Normalized** - Consistent whitespace and attribute ordering
- **Hashable** - Can detect structural changes between versions

**Attributes captured**: `id`, `class`, `href`, `src`, `srcset`, `alt`, `role`, `aria-label`, `name`, `type`, `rel`, `title`

**Trade-offs**:

- **Storage** - Two representations take more space
- **Processing** - Requires serialization logic in browser context
- **Maintenance** - Need to keep attribute list updated

**Future**: May add CSS computed styles in Phase 3 for design token extraction

### Decision: Hash-Based Asset Deduplication

**Date**: 2026-01-27

**Context**: Multiple pages may reference the same assets, causing redundant downloads.

**Decision**: Use SHA-256 hash-based file naming for downloaded assets with URL-based deduplication.

**Rationale**:

- **Deduplication** - Same asset from different pages downloaded only once
- **Integrity** - SHA-256 verifies file hasn't been corrupted
- **Collision resistance** - Hash-based naming prevents filename conflicts
- **Deterministic** - Same content always gets same filename

**Implementation**:

- Normalize asset URLs
- Track seen URLs to avoid duplicate requests
- Use short hash (12 chars) for file naming: `{shortHash}.{ext}`
- Store full SHA-256 in manifest for verification

**Trade-offs**:

- **Complexity** - More logic than simple sequential naming
- **Different URLs** - Same content from different CDN URLs downloaded twice (acceptable trade-off)

### Decision: Same-Origin Asset Policy with Opt-In Third-Party

**Date**: 2026-01-27

**Context**: Sites reference assets from multiple domains (CDNs, external services).

**Decision**: Download only same-origin assets by default, with explicit flag for third-party assets.

**Rationale**:

- **Privacy** - Avoid unintentional downloading of tracking pixels or analytics scripts
- **Relevance** - Same-origin assets are more likely to be site-specific
- **Size control** - Third-party assets (ads, social widgets) can be large
- **Opt-in** - Users can enable third-party if needed for their use case

**Trade-offs**:

- **Incomplete** - May miss essential CDN-hosted assets
- **Configuration burden** - Users must know if they need third-party assets

**Future**: May add allowlist for known good CDNs (Google Fonts, etc.)

### Decision: Per-Page Folder Structure

**Date**: 2026-01-27

**Context**: Need organized, consistent output structure for hundreds of pages.

**Decision**: Create a folder per page slug with standardized subfolders.

**Rationale**:

- **Organization** - Easy to find artifacts for a specific page
- **Atomicity** - Each page is self-contained
- **Parallelism** - Safe concurrent writes to different page folders
- **Slugs** - Stable, filesystem-safe identifiers from URL paths
- **Uniqueness** - Hash suffix added if slug collision occurs

**Structure**:
```
pages/<slug>/
├── page.json
├── html/rendered.html
├── dom/dom.json
├── meta/meta.json
├── screenshots/desktop.png
└── assets/manifest.json
```

**Trade-offs**:

- **Depth** - Creates many nested directories
- **Duplication** - Some assets stored multiple times if not deduplicated

###  Decision: JSON Schema Validation for All Outputs

**Date**: 2026-01-27

**Context**: Outputs must be machine-readable and consistent across runs.

**Decision**: Define JSON schemas for all output formats and validate before writing.

**Rationale**:

- **Contract** - Clear specification of output format
- **Validation** - Catch errors before writing invalid files
- **Evolution** - Schema versioning allows controlled format changes
- **Documentation** - Schema serves as format documentation

**Schemas**: `meta.schema.json`, `dom.schema.json`, `assets-manifest.schema.json`, `crawl-summary.schema.json`

**Trade-offs**:

- **Overhead** - Schema validation adds small performance cost
- **Maintenance** - Schemas must be kept in sync with code

---

## 13. Heuristic-Based Section Inference (Phase 3)

**Date**: 2026-01-27

**Context**: Need to convert unstructured HTML into typed page sections without AI/ML.

**Decision**: Use rule-based heuristics for section type inference: semantic HTML tags, landmark roles, class names, content patterns, and structural hints.

**Rationale**:

- **Deterministic** - Same input always produces same output
- **Debuggable** - Clear rules make issues easy to diagnose
- **Fast** - No model inference or API calls
- **Conservative** - Use "unknown" type when uncertain
- **Maintainable** - Rules can be adjusted based on real-world results

**Heuristics**:

- Semantic tags: `<header>` → header, `<footer>` → footer
- Role attributes: `role="banner"` → header
- Class patterns: `.hero` → hero, `.pricing` → pricing
- Content patterns: h1 + CTA + image → hero, multiple images → gallery
- Form presence: `<form>` → contactForm

**Trade-offs**:

- **Limited accuracy** - Heuristics miss edge cases vs ML models
- **Manual tuning** - Rules require adjustment for different sites
- **Conservative** - Many sections classified as "unknown"
- **No context** - Cannot understand semantic meaning of content

---

## 14. Conservative Design Token Extraction (Phase 3)

**Date**: 2026-01-27

**Context**: Extract design tokens without computed styles or browser context.

**Decision**: Extract only from inline styles, CSS variables, and `<style>` tags. Output null for tokens we cannot reliably infer.

**Rationale**:

- **Honest** - Better to return null than wrong value
- **Debuggable** - Sources are explicit in metadata
- **Deterministic** - Same HTML produces same tokens
- **Extensible** - Can add browser-based extraction later

**Extraction methods**:

- Inline styles: `style="color: #ff0000"`
- CSS variables: `:root { --primary: #ff0000 }`
- Style tags: `<style>` content parsing
- Button detection: `<button>`, `<a role="button">`, `.button` classes

**Trade-offs**:

- **Limited coverage** - Misses computed styles from external CSS
- **Incomplete** - Many tokens will be null
- **Manual work** - May require designer input to fill gaps

---

## 15. Pattern Detection by Signature (Phase 3)

**Date**: 2026-01-27

**Context**: Identify reusable layout patterns across pages.

**Decision**: Generate signatures based on section structure (type + content counts) and cluster sections with identical signatures.

**Rationale**:

- **Simple** - No complex clustering algorithms
- **Fast** - Hash-based grouping is O(n)
- **Deterministic** - Same sections always group together
- **Actionable** - Patterns can inform theme template reuse

**Signature components**:

- Section type
- Heading presence (yes/no)
- Text block count (bucketed: 0, 1, few, many)
- Media count (bucketed)
- CTA count (bucketed)

**Trade-offs**:

- **Coarse** - Similar but not identical sections won't match
- **No semantic understanding** - Doesn't consider content meaning
- **Bucketing loss** - "few" vs "many" loses precision

---

## Future Decisions (To Be Made)

- Phase 4: WordPress theme template generation approach
- Phase 5: Visual diff testing tools and thresholds
- Storage strategy for large asset collections
- Caching strategy for incremental crawls
