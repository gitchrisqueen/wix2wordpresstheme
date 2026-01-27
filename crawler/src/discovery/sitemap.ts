/**
 * Sitemap Parser
 *
 * Parses XML sitemaps including sitemap indexes with recursive support.
 */

import { XMLParser } from 'fast-xml-parser';
import { Logger } from '../lib/logger.js';
import { normalizeUrl, isInternalUrl } from '../lib/url.js';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

export interface SitemapResult {
  urls: SitemapUrl[];
  sitemapsTried: string[];
  method: 'sitemap' | 'none';
}

const SITEMAP_PATHS = ['/sitemap.xml', '/sitemap_index.xml', '/site-map.xml', '/_api/sitemap.xml'];

const MAX_RECURSION_DEPTH = 3;

export class SitemapParser {
  private logger: Logger;
  private xmlParser: XMLParser;

  constructor(logger: Logger) {
    this.logger = logger;
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  /**
   * Discover and parse sitemaps for a base URL
   */
  async discoverSitemaps(baseUrl: string): Promise<SitemapResult> {
    const sitemapsTried: string[] = [];
    const allUrls: SitemapUrl[] = [];

    for (const path of SITEMAP_PATHS) {
      const sitemapUrl = new URL(path, baseUrl).toString();
      sitemapsTried.push(sitemapUrl);

      this.logger.info(`Trying sitemap: ${sitemapUrl}`);

      try {
        const urls = await this.parseSitemap(sitemapUrl, baseUrl, 0);

        if (urls.length > 0) {
          this.logger.info(`Found ${urls.length} URLs in sitemap: ${sitemapUrl}`);
          allUrls.push(...urls);
        }
      } catch (error) {
        this.logger.debug(`Failed to parse sitemap ${sitemapUrl}: ${String(error)}`);
      }
    }

    // Dedupe URLs
    const uniqueUrls = this.dedupeUrls(allUrls);

    return {
      urls: uniqueUrls,
      sitemapsTried,
      method: uniqueUrls.length > 0 ? 'sitemap' : 'none',
    };
  }

  /**
   * Parse a single sitemap (handles both urlset and sitemapindex)
   */
  private async parseSitemap(
    sitemapUrl: string,
    baseUrl: string,
    depth: number
  ): Promise<SitemapUrl[]> {
    if (depth > MAX_RECURSION_DEPTH) {
      this.logger.warn(`Max recursion depth reached for sitemap: ${sitemapUrl}`);
      return [];
    }

    try {
      const response = await fetch(sitemapUrl);

      if (!response.ok) {
        return [];
      }

      const xml = await response.text();
      const parsed = this.xmlParser.parse(xml);

      // Check if it's a sitemap index
      if (parsed.sitemapindex) {
        return await this.parseSitemapIndex(parsed.sitemapindex, baseUrl, depth);
      }

      // Check if it's a urlset
      if (parsed.urlset) {
        return this.parseUrlset(parsed.urlset, baseUrl);
      }

      return [];
    } catch (error) {
      this.logger.debug(`Error parsing sitemap ${sitemapUrl}: ${String(error)}`);
      return [];
    }
  }

  /**
   * Parse a sitemap index (recursively fetch child sitemaps)
   */
  private async parseSitemapIndex(
    sitemapindex: any,
    baseUrl: string,
    depth: number
  ): Promise<SitemapUrl[]> {
    const sitemaps = Array.isArray(sitemapindex.sitemap)
      ? sitemapindex.sitemap
      : [sitemapindex.sitemap];

    const allUrls: SitemapUrl[] = [];

    for (const sitemap of sitemaps) {
      if (sitemap?.loc) {
        const childSitemapUrl = sitemap.loc;
        this.logger.debug(`Fetching child sitemap: ${childSitemapUrl}`);

        const urls = await this.parseSitemap(childSitemapUrl, baseUrl, depth + 1);
        allUrls.push(...urls);
      }
    }

    return allUrls;
  }

  /**
   * Parse a urlset
   */
  private parseUrlset(urlset: any, baseUrl: string): SitemapUrl[] {
    const urls: SitemapUrl[] = [];

    const urlEntries = Array.isArray(urlset.url) ? urlset.url : [urlset.url];

    for (const entry of urlEntries) {
      if (entry?.loc) {
        const loc = entry.loc;

        // Only include internal URLs
        if (isInternalUrl(loc, baseUrl)) {
          urls.push({
            loc,
            lastmod: entry.lastmod || undefined,
          });
        }
      }
    }

    return urls;
  }

  /**
   * Dedupe URLs by normalized form
   */
  private dedupeUrls(urls: SitemapUrl[]): SitemapUrl[] {
    const seen = new Set<string>();
    const result: SitemapUrl[] = [];

    for (const url of urls) {
      const normalized = normalizeUrl(url.loc);

      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push({
          loc: normalized,
          lastmod: url.lastmod,
        });
      }
    }

    return result;
  }
}
