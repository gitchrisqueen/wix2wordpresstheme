/**
 * Generator Runner
 *
 * Orchestrates the WordPress theme generation process.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type {
  GeneratorOptions,
  GenerationMetadata,
  PageTemplateMapping,
} from '../types/generator.js';
import type { PageSpec } from '../../../crawler/src/types/spec.js';
import { createThemeScaffold } from './scaffold.js';
import { generateThemeJson } from './themeJson.js';
import { generateBlockTemplates } from './blockTemplates.js';
import { generatePHPSections } from './phpSections.js';
import { generateBlockPatterns } from './patterns.js';
import { copyAssets, generateAssetMap } from './assets.js';
import { generateReports } from './reports.js';

interface Manifest {
  baseUrl: string;
  pages: Array<{ url: string; path: string }>;
}

interface DesignTokens {
  colors?: {
    primary?: string | null;
    secondary?: string | null;
    palette?: string[];
  };
  typography?: {
    fontFamilies?: string[];
    baseFontSizePx?: number | null;
  };
  components?: {
    buttons?: {
      primary?: Record<string, unknown>;
      secondary?: Record<string, unknown>;
    };
  };
}

interface LayoutPatterns {
  patterns: Array<{
    patternId: string;
    type: string;
    signature: string;
    examples: string[];
    stats: {
      count: number;
      headingCount: number;
      textCount: number;
      mediaCount: number;
      ctaCount: number;
    };
  }>;
}

/**
 * Run the theme generator
 */
export async function runGenerator(options: GeneratorOptions, logger: Logger): Promise<void> {
  logger.info('Starting theme generation...');

  // Validate inputs
  validateInputs(options, logger);

  // Load inputs
  const manifest = loadManifest(options.inDir, logger);
  const designTokens = loadDesignTokens(options.inDir, logger);
  const layoutPatterns = loadLayoutPatterns(options.inDir, logger);
  const pageSpecs = loadPageSpecs(options.inDir, manifest, logger);

  logger.info(`Loaded ${pageSpecs.length} page specifications`);

  // Initialize metadata
  const metadata: GenerationMetadata = {
    mode: options.mode,
    pagesRendered: 0,
    patternsEmitted: 0,
    phpFallbacksUsed: 0,
    warnings: [],
    timestamp: new Date().toISOString(),
  };

  const pageMappings: PageTemplateMapping[] = [];

  // Create theme scaffold
  logger.info('Creating theme scaffold...');
  const themeDir = await createThemeScaffold(
    options.outDir,
    options.themeName,
    designTokens,
    logger
  );
  logger.info(`Theme directory: ${themeDir}`);

  // Generate theme.json
  if (options.emitThemeJson) {
    logger.info('Generating theme.json...');
    await generateThemeJson(themeDir, designTokens, metadata, logger);
  }

  // Copy assets
  logger.info('Copying assets...');
  const assetMap = await copyAssets(options.inDir, themeDir, manifest, logger);
  await generateAssetMap(themeDir, assetMap, logger);
  logger.info(`Copied ${assetMap.size} assets`);

  // Generate PHP section partials
  logger.info('Generating PHP section partials...');
  await generatePHPSections(themeDir, options.mode, metadata, logger);

  // Generate block patterns
  if (options.emitPatterns && layoutPatterns.patterns.length > 0) {
    logger.info('Generating block patterns...');
    await generateBlockPatterns(themeDir, layoutPatterns, metadata, logger);
    logger.info(`Generated ${metadata.patternsEmitted} patterns`);
  }

  // Generate block templates for each page
  logger.info('Generating page templates...');
  for (const pageSpec of pageSpecs) {
    try {
      const templateResult = await generateBlockTemplates(
        themeDir,
        pageSpec,
        options.mode,
        assetMap,
        metadata,
        logger
      );

      pageMappings.push({
        slug: pageSpec.slug,
        template: templateResult.templatePath,
        mode: templateResult.mode,
      });

      metadata.pagesRendered++;
    } catch (error) {
      logger.error(`Failed to generate template for ${pageSpec.slug}: ${(error as Error).message}`);
      metadata.warnings.push(`Failed to generate template for ${pageSpec.slug}`);
    }
  }

  logger.info(`Generated ${metadata.pagesRendered} page templates`);

  // Generate reports
  logger.info('Generating reports...');
  await generateReports(options, themeDir, pageMappings, metadata, pageSpecs, logger);

  logger.info('Theme generation complete');
}

/**
 * Validate input directories and required files
 */
function validateInputs(options: GeneratorOptions, logger: Logger): void {
  const inDir = options.inDir;

  if (!existsSync(inDir)) {
    throw new Error(`Input directory does not exist: ${inDir}`);
  }

  const manifestPath = join(inDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${inDir}`);
  }

  const specDir = join(inDir, 'spec');
  if (!existsSync(specDir)) {
    throw new Error(`spec directory not found in ${inDir}`);
  }

  logger.debug('Input validation passed');
}

/**
 * Load manifest.json
 */
function loadManifest(inDir: string, logger: Logger): Manifest {
  const path = join(inDir, 'manifest.json');
  logger.debug(`Loading manifest from ${path}`);

  try {
    const content = readFileSync(path, 'utf-8');
    const manifest = JSON.parse(content) as Manifest;
    return manifest;
  } catch (error) {
    throw new Error(`Failed to load manifest: ${(error as Error).message}`);
  }
}

/**
 * Load design-tokens.json
 */
function loadDesignTokens(inDir: string, logger: Logger): DesignTokens {
  const path = join(inDir, 'spec', 'design-tokens.json');
  logger.debug(`Loading design tokens from ${path}`);

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as DesignTokens;
  } catch (error) {
    logger.warn(`Failed to load design tokens: ${(error as Error).message}`);
    return {};
  }
}

/**
 * Load layout-patterns.json
 */
function loadLayoutPatterns(inDir: string, logger: Logger): LayoutPatterns {
  const path = join(inDir, 'spec', 'layout-patterns.json');
  logger.debug(`Loading layout patterns from ${path}`);

  try {
    const content = readFileSync(path, 'utf-8');
    return JSON.parse(content) as LayoutPatterns;
  } catch (error) {
    logger.warn(`Failed to load layout patterns: ${(error as Error).message}`);
    return { patterns: [] };
  }
}

/**
 * Load all page specifications
 */
function loadPageSpecs(inDir: string, manifest: Manifest, logger: Logger): PageSpec[] {
  const specs: PageSpec[] = [];

  for (const page of manifest.pages) {
    // Derive slug from path
    const slug = page.path === '/' ? 'home' : page.path.slice(1).replace(/\//g, '-');
    const specPath = join(inDir, 'pages', slug, 'spec', 'pagespec.json');

    if (existsSync(specPath)) {
      try {
        const content = readFileSync(specPath, 'utf-8');
        const spec = JSON.parse(content) as PageSpec;
        specs.push(spec);
      } catch (error) {
        logger.warn(`Failed to load page spec for ${slug}: ${(error as Error).message}`);
      }
    } else {
      logger.debug(`Page spec not found for ${slug}: ${specPath}`);
    }
  }

  return specs;
}
