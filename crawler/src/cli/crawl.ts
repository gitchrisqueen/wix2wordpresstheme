#!/usr/bin/env node
/**
 * Crawl CLI
 *
 * CLI command for crawling pages from manifest and capturing snapshots.
 */

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { Logger, LogLevel } from '../lib/logger.js';
import { ReportGenerator, writeJsonFile } from '../lib/report.js';
import { validateManifest, type Manifest } from '../types/manifest.js';
import { runCrawl } from '../crawl/runner.js';
import type { CrawlConfig } from '../types/crawl.js';

const program = new Command();

/**
 * Normalize crawl config with proper defaults and CLI overrides
 */
function normalizeCrawlConfig(
  cliOptions: any,
  manifest: Manifest,
  defaults: Partial<CrawlConfig>
): CrawlConfig {
  // Helper to get value: CLI override > manifest value > default
  // null/undefined CLI values don't override real values
  const getValue = (cliVal: any, manifestVal: any, defaultVal: any) => {
    if (cliVal !== null && cliVal !== undefined) {
      return cliVal;
    }
    if (manifestVal !== null && manifestVal !== undefined) {
      return manifestVal;
    }
    return defaultVal;
  };

  // Parse breakpoints
  const breakpoints = cliOptions.breakpoints
    ? cliOptions.breakpoints.split(',').map((s: string) => s.trim())
    : defaults.breakpoints || ['desktop', 'mobile'];

  return {
    baseUrl: cliOptions.baseUrl,
    manifestPath: resolve(cliOptions.manifest),
    outDir: resolve(cliOptions.outDir || defaults.outDir || 'crawler/output'),
    maxPages: getValue(cliOptions.maxPages, manifest.discovery?.crawl?.maxPages, null),
    concurrency: getValue(cliOptions.concurrency, null, defaults.concurrency || 3),
    timeoutMs: getValue(cliOptions.timeoutMs, null, defaults.timeoutMs || 45000),
    retries: getValue(cliOptions.retries, null, defaults.retries || 2),
    waitUntil: (cliOptions.waitUntil || defaults.waitUntil || 'networkidle') as
      | 'networkidle'
      | 'domcontentloaded'
      | 'load',
    settleMs: getValue(cliOptions.settleMs, null, defaults.settleMs || 750),
    breakpoints,
    downloadAssets: getValue(cliOptions.downloadAssets, null, defaults.downloadAssets ?? true),
    allowThirdParty: getValue(cliOptions.allowThirdParty, null, defaults.allowThirdParty ?? true),
    downloadThirdPartyAssets: getValue(
      cliOptions.downloadThirdPartyAssets,
      null,
      defaults.downloadThirdPartyAssets ?? false
    ),
    respectRobots: getValue(
      cliOptions.respectRobots,
      manifest.discovery?.respectRobots,
      defaults.respectRobots ?? true
    ),
    allowPartial: getValue(cliOptions.allowPartial, null, defaults.allowPartial ?? false),
    verbose: cliOptions.verbose || defaults.verbose || false,
  };
}

program
  .name('crawl')
  .description('Crawl pages from manifest and capture snapshots')
  .requiredOption('--baseUrl <url>', 'Base URL of the website')
  .requiredOption('--manifest <path>', 'Path to manifest.json from discovery')
  .option('--outDir <path>', 'Output directory', 'crawler/output')
  .option('--maxPages <number>', 'Maximum number of pages to crawl', (val) =>
    val ? parseInt(val, 10) : null
  )
  .option('--concurrency <number>', 'Number of concurrent page captures', (val) =>
    parseInt(val, 10)
  )
  .option('--timeoutMs <number>', 'Page load timeout in milliseconds', (val) => parseInt(val, 10))
  .option('--retries <number>', 'Number of retries per page', (val) => parseInt(val, 10))
  .option(
    '--waitUntil <strategy>',
    'Wait strategy: networkidle, domcontentloaded, load',
    'networkidle'
  )
  .option('--settleMs <number>', 'Additional settle time after page load (ms)', (val) =>
    parseInt(val, 10)
  )
  .option('--breakpoints <list>', 'Comma-separated breakpoint names', 'desktop,mobile')
  .option('--downloadAssets <boolean>', 'Download assets', (val) => val !== 'false', true)
  .option(
    '--allowThirdParty <boolean>',
    'Allow third-party asset downloads (including Wix CDN)',
    (val) => val !== 'false',
    true
  )
  .option(
    '--downloadThirdPartyAssets <boolean>',
    'Download third-party assets when allowThirdParty is enabled',
    (val) => val === 'true',
    false
  )
  .option('--respectRobots <boolean>', 'Respect robots.txt', (val) => val !== 'false', true)
  .option('--allowPartial <boolean>', 'Allow partial success', (val) => val === 'true', false)
  .option('--verbose', 'Verbose logging')
  .option('--debug', 'Debug mode - log parsed options and config')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);
    const reportGen = new ReportGenerator(logger);

    try {
      // Debug: log raw CLI options
      if (options.debug) {
        console.log('=== DEBUG: Parsed CLI Options ===');
        console.log(JSON.stringify(options, null, 2));
      }

      logger.info('=== Wix2WordPress Crawl ===');
      logger.info(`Base URL: ${options.baseUrl}`);
      logger.info(`Manifest: ${options.manifest}`);
      logger.info(`Output directory: ${options.outDir}`);

      // Validate base URL
      try {
        new URL(options.baseUrl);
      } catch {
        throw new Error(`Invalid base URL: ${options.baseUrl}`);
      }

      // Read and validate manifest
      logger.info('Loading manifest...');
      const manifestPath = resolve(options.manifest);
      const manifestContent = await readFile(manifestPath, 'utf-8');
      const manifestData = JSON.parse(manifestContent);
      const manifest: Manifest = validateManifest(manifestData);

      logger.info(`Manifest loaded: ${manifest.pages.length} pages found`);

      // Normalize config with defaults
      const config = normalizeCrawlConfig(options, manifest, {
        concurrency: 3,
        timeoutMs: 45000,
        retries: 2,
        settleMs: 750,
        waitUntil: 'networkidle',
        downloadAssets: true,
        allowThirdParty: true,
        downloadThirdPartyAssets: false,
        respectRobots: true,
        allowPartial: false,
        breakpoints: ['desktop', 'mobile'],
        outDir: 'crawler/output',
        verbose: false,
      });

      // Debug: log resolved config
      if (options.debug) {
        console.log('=== DEBUG: Resolved Normalized Config ===');
        console.log(JSON.stringify(config, null, 2));
      }

      // Calculate pages to process
      const totalPages = manifest.pages.length;
      const pagesToProcess = config.maxPages ? Math.min(config.maxPages, totalPages) : totalPages;

      logger.info(`Selected ${pagesToProcess} pages from manifest (total: ${totalPages})`);

      // Debug: log page selection
      if (options.debug) {
        console.log('=== DEBUG: Page Selection ===');
        console.log(`Total pages in manifest: ${totalPages}`);
        console.log(`maxPages config: ${config.maxPages}`);
        console.log(`Pages to be enqueued: ${pagesToProcess}`);
      }

      logger.info(`Concurrency: ${config.concurrency}`);
      logger.info(`Retries: ${config.retries}`);
      logger.info(`Timeout: ${config.timeoutMs}ms`);
      logger.info(`Settle time: ${config.settleMs}ms`);
      logger.info(`Breakpoints: ${config.breakpoints.join(', ')}`);
      logger.info(`Download assets: ${config.downloadAssets}`);
      logger.info(`Allow third-party assets: ${config.allowThirdParty}`);
      logger.info(`Download third-party assets: ${config.downloadThirdPartyAssets}`);

      // Run crawl
      const { summary } = await runCrawl(manifest, config, logger);

      // Generate reports
      reportGen.end();

      const reportDir = await reportGen.createReportFolder();
      logger.info(`Report directory: ${reportDir}`);

      // Write run report
      await reportGen.generateRunReport(
        reportDir,
        'crawl',
        config as unknown as Record<string, unknown>,
        {
          pagesFound: summary.stats.totalPages,
          pagesIncluded: summary.stats.successful,
          excludedExternal: 0,
          excludedDuplicates: 0,
          excludedByRules: summary.stats.skipped,
        },
        {
          report: reportDir,
        }
      );

      // Write summary report
      await generateCrawlSummaryReport(reportDir, summary);

      // Write logs
      await reportGen.writeLogs(reportDir);

      logger.info('');
      logger.info('=== Crawl Complete ===');
      logger.info(`✅ Successful: ${summary.stats.successful}/${summary.stats.totalPages}`);
      if (summary.stats.failed > 0) {
        logger.warn(`❌ Failed: ${summary.stats.failed}`);
      }
      logger.info(`📁 Output: ${config.outDir}`);
      logger.info(`📊 Reports: ${reportDir}`);
      logger.info(`⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s`);

      // Exit with error if failures and not allowing partial
      if (summary.stats.failed > 0 && !config.allowPartial) {
        logger.error('Crawl had failures and --allowPartial is false');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Crawl failed:', error);
      process.exit(1);
    }
  });

/**
 * Generate crawl-specific summary report
 */
async function generateCrawlSummaryReport(reportDir: string, summary: any) {
  const summaryMd = `# Crawl Run Summary

## Run Information
- **Command**: \`crawl\`
- **Base URL**: ${summary.baseUrl}
- **Start Time**: ${summary.startTime}
- **End Time**: ${summary.endTime}
- **Duration**: ${(summary.duration / 1000).toFixed(2)}s

## Configuration
- **Concurrency**: ${summary.config.concurrency}
- **Timeout**: ${summary.config.timeoutMs}ms
- **Retries**: ${summary.config.retries}
- **Breakpoints**: ${summary.config.breakpoints.join(', ')}
- **Download Assets**: ${summary.config.downloadAssets}

## Statistics
- **Total Pages**: ${summary.stats.totalPages}
- **Successful**: ${summary.stats.successful}
- **Failed**: ${summary.stats.failed}
- **Skipped**: ${summary.stats.skipped}

## Status
${summary.stats.failed > 0 ? '❌ **Completed with failures**' : '✅ **Completed successfully**'}

${
  summary.stats.failed > 0
    ? `## Failed Pages\n${summary.results
        .filter((r: any) => r.status === 'failed')
        .map((r: any) => `- ${r.url}: ${r.error}`)
        .join('\n')}`
    : ''
}
`;

  await writeJsonFile(join(reportDir, 'summary.md'), summaryMd);
}

program.parse(process.argv);
