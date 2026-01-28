/**
 * Link Checks
 * 
 * Verify internal links and assets load correctly
 */

import { chromium, type Page } from 'playwright';
import type { LinkCheckResult } from '../types.js';

/**
 * Perform link and asset checks on a WP page
 */
export async function performLinkChecks(
  wpUrl: string,
  wpBaseUrl: string,
): Promise<LinkCheckResult[]> {
  const browser = await chromium.launch({ headless: true });
  const results: LinkCheckResult[] = [];

  try {
    const page = await browser.newPage();

    // Track failed requests
    const failedRequests: { url: string; status: number }[] = [];
    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        failedRequests.push({
          url: response.url(),
          status,
        });
      }
    });

    await page.goto(wpUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Check internal links
    const internalLinks = await checkInternalLinks(page, wpBaseUrl);
    results.push(...internalLinks);

    // Check images
    const imageChecks = await checkImages(page);
    results.push(...imageChecks);

    // Add failed requests
    for (const failed of failedRequests) {
      const type = determineResourceType(failed.url);
      results.push({
        url: failed.url,
        status: failed.status,
        passed: false,
        type,
        message: `Resource failed with status ${failed.status}`,
      });
    }

    await page.close();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    results.push({
      url: wpUrl,
      status: 0,
      passed: false,
      type: 'internal',
      message: `Failed to load page: ${errorMessage}`,
    });
  } finally {
    await browser.close();
  }

  return results;
}

/**
 * Check internal links
 */
async function checkInternalLinks(
  page: Page,
  wpBaseUrl: string,
): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];

  try {
    // Get all links
    const links = await page.locator('a[href]').all();

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      // Check if internal
      const isInternal = isInternalLink(href, wpBaseUrl);
      if (!isInternal) continue;

      // Resolve relative URLs
      const absoluteUrl = resolveUrl(href, wpBaseUrl);

      // Check if link works
      try {
        const response = await page.request.head(absoluteUrl);
        const status = response.status();

        results.push({
          url: absoluteUrl,
          status,
          passed: status >= 200 && status < 400,
          type: 'internal',
          message:
            status >= 200 && status < 400
              ? 'Link is accessible'
              : `Link returned status ${status}`,
        });
      } catch (error) {
        results.push({
          url: absoluteUrl,
          status: 0,
          passed: false,
          type: 'internal',
          message: `Failed to check link: ${error}`,
        });
      }
    }
  } catch (error) {
    console.error(`Error checking internal links: ${error}`);
  }

  return results;
}

/**
 * Check images load correctly
 */
async function checkImages(page: Page): Promise<LinkCheckResult[]> {
  const results: LinkCheckResult[] = [];

  try {
    const images = await page.locator('img[src]').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (!src) continue;

      // Check if image loaded
      const naturalWidth = await img.evaluate(
        (el) => (el as HTMLImageElement).naturalWidth,
      );

      results.push({
        url: src,
        status: naturalWidth > 0 ? 200 : 404,
        passed: naturalWidth > 0,
        type: 'asset',
        message:
          naturalWidth > 0 ? 'Image loaded successfully' : 'Image failed to load',
      });
    }
  } catch (error) {
    console.error(`Error checking images: ${error}`);
  }

  return results;
}

/**
 * Check if link is internal
 */
function isInternalLink(href: string, wpBaseUrl: string): boolean {
  // Relative links are internal
  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    return true;
  }

  // Check if same origin
  try {
    const linkUrl = new URL(href);
    const baseUrl = new URL(wpBaseUrl);
    return linkUrl.origin === baseUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(href: string, baseUrl: string): string {
  try {
    const resolved = new URL(href, baseUrl);
    return resolved.toString();
  } catch {
    return href;
  }
}

/**
 * Determine resource type from URL
 */
function determineResourceType(
  url: string,
): 'internal' | 'external' | 'asset' {
  const lower = url.toLowerCase();

  // Check for asset extensions
  const assetExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.css',
    '.js',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];

  for (const ext of assetExtensions) {
    if (lower.includes(ext)) {
      return 'asset';
    }
  }

  return 'external';
}
