/**
 * PASS 2: Block Classification
 *
 * Classify block candidates using conservative heuristics.
 */

import type { CheerioAPI, Cheerio, Element } from 'cheerio';
import type { SectionType } from '../../types/spec.js';
import { extractText } from '../../lib/textNormalize.js';
import { detectRepeatedSiblings } from './signature.js';

export interface BlockFeatures {
  headingCount: number;
  textDensity: number;
  wordCount: number;
  mediaCount: number;
  linkCount: number;
  ctaLikeCount: number;
  hasForm: boolean;
  repeatedSiblings: boolean;
  tag: string;
  role: string | null;
  classes: string;
}

/**
 * Compute features for a block
 */
export function computeBlockFeatures(
  $: CheerioAPI,
  $elem: Cheerio<Element>
): BlockFeatures {
  // Heading count
  const headingCount = $elem.find('h1, h2, h3, h4, h5, h6').length;

  // Text density (characters/words)
  const text = extractText($elem.html() || '');
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = text.length;
  const textDensity = wordCount > 0 ? charCount / wordCount : 0;

  // Media count
  const mediaCount = $elem.find('img, video').length;

  // Link count
  const linkCount = $elem.find('a[href]').length;

  // CTA-like link/button detection
  const ctaLikeCount = $elem
    .find('a[href], button, [role="button"]')
    .toArray()
    .filter((el) => {
      const $el = $(el);
      const text = $el.text().toLowerCase().trim();
      // CTA keywords
      return Boolean(
        text.match(
          /\b(buy|sign|get|start|join|subscribe|learn|contact|download|try|demo|request|book)\b/i
        )
      );
    }).length;

  // Form presence
  const hasForm = $elem.find('form, input, textarea, select').length > 0;

  // Repeated siblings (grid detection)
  const gridInfo = detectRepeatedSiblings($, $elem);
  const repeatedSiblings = gridInfo.isGrid;

  // Element info
  const tag = $elem.prop('tagName')?.toLowerCase() || 'div';
  const role = $elem.attr('role') || null;
  const classes = $elem.attr('class') || '';

  return {
    headingCount,
    textDensity,
    wordCount,
    mediaCount,
    linkCount,
    ctaLikeCount,
    hasForm,
    repeatedSiblings,
    tag,
    role,
    classes,
  };
}

/**
 * Classify a block based on features
 */
export function classifyBlock(
  features: BlockFeatures,
  isLandmark: 'header' | 'footer' | null
): { type: SectionType; confidence: number; notes: string[] } {
  const notes: string[] = [];

  // Landmark sections
  if (isLandmark === 'header') {
    return { type: 'header', confidence: 1.0, notes };
  }
  if (isLandmark === 'footer') {
    return { type: 'footer', confidence: 1.0, notes };
  }

  // Check tag and role
  if (features.tag === 'header' || features.role === 'banner') {
    return { type: 'header', confidence: 0.9, notes };
  }
  if (features.tag === 'footer' || features.role === 'contentinfo') {
    return { type: 'footer', confidence: 0.9, notes };
  }

  // Form section
  if (features.hasForm) {
    if (features.classes.match(/contact|reach|touch/i)) {
      return { type: 'contactForm', confidence: 0.9, notes };
    }
    return { type: 'contactForm', confidence: 0.8, notes };
  }

  // FAQ (pattern in classes) - check before grid
  if (features.classes.match(/faq|question|accordion/i)) {
    return { type: 'faq', confidence: 0.9, notes };
  }

  // Pricing - check before grid
  if (features.classes.match(/pricing|plan|package/i)) {
    return { type: 'pricing', confidence: 0.9, notes };
  }

  // Testimonial - check before grid
  if (features.classes.match(/testimonial|review|quote/i)) {
    return { type: 'testimonial', confidence: 0.9, notes };
  }

  // Rich text (lots of text content, multiple paragraphs) - check before grid
  if (features.wordCount > 100) {
    return { type: 'richText', confidence: 0.8, notes };
  }

  // Grid section (repeated siblings) - check after more specific patterns
  if (features.repeatedSiblings) {
    notes.push('Detected repeated sibling structures');
    return { type: 'grid', confidence: 0.75, notes };
  }

  // Hero (first section with h1 + CTA + minimal text)
  if (
    features.headingCount > 0 &&
    features.ctaLikeCount > 0 &&
    features.textDensity < 100
  ) {
    if (features.classes.match(/hero|banner|jumbotron/i)) {
      return { type: 'hero', confidence: 0.85, notes };
    }
  }

  // CTA section (high CTA count, low text)
  if (features.ctaLikeCount >= 2 && features.textDensity < 50) {
    return { type: 'cta', confidence: 0.8, notes };
  }

  // Gallery (multiple images, little text)
  if (features.mediaCount >= 3 && features.wordCount < 100) {
    return { type: 'gallery', confidence: 0.8, notes };
  }

  // List (multiple headings)
  if (features.headingCount >= 3) {
    return { type: 'list', confidence: 0.7, notes };
  }

  // Unknown (low confidence)
  notes.push('Could not confidently classify section type');
  return { type: 'unknown', confidence: 0.5, notes };
}
