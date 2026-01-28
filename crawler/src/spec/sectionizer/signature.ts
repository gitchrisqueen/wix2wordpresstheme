/**
 * Structural Signatures
 *
 * Generate signatures for DOM nodes to detect repeated structures (grids).
 */

import type { CheerioAPI, Cheerio, Element } from 'cheerio';
import { createHash } from 'crypto';

export interface NodeSignature {
  tagHistogram: Record<string, number>;
  hasMedia: boolean;
  linkCount: number;
  textLengthBucket: string;
  headingCount: number;
}

/**
 * Generate signature for a DOM node
 */
export function generateNodeSignature($: CheerioAPI, $elem: Cheerio<Element>): NodeSignature {
  const tagHistogram: Record<string, number> = {};

  // Count tags
  $elem.find('*').each((_, el) => {
    const tag = $(el).prop('tagName')?.toLowerCase();
    if (tag) {
      tagHistogram[tag] = (tagHistogram[tag] || 0) + 1;
    }
  });

  // Media presence
  const hasMedia = $elem.find('img, video').length > 0;

  // Link count
  const linkCount = $elem.find('a[href]').length;

  // Heading count
  const headingCount = $elem.find('h1, h2, h3, h4, h5, h6').length;

  // Text length bucket
  const textLength = $elem.text().trim().length;
  let textLengthBucket = 'empty';
  if (textLength > 0 && textLength < 50) {
    textLengthBucket = 'short';
  } else if (textLength >= 50 && textLength < 200) {
    textLengthBucket = 'medium';
  } else if (textLength >= 200) {
    textLengthBucket = 'long';
  }

  return {
    tagHistogram,
    hasMedia,
    linkCount,
    textLengthBucket,
    headingCount,
  };
}

/**
 * Compare two signatures for similarity
 */
export function signaturesMatch(sig1: NodeSignature, sig2: NodeSignature): boolean {
  // Check text length bucket
  if (sig1.textLengthBucket !== sig2.textLengthBucket) {
    return false;
  }

  // Check media presence
  if (sig1.hasMedia !== sig2.hasMedia) {
    return false;
  }

  // Check link count similarity (within tolerance)
  const linkDiff = Math.abs(sig1.linkCount - sig2.linkCount);
  if (linkDiff > 2) {
    return false;
  }

  // Check heading count similarity
  const headingDiff = Math.abs(sig1.headingCount - sig2.headingCount);
  if (headingDiff > 1) {
    return false;
  }

  // Check tag histogram similarity
  const tags1 = Object.keys(sig1.tagHistogram);
  const tags2 = Object.keys(sig2.tagHistogram);
  const allTags = new Set([...tags1, ...tags2]);

  let matchCount = 0;
  for (const tag of allTags) {
    const count1 = sig1.tagHistogram[tag] || 0;
    const count2 = sig2.tagHistogram[tag] || 0;
    if (Math.abs(count1 - count2) <= 1) {
      matchCount++;
    }
  }

  // Require at least 70% tag similarity
  return matchCount >= allTags.size * 0.7;
}

/**
 * Detect repeated sibling structures (grid items)
 */
export function detectRepeatedSiblings(
  $: CheerioAPI,
  $elem: Cheerio<Element>
): { isGrid: boolean; items: Element[] } {
  const $children = $elem.children();

  if ($children.length < 3) {
    return { isGrid: false, items: [] };
  }

  // Generate signatures for all children
  const signatures: { element: Element; signature: NodeSignature }[] = [];
  $children.each((_, child) => {
    const $child = $(child);
    const signature = generateNodeSignature($, $child);
    signatures.push({ element: child as Element, signature });
  });

  // Group by signature
  const groups: Map<string, { element: Element; signature: NodeSignature }[]> = new Map();

  for (const item of signatures) {
    let foundMatch = false;

    for (const [key, group] of groups.entries()) {
      if (group.length > 0 && signaturesMatch(item.signature, group[0].signature)) {
        group.push(item);
        foundMatch = true;
        break;
      }
    }

    if (!foundMatch) {
      const key = JSON.stringify(item.signature);
      groups.set(key, [item]);
    }
  }

  // Find the largest group
  let largestGroup: { element: Element; signature: NodeSignature }[] = [];
  for (const group of groups.values()) {
    if (group.length > largestGroup.length) {
      largestGroup = group;
    }
  }

  // If we have 3+ similar items, it's a grid
  if (largestGroup.length >= 3) {
    return {
      isGrid: true,
      items: largestGroup.map((item) => item.element),
    };
  }

  return { isGrid: false, items: [] };
}

/**
 * Generate structural hash for a section (for matching)
 */
export function generateStructuralHash($: CheerioAPI, $elem: Cheerio<Element>): string {
  const signature = generateNodeSignature($, $elem);
  const signatureString = JSON.stringify(signature);
  return createHash('md5').update(signatureString).digest('hex').substring(0, 16);
}
