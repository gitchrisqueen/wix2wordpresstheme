/**
 * Crawl Types
 *
 * Type definitions for crawl outputs and configuration.
 */

import { z } from 'zod';

// Meta types
export const MetaSchema = z.object({
  url: z.string().url(),
  finalUrl: z.string().url(),
  status: z.number().int().min(100).max(599),
  title: z.string(),
  metaDescription: z.string().nullable().optional(),
  canonical: z.string().url().nullable().optional(),
  og: z
    .object({
      title: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
      url: z.string().nullable().optional(),
      type: z.string().nullable().optional(),
    })
    .optional(),
  headings: z
    .object({
      h1: z.array(z.string()).optional(),
      h2: z.array(z.string()).optional(),
      h3: z.array(z.string()).optional(),
      h4: z.array(z.string()).optional(),
      h5: z.array(z.string()).optional(),
      h6: z.array(z.string()).optional(),
    })
    .optional(),
});

export type Meta = z.infer<typeof MetaSchema>;

// DOM types
export type DOMNodeType = 'element' | 'text';

export interface DOMNode {
  type: DOMNodeType;
  tag?: string;
  attributes?: Record<string, string>;
  text?: string;
  children?: DOMNode[];
}

export interface KeyElements {
  nav: string | null;
  footer: string | null;
  main: string | null;
}

export const DOMSnapshotSchema = z.object({
  url: z.string().url(),
  capturedAt: z.string(),
  hash: z.string(),
  root: z.any(), // Recursive type, validated separately
  keyElements: z.object({
    nav: z.string().nullable(),
    footer: z.string().nullable(),
    main: z.string().nullable(),
  }),
});

export type DOMSnapshot = z.infer<typeof DOMSnapshotSchema>;

// Asset types
export type AssetType = 'image' | 'font' | 'css' | 'js' | 'other';
export type DiscoveryMethod = 'dom' | 'css' | 'network';
export type AssetStatus = 'downloaded' | 'skipped' | 'failed' | 'third-party';

export const AssetSchema = z.object({
  url: z.string().url(),
  type: z.enum(['image', 'font', 'css', 'js', 'other']),
  discoveredBy: z.enum(['dom', 'css', 'network']),
  localPath: z.string().nullable().optional(),
  sha256: z.string().nullable().optional(),
  sizeBytes: z.number().int().min(0).nullable().optional(),
  status: z.enum(['downloaded', 'skipped', 'failed', 'third-party']),
  error: z.string().nullable().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export const AssetsManifestSchema = z.object({
  pageUrl: z.string().url(),
  capturedAt: z.string(),
  assets: z.array(AssetSchema),
});

export type AssetsManifest = z.infer<typeof AssetsManifestSchema>;

// Crawl summary types
export const CrawlResultSchema = z.object({
  url: z.string().url(),
  slug: z.string(),
  status: z.enum(['success', 'failed', 'skipped']),
  error: z.string().nullable().optional(),
  duration: z.number().int().nullable().optional(),
  outputPath: z.string().nullable().optional(),
});

export type CrawlResult = z.infer<typeof CrawlResultSchema>;

export const CrawlSummarySchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().int().min(0),
  baseUrl: z.string().url(),
  config: z.object({
    maxPages: z.number().int().nullable().optional(),
    concurrency: z.number().int(),
    timeoutMs: z.number().int(),
    retries: z.number().int(),
    breakpoints: z.array(z.string()),
    downloadAssets: z.boolean(),
    allowThirdParty: z.boolean(),
    downloadThirdPartyAssets: z.boolean(),
  }),
  stats: z.object({
    totalPages: z.number().int().min(0),
    successful: z.number().int().min(0),
    failed: z.number().int().min(0),
    skipped: z.number().int().min(0),
    totalAssets: z.number().int().min(0).optional(),
    assetsDownloaded: z.number().int().min(0).optional(),
  }),
  results: z.array(CrawlResultSchema),
});

export type CrawlSummary = z.infer<typeof CrawlSummarySchema>;

// Crawl config
export interface CrawlConfig {
  baseUrl: string;
  manifestPath: string;
  outDir: string;
  maxPages?: number;
  concurrency: number;
  timeoutMs: number;
  retries: number;
  waitUntil: 'networkidle' | 'domcontentloaded' | 'load';
  settleMs: number;
  breakpoints: string[];
  downloadAssets: boolean;
  allowThirdParty: boolean;
  downloadThirdPartyAssets: boolean;
  respectRobots: boolean;
  allowPartial: boolean;
  verbose: boolean;
}

// Page capture result
export interface PageCaptureResult {
  url: string;
  slug: string;
  success: boolean;
  error?: string;
  duration: number;
  outputPath?: string;
}

// Breakpoint config
export interface BreakpointConfig {
  name: string;
  width: number;
  height: number;
}

// Standard breakpoints
export const BREAKPOINTS: Record<string, BreakpointConfig> = {
  mobile: { name: 'mobile', width: 375, height: 667 },
  tablet: { name: 'tablet', width: 768, height: 1024 },
  desktop: { name: 'desktop', width: 1920, height: 1080 },
};
