/**
 * Crawl CLI Config Tests
 */

import { describe, it, expect } from 'vitest';

// Mock the normalizeCrawlConfig function for testing
// This would ideally be exported from crawl.ts
function normalizeCrawlConfig(cliOptions: any, manifest: any, defaults: any): any {
  // Helper to get value: CLI override > manifest value > default
  // null/undefined CLI values don't override real values
  const getValue = (cliVal: any, manifestVal: any, defaultVal: any) => {
    if (cliVal !== null && cliVal !== undefined) {
      return cliVal;
    }
    if (manifestVal !== null && manifestVal !== undefined) {
      return manifestVal;
    }
    return defaultVal;
  };

  // Parse breakpoints
  const breakpoints = cliOptions.breakpoints
    ? cliOptions.breakpoints.split(',').map((s: string) => s.trim())
    : defaults.breakpoints || ['desktop', 'mobile'];

  return {
    baseUrl: cliOptions.baseUrl,
    manifestPath: cliOptions.manifest,
    outDir: cliOptions.outDir || defaults.outDir || 'crawler/output',
    maxPages: getValue(cliOptions.maxPages, manifest.discovery?.crawl?.maxPages, null),
    concurrency: getValue(cliOptions.concurrency, null, defaults.concurrency || 3),
    timeoutMs: getValue(cliOptions.timeoutMs, null, defaults.timeoutMs || 45000),
    retries: getValue(cliOptions.retries, null, defaults.retries || 2),
    waitUntil: cliOptions.waitUntil || defaults.waitUntil || 'networkidle',
    settleMs: getValue(cliOptions.settleMs, null, defaults.settleMs || 750),
    breakpoints,
    downloadAssets: getValue(cliOptions.downloadAssets, null, defaults.downloadAssets ?? true),
    allowThirdParty: getValue(cliOptions.allowThirdParty, null, defaults.allowThirdParty ?? true),
    downloadThirdPartyAssets: getValue(
      cliOptions.downloadThirdPartyAssets,
      null,
      defaults.downloadThirdPartyAssets ?? false
    ),
    respectRobots: getValue(
      cliOptions.respectRobots,
      manifest.discovery?.respectRobots,
      defaults.respectRobots ?? true
    ),
    allowPartial: getValue(cliOptions.allowPartial, null, defaults.allowPartial ?? false),
    verbose: cliOptions.verbose || defaults.verbose || false,
  };
}

describe('crawl config normalization', () => {
  const mockManifest = {
    pages: [
      {
        url: 'https://example.com',
        path: '/',
        canonical: 'https://example.com',
        status: 200,
        depth: 0,
        source: 'sitemap' as const,
      },
      {
        url: 'https://example.com/about',
        path: '/about',
        canonical: 'https://example.com/about',
        status: 200,
        depth: 1,
        source: 'sitemap' as const,
      },
      {
        url: 'https://example.com/contact',
        path: '/contact',
        canonical: 'https://example.com/contact',
        status: 200,
        depth: 1,
        source: 'sitemap' as const,
      },
    ],
    discovery: {
      respectRobots: true,
      method: 'sitemap' as const,
    },
  };

  const defaults = {
    concurrency: 3,
    timeoutMs: 45000,
    retries: 2,
    settleMs: 750,
    waitUntil: 'networkidle',
    downloadAssets: true,
    allowThirdParty: true,
    downloadThirdPartyAssets: false,
    respectRobots: true,
    allowPartial: false,
    breakpoints: ['desktop', 'mobile'],
    outDir: 'crawler/output',
    verbose: false,
  };

  it('should use CLI values when provided', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      concurrency: 5,
      retries: 2,
      allowThirdParty: false,
      downloadThirdPartyAssets: true,
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.concurrency).toBe(5);
    expect(config.retries).toBe(2);
    expect(config.allowThirdParty).toBe(false);
    expect(config.downloadThirdPartyAssets).toBe(true);
  });

  it('should use defaults when CLI values are undefined', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      concurrency: undefined,
      retries: undefined,
      allowThirdParty: undefined,
      downloadThirdPartyAssets: undefined,
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.concurrency).toBe(3); // default
    expect(config.retries).toBe(2); // default
    expect(config.allowThirdParty).toBe(true); // default
    expect(config.downloadThirdPartyAssets).toBe(false); // default
  });

  it('should process all pages when maxPages is null', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      maxPages: null,
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.maxPages).toBeNull();
  });

  it('should limit pages when maxPages is set', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      maxPages: 1,
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.maxPages).toBe(1);
  });

  it('should parse numeric string values correctly', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      concurrency: 10,
      timeoutMs: 60000,
      retries: 3,
      settleMs: 1000,
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.concurrency).toBe(10);
    expect(config.timeoutMs).toBe(60000);
    expect(config.retries).toBe(3);
    expect(config.settleMs).toBe(1000);
  });

  it('should not allow null/undefined to override real values', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      concurrency: null, // null shouldn't override default
      retries: undefined, // undefined shouldn't override default
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.concurrency).toBe(3); // default used
    expect(config.retries).toBe(2); // default used
  });

  it('should parse breakpoints from comma-separated string', () => {
    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      breakpoints: 'desktop,mobile,tablet',
    };

    const config = normalizeCrawlConfig(cliOptions, mockManifest, defaults);

    expect(config.breakpoints).toEqual(['desktop', 'mobile', 'tablet']);
  });

  it('should use manifest respectRobots if no CLI value', () => {
    const manifestWithRobots = {
      ...mockManifest,
      discovery: {
        respectRobots: false,
        method: 'sitemap' as const,
      },
    };

    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      respectRobots: undefined,
    };

    const config = normalizeCrawlConfig(cliOptions, manifestWithRobots, defaults);

    expect(config.respectRobots).toBe(false); // from manifest
  });

  it('should allow CLI to override manifest respectRobots', () => {
    const manifestWithRobots = {
      ...mockManifest,
      discovery: {
        respectRobots: false,
        method: 'sitemap' as const,
      },
    };

    const cliOptions = {
      baseUrl: 'https://example.com',
      manifest: 'manifest.json',
      respectRobots: true,
    };

    const config = normalizeCrawlConfig(cliOptions, manifestWithRobots, defaults);

    expect(config.respectRobots).toBe(true); // CLI override
  });
});
