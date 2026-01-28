/**
 * URL Mapping
 * 
 * Maps Wix URLs to WordPress URLs for verification
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { PageMapping } from '../types.js';

interface ManifestPage {
  url: string;
  path: string;
  slug?: string;
  title?: string;
}

interface Manifest {
  baseUrl: string;
  pages: ManifestPage[];
}

interface PageMappingFile {
  wixUrl: string;
  wpUrl?: string;
  wpSlug: string;
  wpTitle?: string;
  templateSlug: string;
  templateHint?: string;
}

/**
 * Build URL mappings from manifest and page-mapping.json
 */
export function buildPageMappings(
  manifestPath: string,
  themeName: string,
  themeOutputDir: string,
  wpBaseUrl: string,
): PageMapping[] {
  // Load manifest
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }

  const manifestContent = readFileSync(manifestPath, 'utf-8');
  const manifest: Manifest = JSON.parse(manifestContent);

  // Load page-mapping.json if it exists
  const pageMappingPath = join(
    themeOutputDir,
    themeName,
    '.generated',
    'page-mapping.json',
  );

  let pageMappings: PageMappingFile[] = [];
  if (existsSync(pageMappingPath)) {
    const pageMappingContent = readFileSync(pageMappingPath, 'utf-8');
    pageMappings = JSON.parse(pageMappingContent);
  }

  // Build mapping array
  const mappings: PageMapping[] = [];

  for (const page of manifest.pages) {
    // Find corresponding page mapping
    const pageMapping = pageMappings.find((pm) => pm.wixUrl === page.url);

    // Determine WP URL
    let wpUrl: string;
    let slug: string;

    if (pageMapping) {
      // Use explicit mapping from page-mapping.json
      slug = pageMapping.wpSlug;
      wpUrl = pageMapping.wpUrl || buildWpUrl(wpBaseUrl, slug);
    } else {
      // Infer from Wix URL path
      slug = page.slug || slugFromPath(page.path);
      wpUrl = buildWpUrl(wpBaseUrl, slug);
    }

    mappings.push({
      wixUrl: page.url,
      wpUrl,
      slug,
      title: pageMapping?.wpTitle || page.title || slug,
      templateHint: pageMapping?.templateHint,
    });
  }

  return mappings;
}

/**
 * Build WordPress URL from base URL and slug
 */
function buildWpUrl(wpBaseUrl: string, slug: string): string {
  // Normalize base URL
  const base = wpBaseUrl.replace(/\/+$/, '');

  // Handle special cases
  if (slug === 'home' || slug === 'index') {
    return base + '/';
  }

  return base + '/' + slug + '/';
}

/**
 * Extract slug from path
 */
function slugFromPath(path: string): string {
  // Remove leading/trailing slashes
  let slug = path.replace(/^\/+|\/+$/g, '');

  // Handle root path
  if (!slug || slug === '/') {
    return 'home';
  }

  // Use last segment of path
  const segments = slug.split('/').filter((s) => s.length > 0);
  slug = segments[segments.length - 1];

  // Sanitize slug
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'page';
}

/**
 * Get page mapping by slug
 */
export function getPageMappingBySlug(
  mappings: PageMapping[],
  slug: string,
): PageMapping | undefined {
  return mappings.find((m) => m.slug === slug);
}

/**
 * Get page mapping by Wix URL
 */
export function getPageMappingByWixUrl(
  mappings: PageMapping[],
  wixUrl: string,
): PageMapping | undefined {
  // Normalize URLs for comparison
  const normalizedWixUrl = normalizeUrl(wixUrl);
  return mappings.find((m) => normalizeUrl(m.wixUrl) === normalizedWixUrl);
}

/**
 * Get page mapping by WP URL
 */
export function getPageMappingByWpUrl(
  mappings: PageMapping[],
  wpUrl: string,
): PageMapping | undefined {
  // Normalize URLs for comparison
  const normalizedWpUrl = normalizeUrl(wpUrl);
  return mappings.find((m) => normalizeUrl(m.wpUrl) === normalizedWpUrl);
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash, convert to lowercase
    return (parsed.origin + parsed.pathname)
      .toLowerCase()
      .replace(/\/+$/, '');
  } catch {
    // Not a valid URL, just normalize as string
    return url.toLowerCase().replace(/\/+$/, '');
  }
}
