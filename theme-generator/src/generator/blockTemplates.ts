/**
 * Block Templates Generator
 *
 * Generate WordPress block templates from PageSpec
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type { PageSpec, Section } from '../../../crawler/src/types/spec.js';
import type { GeneratorMode } from '../types/generator.js';
import type { GenerationMetadata } from '../types/generator.js';

const MAX_MEDIA_COUNT = 3;
const MAX_TEXT_BLOCKS = 5;
const MAX_CTA_COUNT = 3;

interface BlockTemplateResult {
  templatePath: string;
  mode: GeneratorMode;
}

/**
 * Generate block templates for a page
 */
export function generateBlockTemplates(
  themeDir: string,
  pageSpec: PageSpec,
  mode: GeneratorMode,
  assetMap: Map<string, string>,
  metadata: GenerationMetadata,
  logger: Logger
): BlockTemplateResult {
  const templateDir = join(themeDir, 'block-templates');
  if (!existsSync(templateDir)) {
    mkdirSync(templateDir, { recursive: true });
  }

  const templateSlug = pageSpec.slug || 'home';
  const templatePath = join(templateDir, `page-${templateSlug}.html`);

  let content = '';

  if (mode === 'block') {
    // Full block mode - render all sections as blocks
    content = generateFullBlockTemplate(pageSpec, assetMap, metadata, logger);
  } else if (mode === 'hybrid') {
    // Hybrid mode - use blocks for simple sections, PHP for complex ones
    content = generateHybridBlockTemplate(pageSpec, metadata, logger);
  } else {
    // PHP mode - minimal block template with PHP include
    content = generatePHPBlockTemplate(pageSpec, logger);
  }

  writeFileSync(templatePath, content, 'utf-8');
  logger.info(`Generated block template: ${templatePath}`);

  return {
    templatePath,
    mode,
  };
}

/**
 * Generate full block template (block mode)
 */
function generateFullBlockTemplate(
  pageSpec: PageSpec,
  assetMap: Map<string, string>,
  _metadata: GenerationMetadata,
  logger: Logger
): string {
  const blocks: string[] = [];

  // Add header
  blocks.push('<!-- wp:html -->');
  blocks.push('<?php get_header(); ?>');
  blocks.push('<!-- /wp:html -->');
  blocks.push('');

  for (const section of pageSpec.sections) {
    const blockContent = sectionToBlocks(section, assetMap, logger);
    if (blockContent) {
      blocks.push(blockContent);
    }
  }

  // Add fallback for empty sections
  if (pageSpec.sections.length === 0) {
    blocks.push('<!-- wp:html -->');
    blocks.push('<?php');
    blocks.push('if ( have_posts() ) {');
    blocks.push('  while ( have_posts() ) {');
    blocks.push('    the_post();');
    blocks.push('    the_content();');
    blocks.push('  }');
    blocks.push('}');
    blocks.push('?>');
    blocks.push('<!-- /wp:html -->');
  }

  // Add footer
  blocks.push('');
  blocks.push('<!-- wp:html -->');
  blocks.push('<?php get_footer(); ?>');
  blocks.push('<!-- /wp:html -->');

  return blocks.join('\n');
}

/**
 * Generate hybrid block template (hybrid mode)
 */
function generateHybridBlockTemplate(
  pageSpec: PageSpec,
  metadata: GenerationMetadata,
  logger: Logger
): string {
  const blocks: string[] = [];

  // Add header
  blocks.push('<!-- wp:html -->');
  blocks.push('<?php get_header(); ?>');
  blocks.push('<!-- /wp:html -->');
  blocks.push('');

  for (const section of pageSpec.sections) {
    if (isSimpleSection(section)) {
      const blockContent = sectionToBlocks(section, new Map(), logger);
      if (blockContent) {
        blocks.push(blockContent);
      }
    } else {
      // Complex section - use PHP fallback
      blocks.push(generatePHPFallback(section));
      metadata.phpFallbacksUsed++;
      logger.debug(`Using PHP fallback for complex section: ${section.id}`);
    }
  }

  // Add fallback for empty sections
  if (pageSpec.sections.length === 0) {
    blocks.push('<!-- wp:html -->');
    blocks.push('<?php');
    blocks.push('if ( have_posts() ) {');
    blocks.push('  while ( have_posts() ) {');
    blocks.push('    the_post();');
    blocks.push('    the_content();');
    blocks.push('  }');
    blocks.push('}');
    blocks.push('?>');
    blocks.push('<!-- /wp:html -->');
  }

  // Add footer
  blocks.push('');
  blocks.push('<!-- wp:html -->');
  blocks.push('<?php get_footer(); ?>');
  blocks.push('<!-- /wp:html -->');

  return blocks.join('\n');
}

/**
 * Generate PHP-only block template (php mode)
 */
function generatePHPBlockTemplate(pageSpec: PageSpec, _logger: Logger): string {
  return `<!-- wp:html -->
<?php
/**
 * Template: ${pageSpec.slug}
 */
get_header();
?>
<!-- /wp:html -->

<!-- wp:html -->
<?php
// Render sections for this page
$sections = get_page_sections('${pageSpec.slug}');
if ($sections) {
  foreach ($sections as $section) {
    render_section($section['id'], $section);
  }
} else {
  // Fallback to WordPress Loop if no sections found
  if ( have_posts() ) {
    while ( have_posts() ) {
      the_post();
      the_content();
    }
  }
}
?>
<!-- /wp:html -->

<!-- wp:html -->
<?php
get_footer();
?>
<!-- /wp:html -->`;
}

/**
 * Convert section to WordPress blocks
 */
function sectionToBlocks(
  section: Section,
  assetMap: Map<string, string>,
  _logger: Logger
): string | null {
  const blocks: string[] = [];

  // Container group
  blocks.push(`<!-- wp:group {"className":"section-${section.type}"} -->`);
  blocks.push('<div class="wp-block-group section-' + section.type + '">');

  // Heading
  if (section.heading) {
    const level = section.type === 'hero' ? 1 : 2;
    blocks.push(`<!-- wp:heading {"level":${level}} -->`);
    blocks.push(`<h${level} class="wp-block-heading">${escapeHtml(section.heading)}</h${level}>`);
    blocks.push('<!-- /wp:heading -->');
  }

  // Text blocks
  if (section.textBlocks && section.textBlocks.length > 0) {
    for (const text of section.textBlocks) {
      if (text.trim()) {
        blocks.push('<!-- wp:paragraph -->');
        blocks.push(`<p>${escapeHtml(text)}</p>`);
        blocks.push('<!-- /wp:paragraph -->');
      }
    }
  }

  // Media
  if (section.media && section.media.length > 0) {
    for (const media of section.media) {
      if (media.type === 'image' && media.src) {
        const localPath = assetMap.get(media.src) || media.localAsset || media.src;
        const alt = media.alt || '';
        blocks.push('<!-- wp:image -->');
        blocks.push('<figure class="wp-block-image">');
        blocks.push(
          `<img src="<?php echo esc_url(get_template_directory_uri() . '/${localPath}'); ?>" alt="${escapeHtml(alt)}" />`
        );
        blocks.push('</figure>');
        blocks.push('<!-- /wp:image -->');
      }
    }
  }

  // CTAs
  if (section.ctas && section.ctas.length > 0) {
    blocks.push('<!-- wp:buttons -->');
    blocks.push('<div class="wp-block-buttons">');
    for (const cta of section.ctas) {
      const href = cta.href || '#';
      blocks.push('<!-- wp:button -->');
      blocks.push('<div class="wp-block-button">');
      blocks.push(
        `<a class="wp-block-button__link" href="${escapeHtml(href)}">${escapeHtml(cta.text)}</a>`
      );
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
 * Generate PHP fallback block for complex sections
 */
function generatePHPFallback(section: Section): string {
  return `<!-- wp:html -->
<?php
$section = get_section_data('${section.id}');
if ($section) {
  render_section($section['id'], $section);
}
?>
<!-- /wp:html -->`;
}

/**
 * Check if section is simple enough for pure blocks
 */
function isSimpleSection(section: Section): boolean {
  // Simple sections: basic heading + text + CTA
  const hasComplexMedia = section.media && section.media.length > MAX_MEDIA_COUNT;
  const hasForm = section.type === 'contactForm';
  const hasComplexLayout = ['gallery', 'pricing', 'featureGrid'].includes(section.type);
  const hasManyItems =
    (section.textBlocks?.length || 0) > MAX_TEXT_BLOCKS ||
    (section.ctas?.length || 0) > MAX_CTA_COUNT;

  return !hasComplexMedia && !hasForm && !hasComplexLayout && !hasManyItems;
}

/**
 * Escape HTML for output
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
