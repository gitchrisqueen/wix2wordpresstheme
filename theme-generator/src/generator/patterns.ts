/**
 * Block Patterns Generator
 *
 * Generate WordPress block patterns from layout patterns
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type { Pattern, LayoutPatterns } from '../../../crawler/src/types/spec.js';
import type { GenerationMetadata } from '../types/generator.js';

interface PatternCategory {
  slug: string;
  title: string;
}

/**
 * Generate block patterns from layout patterns
 */
export function generateBlockPatterns(
  themeDir: string,
  layoutPatterns: LayoutPatterns | null,
  metadata: GenerationMetadata,
  logger: Logger,
): void {
  if (!layoutPatterns || !layoutPatterns.patterns || layoutPatterns.patterns.length === 0) {
    logger.info('No layout patterns to generate');
    return;
  }

  const patternsDir = join(themeDir, 'patterns');
  if (!existsSync(patternsDir)) {
    mkdirSync(patternsDir, { recursive: true });
  }

  let emittedCount = 0;

  for (const pattern of layoutPatterns.patterns) {
    try {
      const content = generatePatternFile(pattern, logger);
      const fileName = sanitizePatternId(pattern.patternId) + '.php';
      const filePath = join(patternsDir, fileName);
      
      writeFileSync(filePath, content, 'utf-8');
      logger.debug(`Generated pattern: ${fileName}`);
      emittedCount++;
    } catch (error) {
      logger.warn(`Failed to generate pattern ${pattern.patternId}`, error);
      metadata.warnings.push(`Pattern generation failed: ${pattern.patternId}`);
    }
  }

  metadata.patternsEmitted = emittedCount;
  logger.info(`Generated ${emittedCount} block patterns`);
}

/**
 * Generate pattern file content
 */
function generatePatternFile(pattern: Pattern, _logger: Logger): string {
  const title = generatePatternTitle(pattern);
  const description = generatePatternDescription(pattern);
  const categories = determinePatternCategories(pattern);
  const content = generatePatternContent(pattern);

  return `<?php
/**
 * Title: ${title}
 * Slug: ${sanitizePatternId(pattern.patternId)}
 * Categories: ${categories.map((c) => c.slug).join(', ')}
 * Description: ${description}
 */
?>
${content}
`;
}

/**
 * Generate pattern title from pattern data
 */
function generatePatternTitle(pattern: Pattern): string {
  // Convert pattern type to title case
  const baseTitle = pattern.type
    .split(/(?=[A-Z])/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Add pattern stats for context
  const stats = pattern.stats;
  const elements: string[] = [];
  
  if (stats.headingCount && stats.headingCount > 0) {
    elements.push('heading');
  }
  if (stats.textCount && stats.textCount > 0) {
    elements.push('text');
  }
  if (stats.mediaCount && stats.mediaCount > 0) {
    elements.push('image');
  }
  if (stats.ctaCount && stats.ctaCount > 0) {
    elements.push('button');
  }

  if (elements.length > 0) {
    return `${baseTitle} with ${elements.join(', ')}`;
  }

  return baseTitle;
}

/**
 * Generate pattern description
 */
function generatePatternDescription(pattern: Pattern): string {
  const stats = pattern.stats;
  const parts: string[] = [];

  if (stats.headingCount && stats.headingCount > 0) {
    parts.push(`${stats.headingCount} heading${stats.headingCount > 1 ? 's' : ''}`);
  }
  if (stats.textCount && stats.textCount > 0) {
    parts.push(`${stats.textCount} text block${stats.textCount > 1 ? 's' : ''}`);
  }
  if (stats.mediaCount && stats.mediaCount > 0) {
    parts.push(`${stats.mediaCount} image${stats.mediaCount > 1 ? 's' : ''}`);
  }
  if (stats.ctaCount && stats.ctaCount > 0) {
    parts.push(`${stats.ctaCount} button${stats.ctaCount > 1 ? 's' : ''}`);
  }
  if (stats.hasForm) {
    parts.push('form');
  }

  const description = parts.length > 0 
    ? `A ${pattern.type} section with ${parts.join(', ')}.`
    : `A ${pattern.type} section.`;

  return description + ` Found ${stats.count} time${stats.count > 1 ? 's' : ''} in source site.`;
}

/**
 * Determine pattern categories
 */
function determinePatternCategories(pattern: Pattern): PatternCategory[] {
  const categories: PatternCategory[] = [];
  const type = pattern.type.toLowerCase();

  // Map section types to WordPress pattern categories
  if (type === 'hero') {
    categories.push({ slug: 'hero', title: 'Hero' });
    categories.push({ slug: 'featured', title: 'Featured' });
  } else if (type === 'cta') {
    categories.push({ slug: 'call-to-action', title: 'Call to Action' });
  } else if (type === 'testimonial') {
    categories.push({ slug: 'testimonials', title: 'Testimonials' });
  } else if (type === 'pricing') {
    categories.push({ slug: 'call-to-action', title: 'Call to Action' });
  } else if (type === 'gallery') {
    categories.push({ slug: 'gallery', title: 'Gallery' });
  } else if (type === 'featuregrid') {
    categories.push({ slug: 'features', title: 'Features' });
  } else if (type === 'contactform') {
    categories.push({ slug: 'contact', title: 'Contact' });
  } else if (type === 'header') {
    categories.push({ slug: 'header', title: 'Header' });
  } else if (type === 'footer') {
    categories.push({ slug: 'footer', title: 'Footer' });
  } else {
    categories.push({ slug: 'content', title: 'Content' });
  }

  return categories;
}

/**
 * Generate pattern block content
 */
function generatePatternContent(pattern: Pattern): string {
  const stats = pattern.stats;
  const blocks: string[] = [];

  // Container group
  blocks.push(`<!-- wp:group {"className":"pattern-${sanitizePatternId(pattern.patternId)}"} -->`);
  blocks.push(`<div class="wp-block-group pattern-${sanitizePatternId(pattern.patternId)}">`);

  // Add heading if pattern has headings
  if (stats.headingCount && stats.headingCount > 0) {
    blocks.push('<!-- wp:heading -->');
    blocks.push('<h2 class="wp-block-heading">Section Heading</h2>');
    blocks.push('<!-- /wp:heading -->');
  }

  // Add text blocks if pattern has text
  if (stats.textCount && stats.textCount > 0) {
    for (let i = 0; i < Math.min(stats.textCount, 3); i++) {
      blocks.push('<!-- wp:paragraph -->');
      blocks.push('<p>Add your content here. This is a placeholder text that demonstrates the pattern structure.</p>');
      blocks.push('<!-- /wp:paragraph -->');
    }
  }

  // Add media if pattern has media
  if (stats.mediaCount && stats.mediaCount > 0) {
    blocks.push('<!-- wp:image -->');
    blocks.push('<figure class="wp-block-image">');
    blocks.push('<img src="" alt="" />');
    blocks.push('</figure>');
    blocks.push('<!-- /wp:image -->');
  }

  // Add buttons if pattern has CTAs
  if (stats.ctaCount && stats.ctaCount > 0) {
    blocks.push('<!-- wp:buttons -->');
    blocks.push('<div class="wp-block-buttons">');
    for (let i = 0; i < Math.min(stats.ctaCount, 2); i++) {
      blocks.push('<!-- wp:button -->');
      blocks.push('<div class="wp-block-button">');
      blocks.push('<a class="wp-block-button__link" href="#">Button Text</a>');
      blocks.push('</div>');
      blocks.push('<!-- /wp:button -->');
    }
    blocks.push('</div>');
    blocks.push('<!-- /wp:buttons -->');
  }

  // Close container
  blocks.push('</div>');
  blocks.push('<!-- /wp:group -->');

  return blocks.join('\n');
}

/**
 * Sanitize pattern ID for file name and slug
 */
function sanitizePatternId(patternId: string): string {
  return patternId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
