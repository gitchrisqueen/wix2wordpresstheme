/**
 * Section Signatures
 *
 * Generate signatures for sections to enable pattern matching.
 */

import type { Section } from '../types/spec.js';

/**
 * Generate a signature for a section based on its structure
 */
export function generateSignature(section: Section): string {
  const parts: string[] = [];

  // Section type
  parts.push(`type:${section.type}`);

  // Heading presence
  parts.push(`h:${section.heading ? '1' : '0'}`);

  // Text blocks count (bucketed)
  const textCount = section.textBlocks?.length || 0;
  const textBucket = textCount === 0 ? '0' : textCount === 1 ? '1' : textCount < 5 ? 'few' : 'many';
  parts.push(`txt:${textBucket}`);

  // Media count (bucketed)
  const mediaCount = section.media?.length || 0;
  const mediaBucket =
    mediaCount === 0 ? '0' : mediaCount === 1 ? '1' : mediaCount < 5 ? 'few' : 'many';
  parts.push(`med:${mediaBucket}`);

  // CTA count (bucketed)
  const ctaCount = section.ctas?.length || 0;
  const ctaBucket = ctaCount === 0 ? '0' : ctaCount === 1 ? '1' : ctaCount < 3 ? 'few' : 'many';
  parts.push(`cta:${ctaBucket}`);

  return parts.join('|');
}

/**
 * Check if two sections have similar structure
 */
export function sectionsMatch(sig1: string, sig2: string): boolean {
  return sig1 === sig2;
}

/**
 * Generate section reference string (slug#sectionId)
 */
export function generateSectionRef(slug: string, sectionId: string): string {
  return `${slug}#${sectionId}`;
}
