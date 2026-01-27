/**
 * Crawl Runner
 *
 * Orchestrates concurrent page crawling with queue management.
 */

import { chromium, type Browser } from 'playwright';
import type { Manifest } from '../types/manifest.js';
import type { CrawlConfig, CrawlResult, CrawlSummary, BreakpointConfig } from '../types/crawl.js';
import { capturePage, type PageCaptureOptions } from './pageCapture.js';
import { uniqueSlug } from '../lib/slug.js';
import { writeJsonFile } from '../lib/fileio.js';
import { join } from 'path';
import type { Logger } from '../lib/logger.js';

export interface RunnerResult {
  summary: CrawlSummary;
  errors: CrawlResult[];
}

/**
 * Run crawl on all pages from manifest
 */
export async function runCrawl(
  manifest: Manifest,
  config: CrawlConfig,
  logger: Logger
): Promise<RunnerResult> {
  const startTime = new Date();
  logger.info(`Starting crawl of ${manifest.pages.length} pages`);

  // Parse breakpoints
  const breakpoints = parseBreakpoints(config.breakpoints);

  // Limit pages if maxPages specified
  let pages = manifest.pages;
  if (config.maxPages && config.maxPages < pages.length) {
    logger.info(`Limiting to ${config.maxPages} pages (out of ${pages.length})`);
    pages = pages.slice(0, config.maxPages);
  }

  // Generate unique slugs
  const slugs = new Set<string>();
  const pageConfigs: PageCaptureOptions[] = pages.map((page) => {
    const slug = uniqueSlug(page.url, slugs);
    slugs.add(slug);

    return {
      url: page.url,
      slug,
      outputDir: config.outDir,
      config,
      breakpoints,
      logger,
    };
  });

  // Launch browser
  logger.info('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    // Process pages with concurrency
    const results = await processQueue(browser, pageConfigs, config.concurrency, logger);

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    // Build summary
    const successful = results.filter((r) => r.status === 'success');
    const failed = results.filter((r) => r.status === 'failed');
    const skipped = results.filter((r) => r.status === 'skipped');

    const summary: CrawlSummary = {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      baseUrl: config.baseUrl,
      config: {
        maxPages: config.maxPages || null,
        concurrency: config.concurrency,
        timeoutMs: config.timeoutMs,
        retries: config.retries,
        breakpoints: config.breakpoints,
        downloadAssets: config.downloadAssets,
      },
      stats: {
        totalPages: pages.length,
        successful: successful.length,
        failed: failed.length,
        skipped: skipped.length,
        totalAssets: 0, // TODO: aggregate from page results
        assetsDownloaded: 0,
      },
      results,
    };

    // Write summary
    await writeJsonFile(join(config.outDir, 'crawl-summary.json'), summary);
    logger.info(`Crawl summary written to: ${join(config.outDir, 'crawl-summary.json')}`);

    // Write errors if any
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      await writeJsonFile(join(config.outDir, 'crawl-errors.json'), errors);
      logger.warn(`${errors.length} pages failed, details in crawl-errors.json`);
    }

    logger.info(`Crawl completed: ${successful.length} successful, ${failed.length} failed`);

    return { summary, errors };
  } finally {
    await browser.close();
  }
}

/**
 * Process pages in queue with concurrency limit
 */
async function processQueue(
  browser: Browser,
  pageConfigs: PageCaptureOptions[],
  concurrency: number,
  logger: Logger
): Promise<CrawlResult[]> {
  const results: CrawlResult[] = [];
  const queue = [...pageConfigs];

  // Worker function
  async function worker() {
    while (queue.length > 0) {
      const pageConfig = queue.shift();
      if (!pageConfig) break;

      // Create new context for isolation
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
      });

      await context.addInitScript(() => {
        // Ensure tsx/esbuild __name helper is available in all pages.
        // eslint-disable-next-line no-var
        var __name = (target, value) => target;
        // @ts-ignore - expose on global for strict mode lookups
        globalThis.__name = __name;
      });

      try {
        const result = await capturePage(context, pageConfig);

        results.push({
          url: result.url,
          slug: result.slug,
          status: result.success ? 'success' : 'failed',
          error: result.success ? null : result.error,
          duration: result.duration,
          outputPath: result.success ? result.outputPath : null,
        });
      } catch (error) {
        logger.error(`Unexpected error for ${pageConfig.url}: ${error}`);

        results.push({
          url: pageConfig.url,
          slug: pageConfig.slug,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
          duration: 0,
          outputPath: null,
        });
      } finally {
        await context.close();
      }
    }
  }

  // Start workers
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return results;
}

/**
 * Parse breakpoint names to configs
 */
function parseBreakpoints(breakpointNames: string[]): BreakpointConfig[] {
  const BREAKPOINTS: Record<string, BreakpointConfig> = {
    mobile: { name: 'mobile', width: 375, height: 667 },
    tablet: { name: 'tablet', width: 768, height: 1024 },
    desktop: { name: 'desktop', width: 1920, height: 1080 },
  };

  return breakpointNames
    .map((name) => BREAKPOINTS[name.toLowerCase()])
    .filter((bp): bp is BreakpointConfig => bp !== undefined);
}
