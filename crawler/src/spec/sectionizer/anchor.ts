/**
 * PASS 4: Stable Anchoring
 *
 * Generate stable DOM anchors for sections without relying on volatile attributes.
 */

import type { CheerioAPI, Cheerio, Element } from 'cheerio';
import type { DomAnchor } from '../../types/spec.js';

/**
 * Generate DOM anchor for a section
 */
export function generateDomAnchor(
  $: CheerioAPI,
  $elem: Cheerio<Element>,
  index: number,
  isLandmark: 'header' | 'footer' | 'main' | null = null
): DomAnchor {
  // Priority 1: Semantic tags with roles
  if (isLandmark) {
    const tag = $elem.prop('tagName')?.toLowerCase();
    const role = $elem.attr('role');

    if (role) {
      return { strategy: 'selector', value: `[role="${role}"]` };
    }

    if (tag === 'header' || tag === 'footer' || tag === 'main') {
      return { strategy: 'selector', value: tag };
    }
  }

  // Priority 2: Stable ID (non-volatile)
  const id = $elem.attr('id');
  if (id && !isVolatileId(id)) {
    return { strategy: 'selector', value: `#${id}` };
  }

  // Priority 3: Stable data attributes
  const dataAttrs = getStableDataAttributes($elem);
  if (dataAttrs.length > 0) {
    return { strategy: 'selector', value: dataAttrs[0] };
  }

  // Priority 4: Semantic tag with nth-of-type
  const tag = $elem.prop('tagName')?.toLowerCase();
  if (tag && ['section', 'article', 'aside', 'header', 'footer', 'main'].includes(tag)) {
    // Find the nth-of-type index
    const siblings = $elem.parent().children(tag);
    const nthIndex = siblings.index($elem) + 1;
    return { strategy: 'selector', value: `${tag}:nth-of-type(${nthIndex})` };
  }

  // Priority 5: Class-based selector (if stable)
  const classes = $elem.attr('class');
  if (classes) {
    const stableClasses = getStableClasses(classes);
    if (stableClasses.length > 0) {
      return { strategy: 'selector', value: `.${stableClasses[0]}` };
    }
  }

  // Fallback: path-based identifier
  return { strategy: 'path', value: `section-${index}` };
}

/**
 * Check if an ID looks volatile (Wix-generated)
 */
function isVolatileId(id: string): boolean {
  // Wix often uses comp-xxx, uniqueId-xxx, etc.
  return Boolean(
    id.match(/^(comp|wixui|style__|uniqueId|_)[a-zA-Z0-9_-]+$/) ||
    id.match(/^[a-f0-9]{8,}$/) // Long hex strings
  );
}

/**
 * Get stable data attributes
 */
function getStableDataAttributes($elem: Cheerio<Element>): string[] {
  const stableAttrs: string[] = [];
  const attrs = $elem.get(0)?.attribs || {};

  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('data-')) {
      // Exclude volatile patterns
      if (
        !key.match(/data-(hook|aid|state|reactid|reactroot)/i) &&
        !value.match(/^[a-f0-9]{8,}$/)
      ) {
        stableAttrs.push(`[${key}="${value}"]`);
      }
    }
  }

  return stableAttrs;
}

/**
 * Get stable CSS classes (exclude Wix-generated)
 */
function getStableClasses(classString: string): string[] {
  const classes = classString.split(/\s+/);
  return classes.filter((cls) => {
    if (!cls) return false;

    // Exclude Wix-generated patterns
    if (
      cls.match(/^(comp|wixui|style__|_)[a-zA-Z0-9_-]+$/) ||
      cls.match(/^[a-f0-9]{8,}$/)
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Generate a CSS path for an element (as fallback)
 */
export function generateCssPath($: CheerioAPI, $elem: Cheerio<Element>): string {
  const path: string[] = [];
  let current = $elem;

  while (current.length > 0 && current.prop('tagName') !== 'BODY') {
    const tag = current.prop('tagName')?.toLowerCase() || 'div';
    const siblings = current.parent().children(tag);
    const index = siblings.index(current) + 1;

    if (siblings.length > 1) {
      path.unshift(`${tag}:nth-of-type(${index})`);
    } else {
      path.unshift(tag);
    }

    current = current.parent();
  }

  return path.join(' > ');
}
