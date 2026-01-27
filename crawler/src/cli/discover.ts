#!/usr/bin/env node
/**
 * Discover CLI Command
 *
 * Main entry point for URL discovery.
 */

import { Command } from 'commander';
import { Logger, LogLevel } from '../lib/logger.js';
import { SitemapParser } from '../discovery/sitemap.js';
import { FallbackCrawler } from '../discovery/crawl.js';
import { normalizeUrl, getUrlPath } from '../lib/url.js';
import { ReportGenerator, writeJsonFile } from '../lib/report.js';
import type { Manifest, Page } from '../types/manifest.js';
import { validateManifest } from '../types/manifest.js';
import { join } from 'path';

interface DiscoverOptions {
  baseUrl: string;
  outDir: string;
  respectRobots: boolean;
  maxDepth: number;
  maxPages: number;
  keepQuery: boolean;
  includeUnreachable: boolean;
  verbose: boolean;
}

async function runDiscover(options: DiscoverOptions) {
  const logger = new Logger(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);
  const reportGen = new ReportGenerator(logger);

  logger.info('=== Wix2WordPress Discovery ===');
  logger.info(`Base URL: ${options.baseUrl}`);
  logger.info(`Output: ${options.outDir}`);
  logger.info(`Respect robots.txt: ${options.respectRobots}`);

  try {
    // Step 1: Normalize base URL
    logger.info('Step 1: Normalizing base URL...');
    const normalizedBase = normalizeUrl(options.baseUrl, {
      stripQuery: false,
      stripFragment: true,
      removeTrailingSlash: false,
    });
    logger.info(`Normalized base URL: ${normalizedBase}`);

    // Step 2: Try sitemaps first
    logger.info('Step 2: Discovering sitemaps...');
    const sitemapParser = new SitemapParser(logger);
    const sitemapResult = await sitemapParser.discoverSitemaps(normalizedBase);

    logger.info(`Sitemaps tried: ${sitemapResult.sitemapsTried.length}`);
    logger.info(`URLs from sitemap: ${sitemapResult.urls.length}`);

    // Step 3: Fallback crawl if needed
    let crawlResult: { urls: Array<{ url: string; depth: number; status: number | null }> } = {
      urls: [],
    };
    let discoveryMethod: 'sitemap' | 'crawl' | 'hybrid' =
      sitemapResult.method === 'sitemap' ? 'sitemap' : 'crawl';

    if (sitemapResult.urls.length === 0) {
      logger.info('Step 3: Sitemap empty or not found. Starting fallback crawl...');
      const crawler = new FallbackCrawler(logger, {
        maxDepth: options.maxDepth,
        maxPages: options.maxPages,
        keepQuery: options.keepQuery,
        respectRobots: options.respectRobots,
      });

      crawlResult = await crawler.crawl(normalizedBase);
      discoveryMethod = 'crawl';
      logger.info(`Crawl complete: ${crawlResult.urls.length} pages found`);
    } else if (options.maxDepth > 0) {
      // Hybrid: sitemap + crawl for completeness
      logger.info('Step 3: Running supplemental crawl for completeness...');
      const crawler = new FallbackCrawler(logger, {
        maxDepth: Math.min(1, options.maxDepth),
        maxPages: Math.max(100, options.maxPages - sitemapResult.urls.length),
        keepQuery: options.keepQuery,
        respectRobots: options.respectRobots,
      });

      crawlResult = await crawler.crawl(normalizedBase);
      if (crawlResult.urls.length > 0) {
        discoveryMethod = 'hybrid';
      }
      logger.info(`Supplemental crawl: ${crawlResult.urls.length} additional pages`);
    }

    // Step 4: Check status for sitemap URLs if needed
    logger.info('Step 4: Validating URLs...');
    const pages: Page[] = [];

    // Add sitemap URLs
    for (const sitemapUrl of sitemapResult.urls) {
      const status = await checkUrlStatus(sitemapUrl.loc, logger);

      if (status !== null || options.includeUnreachable) {
        pages.push({
          url: sitemapUrl.loc,
          path: getUrlPath(sitemapUrl.loc),
          canonical: sitemapUrl.loc,
          title: null,
          status,
          depth: 0,
          source: 'sitemap',
          lastmod: sitemapUrl.lastmod || null,
        });
      }
    }

    // Add crawl URLs (dedupe against sitemap)
    const sitemapUrls = new Set(sitemapResult.urls.map((u) => u.loc));
    for (const crawlUrl of crawlResult.urls) {
      if (!sitemapUrls.has(crawlUrl.url)) {
        if (crawlUrl.status !== null || options.includeUnreachable) {
          pages.push({
            url: crawlUrl.url,
            path: getUrlPath(crawlUrl.url),
            canonical: crawlUrl.url,
            title: null,
            status: crawlUrl.status,
            depth: crawlUrl.depth,
            source: 'crawl',
            lastmod: null,
          });
        }
      }
    }

    logger.info(`Total valid pages: ${pages.length}`);

    // Step 5: Generate manifest
    logger.info('Step 5: Generating manifest...');

    const manifest: Manifest = {
      version: '1.0.0',
      baseUrl: normalizedBase,
      generatedAt: new Date().toISOString(),
      discovery: {
        method: discoveryMethod,
        respectRobots: options.respectRobots,
        sitemapsTried: sitemapResult.sitemapsTried,
        ...(discoveryMethod === 'crawl' || discoveryMethod === 'hybrid'
          ? {
              crawl: {
                maxDepth: options.maxDepth,
                maxPages: options.maxPages,
              },
            }
          : {}),
      },
      pages,
      stats: {
        pagesFound: sitemapResult.urls.length + crawlResult.urls.length,
        pagesIncluded: pages.length,
        excludedExternal: 0, // Tracked during filtering
        excludedDuplicates: sitemapResult.urls.length + crawlResult.urls.length - pages.length,
        excludedByRules: 0, // Tracked during filtering
      },
    };

    // Validate manifest
    validateManifest(manifest);

    // Write manifest
    const manifestPath = join(options.outDir, 'manifest.json');
    await writeJsonFile(manifestPath, manifest);
    logger.info(`✅ Manifest written to: ${manifestPath}`);

    // Step 6: Generate reports
    reportGen.end();
    const reportDir = await reportGen.createReportFolder();

    await reportGen.generateRunReport(
      reportDir,
      `discover --baseUrl ${options.baseUrl}`,
      options as unknown as Record<string, unknown>,
      manifest.stats,
      {
        manifest: manifestPath,
        report: reportDir,
      }
    );

    await reportGen.generateSummaryReport(
      reportDir,
      `discover --baseUrl ${options.baseUrl}`,
      manifest.stats,
      {
        manifest: manifestPath,
        report: reportDir,
      }
    );

    await reportGen.writeLogs(reportDir);

    logger.info(`📊 Reports written to: ${reportDir}`);
    logger.info('');
    logger.info('=== Discovery Complete ===');
    logger.info(`📄 Manifest: ${manifestPath}`);
    logger.info(`📊 Report: ${reportDir}`);
    logger.info(`📦 Pages discovered: ${pages.length}`);

    process.exit(0);
  } catch (error) {
    logger.error(`Discovery failed: ${String(error)}`);

    if (error instanceof Error && error.stack) {
      logger.debug(error.stack);
    }

    process.exit(1);
  }
}

/**
 * Check URL status with HEAD request, fallback to GET
 */
async function checkUrlStatus(url: string, logger: Logger): Promise<number | null> {
  try {
    // Try HEAD first
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'wix2wordpresstheme/1.0 (Discovery Bot)',
      },
      redirect: 'follow',
    });

    return headResponse.status;
  } catch {
    // Fallback to GET
    try {
      const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'wix2wordpresstheme/1.0 (Discovery Bot)',
        },
        redirect: 'follow',
      });

      return getResponse.status;
    } catch (error) {
      logger.debug(`Failed to check status for ${url}: ${String(error)}`);
      return null;
    }
  }
}

// CLI Program
const program = new Command();

program
  .name('discover')
  .description('Discover and catalog all pages from a website')
  .version('1.0.0')
  .requiredOption('--baseUrl <url>', 'Base URL of the website to discover')
  .option('--outDir <path>', 'Output directory for manifest', 'crawler/output')
  .option('--respectRobots <boolean>', 'Respect robots.txt', 'true')
  .option('--maxDepth <number>', 'Maximum crawl depth', '2')
  .option('--maxPages <number>', 'Maximum pages to crawl', '500')
  .option('--keepQuery', 'Keep query strings in URLs', false)
  .option('--includeUnreachable', 'Include unreachable URLs in manifest', false)
  .option('--verbose', 'Enable verbose logging', false)
  .addHelpText(
    'after',
    `
Examples:
  $ npm run discover -- --baseUrl https://example.com
  $ npm run discover -- --baseUrl https://example.wixsite.com/mysite --outDir ./output
  $ npm run discover -- --baseUrl https://example.com --respectRobots false --maxDepth 3
  $ npm run discover -- --baseUrl https://example.com --keepQuery --verbose

Output:
  - manifest.json: List of discovered pages with metadata
  - docs/REPORTS/<timestamp>/run.json: Detailed run report
  - docs/REPORTS/<timestamp>/summary.md: Human-readable summary
`
  )
  .action(async (options) => {
    const discoverOptions: DiscoverOptions = {
      baseUrl: options.baseUrl,
      outDir: options.outDir,
      respectRobots: options.respectRobots === 'true' || options.respectRobots === true,
      maxDepth: parseInt(options.maxDepth, 10),
      maxPages: parseInt(options.maxPages, 10),
      keepQuery: options.keepQuery === true,
      includeUnreachable: options.includeUnreachable === true,
      verbose: options.verbose === true,
    };

    await runDiscover(discoverOptions);
  });

program.parse(process.argv);
