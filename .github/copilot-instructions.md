## Mission
You are building a **repeatable, testable** pipeline that converts a Wix site into a **pixel-matching** WordPress theme. Optimize for correctness, reproducibility, and maintainability over cleverness.

## Non-negotiables
- **No hidden manual steps.** Every action must be runnable via scripts.
- **Everything logged.** Each run outputs a timestamped report folder with machine-readable logs.
- **Deterministic outputs.** Same inputs should produce the same artifacts (as much as practical).
- **Tests are first-class.** Visual + structural verification is mandatory.
- **Small, composable modules.** Avoid monolith scripts.

## Tech choices (defaults)
- Node.js + TypeScript for crawler/generator/tests.
- Playwright for crawling + screenshots + regression testing.
- Docker for local WordPress environment.
- Markdown docs for runbooks and architecture.

If you propose alternatives, document the trade-offs in `docs/DECISIONS.md`.

## Repo conventions
- Prefer TypeScript `strict: true`.
- Use `eslint` + `prettier`. No stylistic debates. Use the configured rules.
- Keep all paths and config in `config/` or `*.config.ts` files.
- No secrets in repo. Use `.env.example` and environment variables.
- All scripts must have `--help` and clear error messages.

## Folder responsibilities
- `crawler/`: URL discovery, crawling, snapshots, asset downloading.
- `generator/`: turns crawl output into a theme spec and generates WP theme files.
- `theme/`: generated theme output (gitignored by default if large).
- `wp-env/`: Docker configs to run WP locally and mount theme.
- `tests/`: Playwright tests (visual + DOM + links) and unit tests for parsers.
- `scripts/`: orchestration scripts and developer utilities.
- `docs/`: runbook, architecture, decisions, and report formats.

## Deliverables per stage
### Stage 1: Discovery
- Input: `--baseUrl`
- Output: `crawler/output/manifest.json`
- Must include: URL list, canonical URL, status, discoveredAt, rules used.

### Stage 2: Crawl + Snapshots
For each page:
- Desktop + mobile screenshots
- Rendered HTML snapshot
- Structured DOM snapshot (tree + key attributes)
- Metadata snapshot (title, meta desc, OG tags, headings)
- Asset list + downloaded assets

### Stage 3: Intermediate Spec
- Produce `pagespec.json` per page and `design-tokens.json` global.
- Spec must be validated against a JSON schema.

### Stage 4: Theme Generation
- Generate a valid WordPress theme scaffold + templates per page slug.
- Keep URLs and assets local (theme assets or WP uploads).
- Provide a mapping file that shows how each Wix page maps to WP template(s).

### Stage 5: Verification
- Visual regression tests: Wix vs WP screenshots, with diffs and thresholds.
- DOM/meta tests: headings structure, canonical, nav links, text blocks.
- Link + asset health: no internal 404s, images load, no missing fonts.

### Stage 6: Reporting
Each run creates:
- `docs/REPORTS/<timestamp>/run.json` (machine-readable)
- `docs/REPORTS/<timestamp>/summary.md` (human-readable)
- `docs/REPORTS/<timestamp>/visual-diffs/` (if any)

## Coding guidelines
- Prefer pure functions for parsing/transform steps.
- Use dependency injection for browser/page objects and file IO where reasonable.
- Avoid brittle selectors. When comparing DOM, normalize whitespace and remove Wix-generated volatile attributes.
- Treat network flakiness as expected. Use retries with backoff where appropriate, but log retries.
- Keep performance reasonable. Crawl concurrently but with a safe limit (configurable).

## CLI standards
Every major module exposes a CLI:
- `discover` -> builds manifest
- `crawl` -> builds snapshots/assets
- `spec` -> builds PageSpec/design tokens
- `generate` -> builds theme
- `verify` -> runs tests and produces report
- `run-all` -> orchestrates full pipeline

All CLIs:
- accept `--baseUrl`, `--outDir`, and `--config` where applicable
- support `--dryRun` when meaningful
- exit non-zero on failure
- print next-action hints on error

## Documentation standards
- `README.md`: what it does, prerequisites, quickstart, one-command run.
- `docs/RUNBOOK.md`: exact commands for each stage and troubleshooting.
- `docs/ARCHITECTURE.md`: pipeline diagram, inputs/outputs, data formats.
- `docs/DECISIONS.md`: record key choices and trade-offs.
- Keep docs accurate as code changes. Update in the same PR.

## Pull request hygiene (even if working solo)
When making a change:
- State intent in the commit message.
- Add or update tests when behavior changes.
- Update docs if commands or outputs change.
- Do not mix refactors with feature changes unless necessary.

## Definition of done for this repo
- A developer can run `npm run run-all -- --baseUrl <wix> --wpUrl <localwp>` and get:
  - generated theme
  - local WP running with pages created
  - verification report with visual diffs and pass/fail summary
  - reproducible logs and artifacts

## Safety and compliance
- Respect `robots.txt` by default
- Allow override only with an explicit flag and warning
- Do not scrape credentials or private data
- Support Playwright `storageState` for authenticated pages and document usage
