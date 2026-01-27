/**
 * Manifest Types and Validation
 *
 * Type definitions and Zod schemas for manifest validation.
 */

import { z } from 'zod';

export const PageSchema = z.object({
  url: z.string().url(),
  path: z.string(),
  canonical: z.string().url(),
  title: z.string().nullable(),
  status: z.number().nullable(),
  depth: z.number().int().min(0),
  source: z.enum(['sitemap', 'crawl']),
  lastmod: z.string().nullable().optional(),
});

export const DiscoverySchema = z.object({
  method: z.enum(['sitemap', 'crawl', 'hybrid']),
  respectRobots: z.boolean(),
  sitemapsTried: z.array(z.string()).optional(),
  crawl: z
    .object({
      maxDepth: z.number().int(),
      maxPages: z.number().int(),
    })
    .optional(),
});

export const StatsSchema = z.object({
  pagesFound: z.number().int().min(0),
  pagesIncluded: z.number().int().min(0),
  excludedExternal: z.number().int().min(0),
  excludedDuplicates: z.number().int().min(0),
  excludedByRules: z.number().int().min(0),
});

export const ManifestSchema = z.object({
  version: z.string(),
  baseUrl: z.string().url(),
  generatedAt: z.string(),
  discovery: DiscoverySchema,
  pages: z.array(PageSchema),
  stats: StatsSchema,
});

export type Page = z.infer<typeof PageSchema>;
export type Discovery = z.infer<typeof DiscoverySchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type Manifest = z.infer<typeof ManifestSchema>;

/**
 * Validate manifest against schema
 */
export function validateManifest(data: unknown): Manifest {
  return ManifestSchema.parse(data);
}
