// @ts-nocheck - Browser context code uses DOM types not available in Node
/**
 * Page Capture
 *
 * Captures a single page with Playwright including screenshots, HTML, DOM, metadata, and assets.
 */

import type { Page, BrowserContext } from 'playwright';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import type { CrawlConfig, BreakpointConfig } from '../types/crawl.js';
import { extractDOM } from './domExtract.js';
import { extractMetadata } from './metaExtract.js';
import { discoverAssets } from './assetsDiscover.js';
import { downloadAssets } from './assetsDownload.js';
import { ensureDir, writeJsonFile } from '../lib/fileio.js';
import type { Logger } from '../lib/logger.js';

export interface PageCaptureOptions {
  url: string;
  slug: string;
  outputDir: string;
  config: CrawlConfig;
  breakpoints: BreakpointConfig[];
  logger: Logger;
}

export interface PageCaptureSuccess {
  success: true;
  url: string;
  slug: string;
  outputPath: string;
  duration: number;
}

export interface PageCaptureFailure {
  success: false;
  url: string;
  slug: string;
  error: string;
  duration: number;
}

export type PageCaptureResult = PageCaptureSuccess | PageCaptureFailure;

/**
 * Capture a single page with retries
 */
export async function capturePage(
  context: BrowserContext,
  options: PageCaptureOptions
): Promise<PageCaptureResult> {
  const startTime = Date.now();
  const { url, slug, outputDir, config, breakpoints, logger } = options;

  logger.info(`Capturing page: ${url}`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    if (attempt > 0) {
      logger.warn(`Retry attempt ${attempt} for ${url}`);
    }

    try {
      const result = await capturePageAttempt(context, options, attempt);
      return {
        success: true,
        url,
        slug,
        outputPath: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error as Error;
      logger.error(`Attempt ${attempt + 1} failed for ${url}: ${lastError.message}`);

      // Wait before retry
      if (attempt < config.retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  // All attempts failed
  const duration = Date.now() - startTime;
  const errorMsg = lastError?.message || 'Unknown error';

  // Save error screenshot if possible
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 5000 });
    const errorDir = join(outputDir, 'pages', slug);
    await ensureDir(errorDir);
    await page.screenshot({ path: join(errorDir, 'error.png'), fullPage: false });
    await writeFile(join(errorDir, 'error.txt'), errorMsg);
    await page.close();
  } catch {
    // Ignore error screenshot failures
  }

  return {
    success: false,
    url,
    slug,
    error: errorMsg,
    duration,
  };
}

/**
 * Single capture attempt
 */
async function capturePageAttempt(
  context: BrowserContext,
  options: PageCaptureOptions,
  attempt: number
): Promise<string> {
  const { url, slug, outputDir, config, breakpoints, logger } = options;

  const page = await context.newPage();

  try {
    // Navigate with appropriate wait strategy
    const waitStrategy = attempt === 0 ? config.waitUntil : 'domcontentloaded';
    logger.debug(`Navigating to ${url} with waitUntil=${waitStrategy}`);

    const response = await page.goto(url, {
      waitUntil: waitStrategy,
      timeout: config.timeoutMs,
    });

    if (!response) {
      throw new Error('No response received from page');
    }

    // Additional settle time
    await page.waitForTimeout(config.settleMs);

    // Ensure page is fully loaded
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
    });

    // Get status code
    const status = response.status();

    // Create output directory
    const pageDir = join(outputDir, 'pages', slug);
    await ensureDir(pageDir);

    // Capture for each breakpoint
    for (const breakpoint of breakpoints) {
      await captureBreakpoint(page, pageDir, breakpoint, logger);
    }

    // Extract rendered HTML (do this once, with desktop viewport)
    const html = await page.content();
    await ensureDir(join(pageDir, 'html'));
    await writeFile(join(pageDir, 'html', 'rendered.html'), html);

    // Extract DOM snapshot
    logger.debug(`Extracting DOM for ${url}`);
    const domSnapshot = await extractDOM(page, url);
    await ensureDir(join(pageDir, 'dom'));
    await writeJsonFile(join(pageDir, 'dom', 'dom.json'), domSnapshot);

    // Extract metadata
    logger.debug(`Extracting metadata for ${url}`);
    const metadata = await extractMetadata(page, url, status);
    await ensureDir(join(pageDir, 'meta'));
    await writeJsonFile(join(pageDir, 'meta', 'meta.json'), metadata);

    // Discover and download assets
    if (config.downloadAssets) {
      logger.debug(`Discovering assets for ${url}`);
      const discoveredAssets = await discoverAssets(page, config.baseUrl, false);

      logger.info(`Discovered ${discoveredAssets.length} assets for ${url}`);

      const assetsDir = join(pageDir, 'assets');
      await ensureDir(assetsDir);

      const downloadedAssets = await downloadAssets(discoveredAssets, assetsDir, logger);

      const assetsManifest = {
        pageUrl: url,
        capturedAt: new Date().toISOString(),
        assets: downloadedAssets,
      };

      await writeJsonFile(join(assetsDir, 'manifest.json'), assetsManifest);
    }

    // Write page summary
    const pageSummary = {
      url,
      slug,
      finalUrl: page.url(),
      status,
      capturedAt: new Date().toISOString(),
      breakpoints: breakpoints.map((b) => b.name),
    };

    await writeJsonFile(join(pageDir, 'page.json'), pageSummary);

    logger.info(`Successfully captured: ${url}`);
    return pageDir;
  } finally {
    await page.close();
  }
}

/**
 * Capture page at specific breakpoint
 */
async function captureBreakpoint(
  page: Page,
  pageDir: string,
  breakpoint: BreakpointConfig,
  logger: Logger
): Promise<void> {
  logger.debug(`Capturing ${breakpoint.name} breakpoint`);

  await page.setViewportSize({
    width: breakpoint.width,
    height: breakpoint.height,
  });

  // Give page time to adjust to new viewport
  await page.waitForTimeout(500);

  const screenshotsDir = join(pageDir, 'screenshots');
  await ensureDir(screenshotsDir);

  const screenshotPath = join(screenshotsDir, `${breakpoint.name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });
}
