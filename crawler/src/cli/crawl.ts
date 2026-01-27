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

program
  .name('crawl')
  .description('Crawl pages from manifest and capture snapshots')
  .requiredOption('--baseUrl <url>', 'Base URL of the website')
  .requiredOption('--manifest <path>', 'Path to manifest.json from discovery')
  .option('--outDir <path>', 'Output directory', 'crawler/output')
  .option('--maxPages <number>', 'Maximum number of pages to crawl', parseInt)
  .option('--concurrency <number>', 'Number of concurrent page captures', parseInt, 3)
  .option('--timeoutMs <number>', 'Page load timeout in milliseconds', parseInt, 45000)
  .option('--retries <number>', 'Number of retries per page', parseInt, 2)
  .option(
    '--waitUntil <strategy>',
    'Wait strategy: networkidle, domcontentloaded, load',
    'networkidle'
  )
  .option('--settleMs <number>', 'Additional settle time after page load (ms)', parseInt, 750)
  .option('--breakpoints <list>', 'Comma-separated breakpoint names', 'desktop,mobile')
  .option('--downloadAssets <boolean>', 'Download assets', (val) => val !== 'false', true)
  .option('--respectRobots <boolean>', 'Respect robots.txt', (val) => val !== 'false', true)
  .option('--allowPartial <boolean>', 'Allow partial success', (val) => val === 'true', false)
  .option('--verbose', 'Verbose logging')
  .action(async (options) => {
    const logger = new Logger(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);
    const reportGen = new ReportGenerator(logger);

    try {
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

      // Build config
      const breakpoints = options.breakpoints.split(',').map((s: string) => s.trim());

      const config: CrawlConfig = {
        baseUrl: options.baseUrl,
        manifestPath,
        outDir: resolve(options.outDir),
        maxPages: options.maxPages,
        concurrency: options.concurrency,
        timeoutMs: options.timeoutMs,
        retries: options.retries,
        waitUntil: options.waitUntil as 'networkidle' | 'domcontentloaded' | 'load',
        settleMs: options.settleMs,
        breakpoints,
        downloadAssets: options.downloadAssets,
        respectRobots: options.respectRobots,
        allowPartial: options.allowPartial,
        verbose: options.verbose,
      };

      logger.info(`Concurrency: ${config.concurrency}`);
      logger.info(`Breakpoints: ${breakpoints.join(', ')}`);
      logger.info(`Download assets: ${config.downloadAssets}`);

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
