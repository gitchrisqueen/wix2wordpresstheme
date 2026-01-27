/**
 * Tests for sitemap parser
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SitemapParser } from '../discovery/sitemap.js';
import { Logger, LogLevel } from '../lib/logger.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('SitemapParser', () => {
  let logger: Logger;
  let parser: SitemapParser;

  beforeEach(() => {
    logger = new Logger(LogLevel.ERROR); // Suppress logs in tests
    parser = new SitemapParser(logger);
    vi.clearAllMocks();
  });

  it('should parse a simple urlset sitemap', async () => {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
    <lastmod>2024-01-01</lastmod>
  </url>
  <url>
    <loc>https://example.com/page2</loc>
  </url>
</urlset>`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml,
    });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.method).toBe('sitemap');
    expect(result.urls).toHaveLength(2);
    expect(result.urls[0].loc).toBe('https://example.com/page1');
    expect(result.urls[0].lastmod).toBe('2024-01-01');
    expect(result.urls[1].loc).toBe('https://example.com/page2');
  });

  it('should parse a sitemap index', async () => {
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/sitemap1.xml</loc>
  </sitemap>
</sitemapindex>`;

    const sitemap1Xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
  </url>
</urlset>`;

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => indexXml,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => sitemap1Xml,
      });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.urls).toHaveLength(1);
    expect(result.urls[0].loc).toBe('https://example.com/page1');
  });

  it('should filter out external URLs', async () => {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
  </url>
  <url>
    <loc>https://other.com/page2</loc>
  </url>
</urlset>`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml,
    });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.urls).toHaveLength(1);
    expect(result.urls[0].loc).toBe('https://example.com/page1');
  });

  it('should deduplicate URLs', async () => {
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page1</loc>
  </url>
  <url>
    <loc>https://example.com/page1/</loc>
  </url>
</urlset>`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => sitemapXml,
    });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.urls).toHaveLength(1);
  });

  it('should return empty result when no sitemap found', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.method).toBe('none');
    expect(result.urls).toHaveLength(0);
    expect(result.sitemapsTried.length).toBeGreaterThan(0);
  });

  it('should handle malformed XML gracefully', async () => {
    const badXml = 'This is not valid XML';

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => badXml,
    });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.urls).toHaveLength(0);
  });

  it('should try multiple sitemap locations', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await parser.discoverSitemaps('https://example.com');

    expect(result.sitemapsTried).toContain('https://example.com/sitemap.xml');
    expect(result.sitemapsTried).toContain('https://example.com/sitemap_index.xml');
    expect(result.sitemapsTried.length).toBeGreaterThan(1);
  });
});
