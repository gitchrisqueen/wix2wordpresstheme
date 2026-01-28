/**
 * PASS 3: Content Extraction
 *
 * Extract structured content from each section.
 */

import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import type { Cta, Media, Form, FormField } from '../../types/spec.js';
import { normalizeWhitespace } from '../../lib/textNormalize.js';
import { isInternalUrl } from '../../lib/url.js';

/**
 * Extract section heading
 */
export function extractHeading($: CheerioAPI, $elem: Cheerio<Element>): string | null {
  // Look for h1-h6 in order
  for (let i = 1; i <= 6; i++) {
    const heading = $elem.find(`h${i}`).first();
    if (heading.length > 0) {
      const text = normalizeWhitespace(heading.text());
      if (text) return text;
    }
  }

  // Look for large text nodes that might be headings
  const $largeText = $elem.find('[style*="font-size"]').filter((_, el) => {
    const fontSize = $(el).css('font-size');
    if (fontSize) {
      const size = parseInt(fontSize, 10);
      return size > 20;
    }
    return false;
  });

  if ($largeText.length > 0) {
    const text = normalizeWhitespace($largeText.first().text());
    if (text && text.length < 100) {
      return text;
    }
  }

  return null;
}

/**
 * Extract text blocks from section
 */
export function extractTextBlocks(
  $: CheerioAPI,
  $elem: Cheerio<Element>,
  maxBlocks = 10
): string[] {
  const blocks: string[] = [];

  $elem.find('p, li, blockquote, div.text').each((_, el) => {
    if (blocks.length >= maxBlocks) return false;

    const text = normalizeWhitespace($(el).text());
    if (text && text.length > 10) {
      blocks.push(text);
    }
    return undefined; // Continue iteration
  });

  return blocks;
}

/**
 * Extract CTAs from section
 */
export function extractCtas(
  $: CheerioAPI,
  $elem: Cheerio<Element>,
  excludeNav = false
): Cta[] {
  const ctas: Cta[] = [];

  $elem.find('a[href], button, [role="button"], [data-testid*="button"]').each((_, el) => {
    const $el = $(el);

    // Skip nav-only links if requested
    if (excludeNav) {
      const $closestNav = $el.closest('nav, [role="navigation"]');
      if ($closestNav.length > 0) {
        return;
      }
    }

    const text = normalizeWhitespace($el.text());
    const href = $el.attr('href') || null;

    if (text && text.length > 0 && text.length < 100) {
      ctas.push({ text, href });
    }
  });

  return ctas;
}

/**
 * Extract media from section
 */
export function extractMedia($: CheerioAPI, $elem: Cheerio<Element>): Media[] {
  const media: Media[] = [];

  $elem.find('img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || null;
    const alt = $el.attr('alt') || null;

    if (src) {
      media.push({
        type: 'image',
        src,
        alt,
        localAsset: null,
      });
    }
  });

  // Extract videos
  $elem.find('video').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src') || $el.find('source').attr('src') || null;

    if (src) {
      media.push({
        type: 'video',
        src,
        alt: null,
        localAsset: null,
      });
    }
  });

  return media;
}

/**
 * Extract forms from section
 */
export function extractForms($: CheerioAPI, $elem: Cheerio<Element>): Form[] {
  const forms: Form[] = [];

  $elem.find('form').each((_, formElem) => {
    const $form = $(formElem);
    const name = $form.attr('name') || $form.attr('id') || null;
    const fields: FormField[] = [];

    $form.find('input, textarea, select').each((_, inputElem) => {
      const $input = $(inputElem);
      const type = $input.attr('type') || $input.prop('tagName')?.toLowerCase() || 'text';

      // Skip submit and button types
      if (type === 'submit' || type === 'button') {
        return;
      }

      // Infer label
      let label: string | null = null;

      // Try <label for="">
      const id = $input.attr('id');
      if (id) {
        const $label = $form.find(`label[for="${id}"]`);
        if ($label.length > 0) {
          label = normalizeWhitespace($label.text());
        }
      }

      // Try placeholder or aria-label
      if (!label) {
        label = $input.attr('placeholder') || $input.attr('aria-label') || null;
      }

      // Try nearby text
      if (!label) {
        const $parent = $input.parent();
        const parentText = normalizeWhitespace($parent.text());
        if (parentText && parentText.length < 50) {
          label = parentText;
        }
      }

      const required = $input.attr('required') !== undefined || $input.attr('aria-required') === 'true';

      fields.push({ label, type, required });
    });

    // Extract submit button text
    let submitText: string | null = null;
    const $submit = $form.find('button[type="submit"], input[type="submit"]').first();
    if ($submit.length > 0) {
      submitText = normalizeWhitespace($submit.text() || $submit.attr('value') || '');
    }

    forms.push({ name, fields, submitText });
  });

  return forms;
}

/**
 * Extract and count links
 */
export function extractLinkCounts(
  $: CheerioAPI,
  $elem: Cheerio<Element>,
  baseUrl: string
): { internal: number; external: number } {
  let internal = 0;
  let external = 0;

  $elem.find('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }

    try {
      const fullUrl = new URL(href, baseUrl).toString();
      if (isInternalUrl(fullUrl, baseUrl)) {
        internal++;
      } else {
        external++;
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return { internal, external };
}

/**
 * Extract style hints from section
 */
export function extractStyleHints(
  _$: CheerioAPI,
  $elem: Cheerio<Element>
): { backgroundColor: string | null; layout: 'fullWidth' | 'contained' | null } {
  // Background color
  let backgroundColor: string | null = null;
  const bgColor = $elem.css('background-color');
  if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
    backgroundColor = bgColor;
  }

  // Layout hint (fullWidth vs contained)
  let layout: 'fullWidth' | 'contained' | null = null;
  const width = $elem.css('width');
  const maxWidth = $elem.css('max-width');

  if (width === '100%' || width === '100vw') {
    layout = 'fullWidth';
  } else if (maxWidth && maxWidth !== 'none') {
    const maxWidthPx = parseInt(maxWidth, 10);
    if (maxWidthPx > 0 && maxWidthPx < 1400) {
      layout = 'contained';
    }
  }

  return { backgroundColor, layout };
}
