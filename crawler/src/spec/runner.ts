/**
 * Spec Runner
 *
 * Main orchestration for PageSpec generation.
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Manifest } from '../types/manifest.js';
import type { PageSpec, SpecSummary, LayoutPatterns, PageStatus } from '../types/spec.js';
import { inferPageSpec } from './pagespecInfer.js';
import { extractDesignTokens } from './designTokens.js';
import { detectPatterns } from './patterns.js';
import { Logger } from '../lib/logger.js';
import { writeJsonFile } from '../lib/fileio.js';
import { ReportGenerator } from '../lib/report.js';
import {
  validatePageSpec,
  validateDesignTokens,
  validateLayoutPatterns,
  validateSpecSummary,
} from '../types/spec.js';
import { generateDebugArtifacts } from './debugSpec.js';

export interface SpecConfig {
  baseUrl: string;
  inDir: string;
  outDir: string;
  maxPages?: number | null;
  strategy: 'heuristic'; // Only heuristic for now
  debugSpec?: boolean;
}

/**
 * Load actual slugs from crawled pages
 * Returns a map of URLs to their actual slugs as created during crawling
 */
async function loadPageSlugs(pagesDir: string, logger: Logger): Promise<Map<string, string>> {
  const slugMap = new Map<string, string>();
  const fs = await import('fs/promises');

  try {
    const entries = await fs.readdir(pagesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pageJsonPath = join(pagesDir, entry.name, 'page.json');
        try {
          const pageJsonContent = await readFile(pageJsonPath, 'utf-8');
          const pageJson = JSON.parse(pageJsonContent);
          if (pageJson.url && pageJson.slug) {
            slugMap.set(pageJson.url, pageJson.slug);
            logger.debug(`Mapped URL ${pageJson.url} to slug ${pageJson.slug}`);
          }
        } catch (err) {
          logger.debug(`Could not read page.json from ${entry.name}, skipping`);
        }
      }
    }
  } catch (err) {
    logger.warn(`Could not read pages directory: ${(err as Error).message}`);
  }

  return slugMap;
}

/**
 * Run spec generation
 */
export async function runSpec(config: SpecConfig, logger: Logger): Promise<void> {
  logger.info('=== Wix2WordPress Spec Generation ===');
  logger.info(`Base URL: ${config.baseUrl}`);
  logger.info(`Input: ${config.inDir}`);
  logger.info(`Output: ${config.outDir}`);
  logger.info(`Strategy: ${config.strategy}`);

  const reportGen = new ReportGenerator(logger);

  try {
    // Step 1: Load manifest
    logger.info('Step 1: Loading manifest...');
    const manifestPath = join(config.inDir, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest: Manifest = JSON.parse(manifestContent);
    logger.info(`Loaded ${manifest.pages.length} pages from manifest`);

    // Load actual page slugs from crawled data
    logger.info('Loading actual page slugs from crawled data...');
    const slugMap = await loadPageSlugs(join(config.inDir, 'pages'), logger);
    logger.info(`Loaded ${slugMap.size} actual page slugs`);

    // Limit pages if specified
    let pagesToProcess = manifest.pages;
    if (config.maxPages && config.maxPages > 0) {
      pagesToProcess = pagesToProcess.slice(0, config.maxPages);
      logger.info(`Limited to ${pagesToProcess.length} pages`);
    }

    // Step 2: Process each page
    logger.info('Step 2: Processing pages...');
    const pageSpecs: PageSpec[] = [];
    const pageStatuses: PageStatus[] = [];
    const sectionsMap = new Map<string, PageSpec['sections']>();
    const pagesForTokens: Array<{ html: string; slug: string }> = [];

    for (const page of pagesToProcess) {
      // Get actual slug from crawled data, fallback to derived slug if not found
      let slug = slugMap.get(page.url);
      if (!slug) {
        logger.warn(`No slug found for URL ${page.url}, deriving slug from path`);
        slug = page.path.replace(/^\//, '').replace(/\//g, '-') || 'index';
      }

      logger.debug(`Processing page: ${slug} (${page.url})`);

      try {
        // Load page data
        const pagePath = join(config.inDir, 'pages', slug);
        const html = await readFile(join(pagePath, 'html', 'rendered.html'), 'utf-8');
        const metaContent = await readFile(join(pagePath, 'meta', 'meta.json'), 'utf-8');
        const meta = JSON.parse(metaContent);

        // Infer PageSpec
        const result = inferPageSpec({
          url: page.url,
          slug,
          baseUrl: config.baseUrl,
          html,
          meta,
          debug: config.debugSpec,
        });

        const pageSpec = result.pageSpec;

        // Validate
        validatePageSpec(pageSpec);

        pageSpecs.push(pageSpec);
        sectionsMap.set(slug, pageSpec.sections);
        pagesForTokens.push({ html, slug });

        pageStatuses.push({
          slug,
          url: page.url,
          status: 'success',
          sectionCount: pageSpec.sections.length,
          warnings: pageSpec.notes,
        });

        // Write pagespec.json
        const pageSpecPath = join(config.outDir, 'pages', slug, 'spec', 'pagespec.json');
        await writeJsonFile(pageSpecPath, pageSpec);
        logger.debug(`Wrote PageSpec: ${pageSpecPath}`);

        // Generate debug artifacts if enabled
        if (config.debugSpec && result.debugData) {
          await generateDebugArtifacts(
            slug,
            config.outDir,
            {
              blockCandidates: result.debugData.blockCandidates,
              features: result.debugData.features,
              sections: pageSpec.sections,
            },
            result.debugData.$,
            logger
          );
        }
      } catch (error) {
        logger.error(`Failed to process page ${slug}: ${(error as Error).message}`);
        pageStatuses.push({
          slug,
          url: page.url,
          status: 'failed',
          warnings: [],
          error: (error as Error).message,
        });
      }
    }

    logger.info(`Processed ${pageSpecs.length}/${pagesToProcess.length} pages successfully`);

    // Step 3: Extract design tokens
    logger.info('Step 3: Extracting design tokens...');
    const designTokens = extractDesignTokens(pagesForTokens);
    validateDesignTokens(designTokens);

    const tokensPath = join(config.outDir, 'spec', 'design-tokens.json');
    await writeJsonFile(tokensPath, designTokens);
    logger.info(`Wrote design tokens: ${tokensPath}`);

    // Step 4: Detect patterns
    logger.info('Step 4: Detecting layout patterns...');
    const patterns = detectPatterns(sectionsMap);
    const layoutPatterns: LayoutPatterns = { patterns };
    validateLayoutPatterns(layoutPatterns);

    const patternsPath = join(config.outDir, 'spec', 'layout-patterns.json');
    await writeJsonFile(patternsPath, layoutPatterns);
    logger.info(`Detected ${patterns.length} patterns, wrote: ${patternsPath}`);

    // Step 5: Generate summary
    logger.info('Step 5: Generating summary...');
    const totalSections = pageSpecs.reduce((sum, ps) => sum + ps.sections.length, 0);
    const summary: SpecSummary = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      baseUrl: config.baseUrl,
      stats: {
        pagesProcessed: pagesToProcess.length,
        pagesSucceeded: pageSpecs.length,
        pagesFailed: pagesToProcess.length - pageSpecs.length,
        totalSections,
        totalPatterns: patterns.length,
      },
      pages: pageStatuses,
      warnings: [],
    };

    validateSpecSummary(summary);

    const summaryPath = join(config.outDir, 'spec', 'spec-summary.json');
    await writeJsonFile(summaryPath, summary);
    logger.info(`Wrote summary: ${summaryPath}`);

    // Step 6: Generate reports
    logger.info('Step 6: Generating reports...');
    reportGen.end();
    const reportDir = await reportGen.createReportFolder();

    await reportGen.generateRunReport(
      reportDir,
      'spec',
      {
        baseUrl: config.baseUrl,
        inDir: config.inDir,
        outDir: config.outDir,
        maxPages: config.maxPages,
        strategy: config.strategy,
      },
      {
        pagesFound: pagesToProcess.length,
        pagesIncluded: pageSpecs.length,
        excludedExternal: 0,
        excludedDuplicates: 0,
        excludedByRules: 0,
      },
      {
        manifest: summaryPath,
        report: reportDir,
      }
    );

    await reportGen.generateSummaryMarkdown(reportDir, {
      command: 'spec',
      pagesProcessed: pagesToProcess.length,
      pagesSucceeded: pageSpecs.length,
      totalSections,
      totalPatterns: patterns.length,
    });

    logger.info(`📊 Reports written to: ${reportDir}`);
    logger.info('✅ Spec generation complete');
  } catch (error) {
    logger.error(`Spec generation failed: ${(error as Error).message}`);
    throw error;
  }
}
