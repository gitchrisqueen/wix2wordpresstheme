/**
 * Reports Generator
 *
 * Generate generation reports and summaries
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type { 
  GeneratorOptions, 
  GenerationMetadata, 
  PageTemplateMapping,
  GenerationSummary
} from '../types/generator.js';
import type { PageSpec } from '../../../crawler/src/types/spec.js';

/**
 * Generate all reports for the generation process
 */
export function generateReports(
  options: GeneratorOptions,
  themeDir: string,
  pageMappings: PageTemplateMapping[],
  metadata: GenerationMetadata,
  pageSpecs: Map<string, PageSpec>,
  logger: Logger,
): void {
  // Generate .generated/generation.json
  generateGenerationMetadata(themeDir, options, metadata, logger);

  // Generate page mappings
  generatePageMappings(themeDir, pageMappings, logger);

  // Generate summary in output directory
  generateSummaryReport(options.outDir, options, pageMappings, metadata, logger);

  // Generate comprehensive report in docs/REPORTS
  generateComprehensiveReport(options, themeDir, pageMappings, metadata, pageSpecs, logger);

  logger.info('All reports generated successfully');
}

/**
 * Generate generation metadata file
 */
function generateGenerationMetadata(
  themeDir: string,
  options: GeneratorOptions,
  metadata: GenerationMetadata,
  logger: Logger,
): void {
  const generatedDir = join(themeDir, '.generated');
  if (!existsSync(generatedDir)) {
    mkdirSync(generatedDir, { recursive: true });
  }

  const metadataPath = join(generatedDir, 'generation.json');
  const metadataData = {
    version: '1.0.0',
    generatedAt: metadata.timestamp,
    options: {
      baseUrl: options.baseUrl,
      themeName: options.themeName,
      mode: options.mode,
      emitPatterns: options.emitPatterns,
      emitThemeJson: options.emitThemeJson,
    },
    metadata: {
      mode: metadata.mode,
      pagesRendered: metadata.pagesRendered,
      patternsEmitted: metadata.patternsEmitted,
      phpFallbacksUsed: metadata.phpFallbacksUsed,
      warnings: metadata.warnings,
    },
  };

  writeFileSync(metadataPath, JSON.stringify(metadataData, null, 2), 'utf-8');
  logger.debug(`Generated metadata: ${metadataPath}`);
}

/**
 * Generate page mappings file
 */
function generatePageMappings(
  themeDir: string,
  pageMappings: PageTemplateMapping[],
  logger: Logger,
): void {
  const generatedDir = join(themeDir, '.generated');
  if (!existsSync(generatedDir)) {
    mkdirSync(generatedDir, { recursive: true });
  }

  const mappingsPath = join(generatedDir, 'page-mapping.json');
  const mappingsData = {
    version: '1.0.0',
    mappings: pageMappings,
  };

  writeFileSync(mappingsPath, JSON.stringify(mappingsData, null, 2), 'utf-8');
  logger.debug(`Generated page mappings: ${mappingsPath}`);
}

/**
 * Generate summary report in output directory
 */
function generateSummaryReport(
  outDir: string,
  options: GeneratorOptions,
  pageMappings: PageTemplateMapping[],
  metadata: GenerationMetadata,
  logger: Logger,
): void {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const summaryPath = join(outDir, 'generate-summary.json');

  const summary: GenerationSummary = {
    baseUrl: options.baseUrl,
    themeName: options.themeName,
    mode: options.mode,
    outputDir: outDir,
    generatedAt: metadata.timestamp,
    metadata: {
      pagesRendered: metadata.pagesRendered,
      patternsEmitted: metadata.patternsEmitted,
      phpFallbacksUsed: metadata.phpFallbacksUsed,
    },
    pages: pageMappings.map((mapping) => ({
      slug: mapping.slug,
      template: mapping.template,
      mode: mapping.mode,
      status: 'success' as const,
    })),
    warnings: metadata.warnings,
    errors: [],
  };

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
  logger.info(`Generated summary report: ${summaryPath}`);
}

/**
 * Generate comprehensive report in docs/REPORTS directory
 */
function generateComprehensiveReport(
  options: GeneratorOptions,
  _themeDir: string,
  pageMappings: PageTemplateMapping[],
  metadata: GenerationMetadata,
  pageSpecs: Map<string, PageSpec>,
  logger: Logger,
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const reportDir = join(process.cwd(), 'docs', 'REPORTS', timestamp);

  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  // Generate run.json
  generateRunJson(reportDir, options, pageMappings, metadata, pageSpecs, logger);

  // Generate summary.md
  generateSummaryMarkdown(reportDir, options, pageMappings, metadata, pageSpecs, logger);

  logger.info(`Generated comprehensive report: ${reportDir}`);
}

/**
 * Generate run.json (machine-readable)
 */
function generateRunJson(
  reportDir: string,
  options: GeneratorOptions,
  pageMappings: PageTemplateMapping[],
  metadata: GenerationMetadata,
  pageSpecs: Map<string, PageSpec>,
  logger: Logger,
): void {
  const runJsonPath = join(reportDir, 'run.json');

  const pageDetails = pageMappings.map((mapping) => {
    const spec = pageSpecs.get(mapping.slug);
    return {
      slug: mapping.slug,
      template: mapping.template,
      mode: mapping.mode,
      status: 'success' as const,
      sectionCount: spec?.sections.length || 0,
      templateHint: spec?.templateHint || 'unknown',
    };
  });

  const runData = {
    version: '1.0.0',
    stage: 'generate',
    generatedAt: metadata.timestamp,
    baseUrl: options.baseUrl,
    themeName: options.themeName,
    mode: options.mode,
    options: {
      emitPatterns: options.emitPatterns,
      emitThemeJson: options.emitThemeJson,
    },
    results: {
      pagesRendered: metadata.pagesRendered,
      patternsEmitted: metadata.patternsEmitted,
      phpFallbacksUsed: metadata.phpFallbacksUsed,
      totalWarnings: metadata.warnings.length,
    },
    pages: pageDetails,
    warnings: metadata.warnings,
  };

  writeFileSync(runJsonPath, JSON.stringify(runData, null, 2), 'utf-8');
  logger.debug(`Generated run.json: ${runJsonPath}`);
}

/**
 * Generate summary.md (human-readable)
 */
function generateSummaryMarkdown(
  reportDir: string,
  options: GeneratorOptions,
  pageMappings: PageTemplateMapping[],
  metadata: GenerationMetadata,
  pageSpecs: Map<string, PageSpec>,
  logger: Logger,
): void {
  const summaryMdPath = join(reportDir, 'summary.md');

  const lines: string[] = [];

  lines.push('# WordPress Theme Generation Report');
  lines.push('');
  lines.push(`**Generated:** ${new Date(metadata.timestamp).toLocaleString()}`);
  lines.push(`**Base URL:** ${options.baseUrl}`);
  lines.push(`**Theme Name:** ${options.themeName}`);
  lines.push(`**Generation Mode:** ${options.mode}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Pages Rendered:** ${metadata.pagesRendered}`);
  lines.push(`- **Patterns Emitted:** ${metadata.patternsEmitted}`);
  lines.push(`- **PHP Fallbacks Used:** ${metadata.phpFallbacksUsed}`);
  lines.push(`- **Warnings:** ${metadata.warnings.length}`);
  lines.push('');

  lines.push('## Pages');
  lines.push('');
  lines.push('| Slug | Template | Mode | Sections | Template Hint |');
  lines.push('|------|----------|------|----------|---------------|');
  
  for (const mapping of pageMappings) {
    const spec = pageSpecs.get(mapping.slug);
    const sectionCount = spec?.sections.length || 0;
    const templateHint = spec?.templateHint || 'unknown';
    const slug = mapping.slug || 'home';
    lines.push(
      `| ${slug} | ${mapping.template} | ${mapping.mode} | ${sectionCount} | ${templateHint} |`
    );
  }
  lines.push('');

  if (metadata.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const warning of metadata.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  lines.push('## Files Generated');
  lines.push('');
  lines.push('- Theme scaffold and core files');
  lines.push('- Block templates for each page');
  if (metadata.mode !== 'block') {
    lines.push('- PHP section templates');
  }
  if (metadata.patternsEmitted > 0) {
    lines.push(`- ${metadata.patternsEmitted} block patterns`);
  }
  if (options.emitThemeJson) {
    lines.push('- theme.json configuration');
  }
  lines.push('- Asset files and asset map');
  lines.push('- Generation metadata and page mappings');
  lines.push('');

  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Review the generated theme in the output directory');
  lines.push('2. Copy the theme to your WordPress installation');
  lines.push('3. Activate the theme in WordPress admin');
  lines.push('4. Run verification tests to compare with original site');
  lines.push('5. Customize the theme as needed');
  lines.push('');

  writeFileSync(summaryMdPath, lines.join('\n'), 'utf-8');
  logger.debug(`Generated summary.md: ${summaryMdPath}`);
}
