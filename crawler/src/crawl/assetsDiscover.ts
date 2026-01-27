// @ts-nocheck - Browser context code uses DOM types not available in Node
/**
 * Asset Discovery
 *
 * Discovers assets from DOM, CSS, and network requests.
 */

import type { Page } from 'playwright';
import type { Asset, AssetType, DiscoveryMethod } from '../types/crawl.js';
import * as csstree from 'css-tree';

/**
 * Discover assets from page
 */
export async function discoverAssets(
  page: Page,
  baseUrl: string,
  allowThirdParty = false
): Promise<Asset[]> {
  const discoveredAssets = new Map<string, Asset>();

  // Discover from DOM
  const domAssets = await discoverFromDOM(page, baseUrl, allowThirdParty);
  for (const asset of domAssets) {
    discoveredAssets.set(asset.url, asset);
  }

  // Discover from CSS
  const cssAssets = await discoverFromCSS(page, baseUrl, allowThirdParty);
  for (const asset of cssAssets) {
    if (!discoveredAssets.has(asset.url)) {
      discoveredAssets.set(asset.url, asset);
    }
  }

  return Array.from(discoveredAssets.values());
}

/**
 * Discover assets from DOM attributes
 */
async function discoverFromDOM(
  page: Page,
  baseUrl: string,
  allowThirdParty: boolean
): Promise<Asset[]> {
  const assets = await page.evaluate(
    ({ base, allowThirdParty }) => {
      const baseUrlObj = new URL(base);
      const results = [];

      const isAllowed = (url) => {
        try {
          const urlObj = new URL(url, base);
          return allowThirdParty || urlObj.origin === baseUrlObj.origin;
        } catch {
          return false;
        }
      };

      const addAsset = (url, type) => {
        if (!url) return;

        try {
          const absolute = new URL(url, base).href;
          if (isAllowed(absolute)) {
            results.push({ url: absolute, type });
          }
        } catch {
          // Invalid URL, skip
        }
      };

      // Images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('img[src]').forEach((img: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addAsset((img as any).src, 'image');

        // Handle srcset
        const srcset = img.getAttribute('srcset');
        if (srcset) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          srcset.split(',').forEach((entry: any) => {
            const url = entry.trim().split(/\s+/)[0];
            addAsset(url, 'image');
          });
        }
      });

      // Picture sources
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('source[srcset]').forEach((source: any) => {
        const srcset = source.getAttribute('srcset');
        if (srcset) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          srcset.split(',').forEach((entry: any) => {
            const url = entry.trim().split(/\s+/)[0];
            addAsset(url, 'image');
          });
        }
      });

      // Video posters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('video[poster]').forEach((video: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addAsset((video as any).poster, 'image');
      });

      // Favicons
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((link: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addAsset((link as any).href, 'image');
      });

      // OG images
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('meta[property="og:image"]').forEach((meta: any) => {
        addAsset(meta.getAttribute('content'), 'image');
      });

      // Stylesheets
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('link[rel="stylesheet"]').forEach((link: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addAsset((link as any).href, 'css');
      });

      // Scripts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document.querySelectorAll('script[src]').forEach((script: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addAsset((script as any).src, 'js');
      });

      return results;
    },
    { base: baseUrl, allowThirdParty }
  );

  return assets.map((a) => ({
    url: a.url,
    type: a.type as AssetType,
    discoveredBy: 'dom' as DiscoveryMethod,
    status: 'skipped' as const,
  }));
}

/**
 * Discover assets from CSS files
 */
async function discoverFromCSS(
  page: Page,
  baseUrl: string,
  allowThirdParty: boolean
): Promise<Asset[]> {
  const assets: Asset[] = [];
  const baseUrlObj = new URL(baseUrl);

  // Get all stylesheets
  const stylesheets = await page.evaluate(() => {
    const sheets = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const sheet of Array.from(document.styleSheets as any)) {
      try {
        if (sheet.href) {
          let cssText = '';
          try {
            cssText = Array.from(sheet.cssRules)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((rule: any) => rule.cssText)
              .join('\n');
          } catch {
            // CORS or other access error, skip
          }

          sheets.push({ href: sheet.href, cssText });
        }
      } catch {
        // Ignore CORS errors
      }
    }

    return sheets;
  });

  // Parse CSS and extract url() references
  for (const sheet of stylesheets) {
    if (!sheet.cssText) continue;

    try {
      const ast = csstree.parse(sheet.cssText);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      csstree.walk(ast, (node: any) => {
        if (node.type === 'Url') {
          const urlValue = node.value;
          if (urlValue && urlValue.type === 'String') {
            const url = urlValue.value.replace(/['"]/g, '');
            try {
              const absoluteUrl = new URL(url, sheet.href).href;
              const urlObj = new URL(absoluteUrl);

              if (allowThirdParty || urlObj.origin === baseUrlObj.origin) {
                // Determine type based on extension
                let type: AssetType = 'other';
                if (/\.(woff2?|ttf|otf|eot)$/i.test(url)) {
                  type = 'font';
                } else if (/\.(png|jpe?g|gif|webp|svg|ico)$/i.test(url)) {
                  type = 'image';
                }

                assets.push({
                  url: absoluteUrl,
                  type,
                  discoveredBy: 'css',
                  status: 'skipped',
                });
              }
            } catch {
              // Invalid URL, skip
            }
          }
        }
      });
    } catch (error) {
      // CSS parse error, skip this stylesheet
      console.error(`Failed to parse CSS from ${sheet.href}:`, error);
    }
  }

  return assets;
}

/**
 * Parse srcset attribute
 */
export function parseSrcset(srcset: string): string[] {
  return srcset
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/**
 * Determine asset type from URL
 */
export function getAssetType(url: string): AssetType {
  const urlLower = url.toLowerCase();

  if (/\.(png|jpe?g|gif|webp|svg|ico|bmp|tiff?)$/i.test(urlLower)) {
    return 'image';
  }

  if (/\.(woff2?|ttf|otf|eot)$/i.test(urlLower)) {
    return 'font';
  }

  if (/\.css$/i.test(urlLower)) {
    return 'css';
  }

  if (/\.js$/i.test(urlLower)) {
    return 'js';
  }

  return 'other';
}
