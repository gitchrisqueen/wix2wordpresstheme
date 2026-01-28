/**
 * Screenshot Capture
 * 
 * Capture screenshots using Playwright
 */

import { chromium, type Browser, type Page } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import type { ScreenshotResult, Breakpoint } from '../types.js';

/**
 * Capture screenshots for a URL at multiple breakpoints
 */
export async function captureScreenshots(
  url: string,
  outputDir: string,
  slug: string,
  breakpoints: Breakpoint[],
  prefix: string,
): Promise<ScreenshotResult[]> {
  const browser = await chromium.launch({ headless: true });
  const results: ScreenshotResult[] = [];

  try {
    for (const breakpoint of breakpoints) {
      const result = await captureScreenshot(
        browser,
        url,
        outputDir,
        slug,
        breakpoint,
        prefix,
      );
      results.push(result);
    }
  } finally {
    await browser.close();
  }

  return results;
}

/**
 * Capture a single screenshot
 */
async function captureScreenshot(
  browser: Browser,
  url: string,
  outputDir: string,
  slug: string,
  breakpoint: Breakpoint,
  prefix: string,
): Promise<ScreenshotResult> {
  const context = await browser.newContext({
    viewport: {
      width: breakpoint.width,
      height: breakpoint.height,
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  let page: Page | null = null;
  const timestamp = new Date().toISOString();

  try {
    page = await context.newPage();

    // Navigate with retry
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 45000,
    });

    // Wait for page to settle
    await page.waitForTimeout(750);

    // Generate screenshot path
    const screenshotDir = join(outputDir, slug, 'screenshots');
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }

    const filename = `${prefix}-${breakpoint.name}.png`;
    const screenshotPath = join(screenshotDir, filename);

    // Capture full page screenshot
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    return {
      url,
      breakpoint: breakpoint.name,
      path: screenshotPath,
      timestamp,
      width: breakpoint.width,
      height: breakpoint.height,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Still create a placeholder result even on error
    const screenshotDir = join(outputDir, slug, 'screenshots');
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }

    const filename = `${prefix}-${breakpoint.name}.png`;
    const screenshotPath = join(screenshotDir, filename);

    return {
      url,
      breakpoint: breakpoint.name,
      path: screenshotPath,
      timestamp,
      width: breakpoint.width,
      height: breakpoint.height,
      error: errorMessage,
    };
  } finally {
    if (page) {
      await page.close();
    }
    await context.close();
  }
}

/**
 * Capture screenshots for multiple URLs in parallel
 */
export async function captureMultipleScreenshots(
  urls: { url: string; slug: string; prefix: string }[],
  outputDir: string,
  breakpoints: Breakpoint[],
  concurrency: number = 3,
): Promise<Map<string, ScreenshotResult[]>> {
  const results = new Map<string, ScreenshotResult[]>();
  const browser = await chromium.launch({ headless: true });

  try {
    // Process in batches for concurrency control
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(async ({ url, slug, prefix }) => {
        const screenshots: ScreenshotResult[] = [];
        for (const breakpoint of breakpoints) {
          const result = await captureScreenshot(
            browser,
            url,
            outputDir,
            slug,
            breakpoint,
            prefix,
          );
          screenshots.push(result);
        }
        return { slug, screenshots };
      });

      const batchResults = await Promise.all(batchPromises);
      for (const { slug, screenshots } of batchResults) {
        results.set(slug, screenshots);
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
