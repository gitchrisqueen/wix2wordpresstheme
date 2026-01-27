/**
 * URL Normalization and Filtering Utilities
 *
 * Handles URL normalization, deduplication, and internal link filtering.
 */

const EXCLUDED_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.svg',
  '.gif',
  '.css',
  '.js',
  '.zip',
  '.mp4',
  '.mov',
  '.avi',
  '.wmv',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.ico',
]);

const EXCLUDED_PATH_PREFIXES = [
  '/account',
  '/login',
  '/cart',
  '/checkout',
  '/_api/',
  '/wp-admin',
  '/wp-content',
  '/wp-includes',
];

export interface UrlNormalizationOptions {
  stripQuery?: boolean;
  stripFragment?: boolean;
  removeTrailingSlash?: boolean;
}

/**
 * Normalize a URL to a canonical form
 */
export function normalizeUrl(urlString: string, options: UrlNormalizationOptions = {}): string {
  const { stripQuery = true, stripFragment = true, removeTrailingSlash = true } = options;

  try {
    const url = new URL(urlString);

    // Lowercase scheme and host
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();

    // Remove default ports
    if (
      (url.protocol === 'http:' && url.port === '80') ||
      (url.protocol === 'https:' && url.port === '443')
    ) {
      url.port = '';
    }

    // Strip query if requested
    if (stripQuery) {
      url.search = '';
    }

    // Strip fragment if requested (default true)
    if (stripFragment) {
      url.hash = '';
    }

    // Handle trailing slash
    let pathname = url.pathname;
    if (removeTrailingSlash && pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    url.pathname = pathname;

    return url.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

/**
 * Resolve a relative URL against a base URL
 */
export function resolveUrl(baseUrl: string, relativeUrl: string): string {
  try {
    const url = new URL(relativeUrl, baseUrl);
    return url.toString();
  } catch (error) {
    throw new Error(`Cannot resolve URL: ${relativeUrl} against base: ${baseUrl}`);
  }
}

/**
 * Check if a URL is internal (same origin as base)
 */
export function isInternalUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);

    return (
      urlObj.protocol === baseObj.protocol &&
      urlObj.hostname === baseObj.hostname &&
      urlObj.port === baseObj.port
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL should be excluded based on extension
 */
export function hasExcludedExtension(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    return Array.from(EXCLUDED_EXTENSIONS).some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Check if a URL should be excluded based on path prefix
 */
export function hasExcludedPathPrefix(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();

    return EXCLUDED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a valid HTTP(S) URL
 */
export function isValidHttpUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if a URL should be excluded (special schemes)
 */
export function hasExcludedScheme(urlString: string): boolean {
  const excludedSchemes = ['mailto:', 'tel:', 'javascript:', 'data:', 'file:'];

  for (const scheme of excludedSchemes) {
    if (urlString.trim().toLowerCase().startsWith(scheme)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a URL is fragment-only (starts with #)
 */
export function isFragmentOnly(urlString: string): boolean {
  return urlString.trim().startsWith('#');
}

/**
 * Filter and normalize a list of URLs
 */
export function filterAndNormalizeUrls(
  urls: string[],
  baseUrl: string,
  options: UrlNormalizationOptions = {}
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    // Skip empty URLs
    if (!url || url.trim() === '') {
      continue;
    }

    // Skip fragment-only URLs
    if (isFragmentOnly(url)) {
      continue;
    }

    // Skip excluded schemes
    if (hasExcludedScheme(url)) {
      continue;
    }

    try {
      // Resolve relative URLs
      const resolved = resolveUrl(baseUrl, url);

      // Skip non-HTTP(S) URLs
      if (!isValidHttpUrl(resolved)) {
        continue;
      }

      // Skip external URLs
      if (!isInternalUrl(resolved, baseUrl)) {
        continue;
      }

      // Skip excluded extensions
      if (hasExcludedExtension(resolved)) {
        continue;
      }

      // Skip excluded path prefixes
      if (hasExcludedPathPrefix(resolved)) {
        continue;
      }

      // Normalize
      const normalized = normalizeUrl(resolved, options);

      // Dedupe
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    } catch {
      // Skip invalid URLs
      continue;
    }
  }

  return result;
}

/**
 * Extract the path from a URL
 */
export function getUrlPath(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    return '';
  }
}
