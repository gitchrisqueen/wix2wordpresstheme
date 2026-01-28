/**
 * Sectionizer
 *
 * Converts DOM structure into ordered sections for PageSpec.
 * Uses semantic HTML structure, landmark roles, and content patterns.
 */

import type { Section, SectionType, Cta, Media } from '../types/spec.js';
import { normalizeWhitespace, extractText } from '../lib/textNormalize.js';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

interface DomNode {
  type: 'element' | 'text';
  tag?: string;
  attributes?: Record<string, string>;
  text?: string;
  children?: DomNode[];
}

/**
 * Generate deterministic section ID
 */
function generateSectionId(index: number): string {
  return `sec_${String(index + 1).padStart(3, '0')}`;
}

/**
 * Infer section type from DOM structure and content
 */
function inferSectionType($elem: cheerio.Cheerio<Element>): SectionType {
  const tag = $elem.prop('tagName')?.toLowerCase() || '';
  const role = $elem.attr('role');
  const classes = $elem.attr('class') || '';
  
  // Header
  if (tag === 'header' || role === 'banner' || classes.includes('header')) {
    return 'header';
  }
  
  // Footer
  if (tag === 'footer' || role === 'contentinfo' || classes.includes('footer')) {
    return 'footer';
  }
  
  // Form or contact
  const hasForm = $elem.find('form').length > 0;
  if (hasForm) {
    if (classes.match(/contact|reach|touch/i)) {
      return 'contactForm';
    }
    return 'contactForm';
  }
  
  // CTA section
  const ctaCount = $elem.find('a[href], button').length;
  const textLength = extractText($elem.html() || '').length;
  if (ctaCount > 0 && textLength < 200) {
    return 'cta';
  }
  
  // Gallery
  const imgCount = $elem.find('img').length;
  if (imgCount >= 3 && textLength < 100) {
    return 'gallery';
  }
  
  // Hero (first main section with h1 + CTA + background)
  const hasH1 = $elem.find('h1').length > 0;
  const hasCta = $elem.find('a[href], button').length > 0;
  if (hasH1 && hasCta && classes.match(/hero|banner|jumbotron/i)) {
    return 'hero';
  }
  
  // Feature grid (multiple items with headings)
  const h2Count = $elem.find('h2, h3').length;
  if (h2Count >= 3) {
    return 'featureGrid';
  }
  
  // Testimonial
  if (classes.match(/testimonial|review|quote/i)) {
    return 'testimonial';
  }
  
  // Pricing
  if (classes.match(/pricing|plan|package/i)) {
    return 'pricing';
  }
  
  // FAQ
  if (classes.match(/faq|question|accordion/i)) {
    return 'faq';
  }
  
  // Rich text (lots of p tags)
  const pCount = $elem.find('p').length;
  if (pCount >= 2) {
    return 'richText';
  }
  
  return 'unknown';
}

/**
 * Extract section heading
 */
function extractHeading($elem: cheerio.Cheerio<Element>): string | null {
  // Look for h1-h6 in order
  for (let i = 1; i <= 6; i++) {
    const heading = $elem.find(`h${i}`).first();
    if (heading.length > 0) {
      const text = normalizeWhitespace(heading.text());
      if (text) return text;
    }
  }
  return null;
}

/**
 * Extract text blocks from section
 */
function extractTextBlocks($elem: cheerio.Cheerio<Element>): string[] {
  const blocks: string[] = [];
  
  $elem.find('p, li, blockquote').each((_, el) => {
    const text = normalizeWhitespace(cheerio.load(el).text());
    if (text && text.length > 10) {
      blocks.push(text);
    }
  });
  
  return blocks;
}

/**
 * Extract CTAs from section
 */
function extractCtas($elem: cheerio.Cheerio<Element>): Cta[] {
  const ctas: Cta[] = [];
  
  $elem.find('a[href], button').each((_, el) => {
    const $el = cheerio.load(el);
    const text = normalizeWhitespace($el('a, button').text());
    const href = $el('a').attr('href') || null;
    
    if (text && text.length > 0 && text.length < 100) {
      ctas.push({ text, href });
    }
  });
  
  return ctas;
}

/**
 * Extract media from section
 */
function extractMedia($elem: cheerio.Cheerio<Element>): Media[] {
  const media: Media[] = [];
  
  $elem.find('img').each((_, el) => {
    const $el = cheerio.load(el);
    const src = $el('img').attr('src') || null;
    const alt = $el('img').attr('alt') || null;
    
    if (src) {
      media.push({
        type: 'image',
        src,
        alt,
        localAsset: null,
      });
    }
  });
  
  // Could add video support here
  
  return media;
}

/**
 * Generate DOM anchor for section
 */
function generateDomAnchor($elem: cheerio.Cheerio<Element>, index: number) {
  // Try to use ID if available
  const id = $elem.attr('id');
  if (id) {
    return { strategy: 'selector' as const, value: `#${id}` };
  }
  
  // Try to use semantic tag with index
  const tag = $elem.prop('tagName')?.toLowerCase();
  if (tag && ['header', 'footer', 'main', 'section', 'article', 'aside'].includes(tag)) {
    return { strategy: 'selector' as const, value: `${tag}:nth-of-type(${index + 1})` };
  }
  
  // Fall back to generic selector
  return { strategy: 'path' as const, value: `section-${index}` };
}

/**
 * Convert HTML to ordered sections
 */
export function sectionizeHtml(html: string): Section[] {
  const $ = cheerio.load(html);
  const sections: Section[] = [];
  
  // Find main content areas - prefer semantic HTML
  let $containers = $('main, [role="main"]');
  
  // If no main, try body
  if ($containers.length === 0) {
    $containers = $('body');
  }
  
  // Find section-level elements
  $containers.each((_, container) => {
    const $container = $(container);
    
    // Look for semantic sections
    const $sections = $container.find('> section, > article, > header, > footer, > aside, > div[class*="section"]');
    
    if ($sections.length === 0) {
      // If no sections found, treat whole container as one section
      const section = createSection($, $container, 0);
      if (section) {
        sections.push(section);
      }
    } else {
      // Process each section
      $sections.each((index, elem) => {
        const $elem = $(elem);
        const section = createSection($, $elem, index);
        if (section) {
          sections.push(section);
        }
      });
    }
  });
  
  return sections;
}

/**
 * Create a section from an element
 */
function createSection(
  _$: cheerio.CheerioAPI,
  $elem: cheerio.Cheerio<Element>,
  index: number
): Section | null {
  const type = inferSectionType($elem);
  const heading = extractHeading($elem);
  const textBlocks = extractTextBlocks($elem);
  const ctas = extractCtas($elem);
  const media = extractMedia($elem);
  const domAnchor = generateDomAnchor($elem, index);
  
  // Skip empty sections
  if (!heading && textBlocks.length === 0 && ctas.length === 0 && media.length === 0) {
    return null;
  }
  
  return {
    id: generateSectionId(index),
    type,
    heading,
    textBlocks,
    ctas,
    media,
    domAnchor,
  };
}

/**
 * Sectionize from DOM JSON structure
 */
export function sectionizeFromDom(domRoot: DomNode): Section[] {
  // Convert DOM node to HTML string for cheerio processing
  const html = domNodeToHtml(domRoot);
  return sectionizeHtml(html);
}

/**
 * Convert DOM node to HTML string (recursive)
 */
function domNodeToHtml(node: DomNode): string {
  if (node.type === 'text') {
    return node.text || '';
  }
  
  if (node.type === 'element' && node.tag) {
    const attrs = Object.entries(node.attributes || {})
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    const children = (node.children || []).map(domNodeToHtml).join('');
    
    return `<${node.tag}${attrs ? ' ' + attrs : ''}>${children}</${node.tag}>`;
  }
  
  return '';
}
