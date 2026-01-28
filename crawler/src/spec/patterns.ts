/**
 * Pattern Detection
 *
 * Cluster similar sections across pages into reusable patterns.
 */

import type { Section } from '../types/spec.js';
import type { Pattern, PatternStats } from '../types/spec.js';
import { generateSignature, generateSectionRef } from './signatures.js';

interface SectionWithContext {
  section: Section;
  slug: string;
  signature: string;
}

/**
 * Detect patterns from sections across multiple pages
 */
export function detectPatterns(pagesSections: Map<string, Section[]>): Pattern[] {
  // Collect all sections with context
  const allSections: SectionWithContext[] = [];

  for (const [slug, sections] of pagesSections.entries()) {
    for (const section of sections) {
      allSections.push({
        section,
        slug,
        signature: generateSignature(section),
      });
    }
  }

  // Group by signature
  const signatureGroups = new Map<string, SectionWithContext[]>();

  for (const sectionCtx of allSections) {
    const existing = signatureGroups.get(sectionCtx.signature) || [];
    existing.push(sectionCtx);
    signatureGroups.set(sectionCtx.signature, existing);
  }

  // Create patterns for signatures with multiple instances
  const patterns: Pattern[] = [];
  let patternIndex = 1;

  for (const [signature, group] of signatureGroups.entries()) {
    // Only create patterns for signatures that appear more than once
    if (group.length >= 2) {
      const pattern = createPattern(signature, group, patternIndex);
      patterns.push(pattern);
      patternIndex++;
    }
  }

  // Sort by count descending
  patterns.sort((a, b) => b.stats.count - a.stats.count);

  return patterns;
}

/**
 * Create a pattern from a group of similar sections
 */
function createPattern(signature: string, group: SectionWithContext[], index: number): Pattern {
  // Use first section as representative
  const representative = group[0].section;

  // Calculate stats
  const stats: PatternStats = {
    count: group.length,
    headingCount: representative.heading ? 1 : 0,
    textCount: representative.textBlocks?.length || 0,
    mediaCount: representative.media?.length || 0,
    ctaCount: representative.ctas?.length || 0,
    hasForm: false, // We don't track forms in sections yet
  };

  // Generate examples (limit to first 5)
  const examples = group.slice(0, 5).map((ctx) => generateSectionRef(ctx.slug, ctx.section.id));

  return {
    patternId: `pat_${representative.type}_${String(index).padStart(3, '0')}`,
    type: representative.type,
    signature,
    examples,
    stats,
  };
}
