/**
 * Type definitions for theme generator
 */

import { z } from 'zod';

// Generator modes
export const GeneratorModeSchema = z.enum(['block', 'php', 'hybrid']);
export type GeneratorMode = z.infer<typeof GeneratorModeSchema>;

// Generator options
export interface GeneratorOptions {
  baseUrl: string;
  inDir: string;
  outDir: string;
  themeName: string;
  mode: GeneratorMode;
  emitPatterns: boolean;
  emitThemeJson: boolean;
}

// Theme metadata
export interface ThemeMetadata {
  name: string;
  themeUri?: string;
  author?: string;
  authorUri?: string;
  description: string;
  version: string;
  license?: string;
  textDomain: string;
  tags?: string[];
}

// Asset mapping
export interface AssetMapping {
  originalUrl: string;
  themeAssetPath: string;
  hash: string;
  type: string;
}

// Page template mapping
export interface PageTemplateMapping {
  slug: string;
  template: string;
  mode: GeneratorMode;
}

// Generation metadata
export interface GenerationMetadata {
  mode: GeneratorMode;
  pagesRendered: number;
  patternsEmitted: number;
  phpFallbacksUsed: number;
  warnings: string[];
  timestamp: string;
}

// Generation summary
export const GenerationSummarySchema = z.object({
  baseUrl: z.string(),
  themeName: z.string(),
  mode: GeneratorModeSchema,
  outputDir: z.string(),
  generatedAt: z.string(),
  metadata: z.object({
    pagesRendered: z.number(),
    patternsEmitted: z.number(),
    phpFallbacksUsed: z.number(),
  }),
  pages: z.array(
    z.object({
      slug: z.string(),
      template: z.string(),
      mode: GeneratorModeSchema,
      status: z.enum(['success', 'partial', 'failed']),
    })
  ),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

export type GenerationSummary = z.infer<typeof GenerationSummarySchema>;

// Pattern metadata
export interface PatternMetadata {
  patternId: string;
  title: string;
  description: string;
  categories: string[];
  content: string;
}

// Block template
export interface BlockTemplate {
  slug: string;
  title: string;
  content: string;
}

// Section render context
export interface SectionRenderContext {
  section: {
    id: string;
    type: string;
    heading?: string | null;
    textBlocks?: string[];
    ctas?: Array<{ text: string; href?: string | null }>;
    media?: Array<{
      type: string;
      src?: string | null;
      alt?: string | null;
      localAsset?: string | null;
    }>;
  };
  assetMap: Map<string, string>;
  themePath: string;
}
