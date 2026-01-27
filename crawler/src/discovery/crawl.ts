/**
 * Fallback Crawler
 *
 * Lightweight crawl using fetch + cheerio for link discovery.
 */

import * as cheerio from 'cheerio';
import { Logger } from '../lib/logger.js';
import { normalizeUrl, resolveUrl, filterAndNormalizeUrls, isValidHttpUrl } from '../lib/url.js';
import { RobotsChecker } from '../lib/robots.js';

export interface CrawlOptions {
  maxDepth: number;
  maxPages: number;
  keepQuery: boolean;
  respectRobots: boolean;
}

export interface CrawlResult {
  urls: Array<{
    url: string;
    depth: number;
    status: number | null;
  }>;
}

export class FallbackCrawler {
  private logger: Logger;
  private visited = new Set<string>();
  private queue: Array<{ url: string; depth: number }> = [];
  private results: CrawlResult['urls'] = [];
  private options: CrawlOptions;
  private robotsChecker: RobotsChecker | null = null;

  constructor(logger: Logger, options: Partial<CrawlOptions> = {}) {
    this.logger = logger;
    this.options = {
      maxDepth: options.maxDepth ?? 2,
      maxPages: options.maxPages ?? 500,
      keepQuery: options.keepQuery ?? false,
      respectRobots: options.respectRobots ?? true,
    };
  }

  /**
   * Crawl starting from base URL
   */
  async crawl(baseUrl: string): Promise<CrawlResult> {
    this.logger.info(`Starting fallback crawl from: ${baseUrl}`);

    // Initialize robots checker
    this.robotsChecker = new RobotsChecker(baseUrl, {
      respectRobots: this.options.respectRobots,
    });
    await this.robotsChecker.fetch();

    if (this.robotsChecker.hasFetched()) {
      this.logger.info('Loaded robots.txt');
    }

    // Normalize base URL
    const normalizedBase = normalizeUrl(baseUrl, {
      stripQuery: !this.options.keepQuery,
      stripFragment: true,
      removeTrailingSlash: false,
    });

    // Start BFS
    this.queue.push({ url: normalizedBase, depth: 0 });

    while (this.queue.length > 0 && this.results.length < this.options.maxPages) {
      const current = this.queue.shift();
      if (!current) break;

      const { url, depth } = current;

      // Skip if already visited
      if (this.visited.has(url)) {
        continue;
      }

      // Skip if robots disallows
      if (this.robotsChecker && !this.robotsChecker.isAllowed(url)) {
        this.logger.debug(`Blocked by robots.txt: ${url}`);
        continue;
      }

      // Mark as visited
      this.visited.add(url);

      // Fetch page
      const status = await this.fetchAndExtractLinks(url, baseUrl, depth);

      // Add to results
      this.results.push({ url, depth, status });

      this.logger.debug(
        `Crawled [${this.results.length}/${this.options.maxPages}] depth=${depth}: ${url}`
      );
    }

    this.logger.info(`Crawl complete. Found ${this.results.length} pages.`);

    return { urls: this.results };
  }

  /**
   * Fetch a page and extract links
   */
  private async fetchAndExtractLinks(
    url: string,
    baseUrl: string,
    depth: number
  ): Promise<number | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'wix2wordpresstheme/1.0 (Discovery Bot)',
        },
        redirect: 'follow',
      });

      const status = response.status;

      if (!response.ok) {
        this.logger.debug(`Failed to fetch ${url}: ${status}`);
        return status;
      }

      // Only extract links if we haven't reached max depth
      if (depth < this.options.maxDepth) {
        const html = await response.text();
        const links = this.extractLinks(html, url, baseUrl);

        // Add links to queue
        for (const link of links) {
          const normalized = normalizeUrl(link, {
            stripQuery: !this.options.keepQuery,
            stripFragment: true,
            removeTrailingSlash: true,
          });

          if (!this.visited.has(normalized)) {
            this.queue.push({ url: normalized, depth: depth + 1 });
          }
        }
      }

      return status;
    } catch (error) {
      this.logger.debug(`Error fetching ${url}: ${String(error)}`);
      return null;
    }
  }

  /**
   * Extract links from HTML using cheerio
   */
  private extractLinks(html: string, currentUrl: string, baseUrl: string): string[] {
    try {
      const $ = cheerio.load(html);
      const links: string[] = [];

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const resolved = resolveUrl(currentUrl, href);
            if (isValidHttpUrl(resolved)) {
              links.push(resolved);
            }
          } catch {
            // Skip invalid URLs
          }
        }
      });

      // Filter and normalize
      return filterAndNormalizeUrls(links, baseUrl, {
        stripQuery: !this.options.keepQuery,
        stripFragment: true,
        removeTrailingSlash: true,
      });
    } catch (error) {
      this.logger.debug(`Error parsing HTML for ${currentUrl}: ${String(error)}`);
      return [];
    }
  }
}
