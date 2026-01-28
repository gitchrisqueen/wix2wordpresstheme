/**
 * Debug Spec Artifacts Generation
 *
 * Generates detailed debug artifacts for spec generation to aid in diagnosing
 * segmentation decisions for new layouts.
 */

import type { CheerioAPI, Cheerio, Element } from 'cheerio';
import type { Logger } from '../lib/logger.js';
import { writeJsonFile } from '../lib/fileio.js';
import { join } from 'path';
import { writeFile } from 'fs/promises';

import type { BlockCandidate } from './sectionizer/blockCandidates.js';
import type { BlockFeatures } from './sectionizer/classify.js';
import type { Section } from '../types/spec.js';

export interface DebugBlockCandidate {
  index: number;
  source: string;
  tag: string;
  classes: string;
  id: string | null;
  textPreview: string;
  childCount: number;
}

export interface DebugFeatures extends BlockFeatures {
  blockIndex: number;
}

export interface DebugSection {
  id: string;
  type: string;
  heading: string | null;
  textBlockCount: number;
  ctaCount: number;
  mediaCount: number;
  formCount: number;
  notes: string[];
  confidence?: number;
}

/**
 * Generate debug artifacts for a page
 */
export async function generateDebugArtifacts(
  slug: string,
  outDir: string,
  data: {
    blockCandidates: BlockCandidate[];
    features: Array<{ candidate: BlockCandidate; features: BlockFeatures }>;
    sections: Section[];
  },
  $: CheerioAPI,
  logger: Logger
): Promise<void> {
  const debugDir = join(outDir, 'spec-debug', slug);

  try {
    // 1. Generate blockCandidates.json
    const debugCandidates: DebugBlockCandidate[] = data.blockCandidates.map((candidate) => {
      const $elem = $(candidate.element);
      return {
        index: candidate.index,
        source: candidate.source,
        tag: $elem.prop('tagName')?.toLowerCase() || 'div',
        classes: $elem.attr('class') || '',
        id: $elem.attr('id') || null,
        textPreview: $elem.text().trim().substring(0, 100),
        childCount: $elem.children().length,
      };
    });

    await writeJsonFile(join(debugDir, 'blockCandidates.json'), debugCandidates);

    // 2. Generate features.json
    const debugFeatures: DebugFeatures[] = data.features.map(({ candidate, features }) => ({
      blockIndex: candidate.index,
      ...features,
    }));

    await writeJsonFile(join(debugDir, 'features.json'), debugFeatures);

    // 3. Generate sections-preview.md
    const sectionsPreview = generateSectionsPreviewMarkdown(data.sections);
    await writeFile(join(debugDir, 'sections-preview.md'), sectionsPreview, 'utf-8');

    logger.debug(`Debug artifacts written to ${debugDir}`);
  } catch (error) {
    logger.warn(`Failed to generate debug artifacts: ${(error as Error).message}`);
  }
}

/**
 * Generate a markdown preview of sections
 */
function generateSectionsPreviewMarkdown(sections: Section[]): string {
  const lines: string[] = [];

  lines.push('# Sections Preview\n');
  lines.push(`Generated: ${new Date().toISOString()}\n`);
  lines.push(`Total Sections: ${sections.length}\n`);
  lines.push('---\n');

  for (const section of sections) {
    lines.push(`## Section: ${section.id}`);
    lines.push(`- **Type:** ${section.type}`);
    lines.push(`- **Heading:** ${section.heading || '(none)'}`);
    lines.push(`- **Text Blocks:** ${section.textBlocks?.length || 0}`);
    lines.push(`- **CTAs:** ${section.ctas?.length || 0}`);
    lines.push(`- **Media:** ${section.media?.length || 0}`);
    lines.push(`- **Forms:** ${section.forms?.length || 0}`);

    if (section.links) {
      lines.push(`- **Links:** ${section.links.internal} internal, ${section.links.external} external`);
    }

    if (section.notes && section.notes.length > 0) {
      lines.push(`- **Notes:**`);
      for (const note of section.notes) {
        lines.push(`  - ${note}`);
      }
    }

    if (section.domAnchor) {
      lines.push(`- **DOM Anchor:** ${section.domAnchor.strategy} = \`${section.domAnchor.value}\``);
    }

    if (section.styleHints) {
      lines.push('- **Style Hints:**');
      if (section.styleHints.backgroundColor) {
        lines.push(`  - Background: ${section.styleHints.backgroundColor}`);
      }
      if (section.styleHints.layout) {
        lines.push(`  - Layout: ${section.styleHints.layout}`);
      }
    }

    if (section.structuralHash) {
      lines.push(`- **Structural Hash:** ${section.structuralHash}`);
    }

    // Preview text blocks
    if (section.textBlocks && section.textBlocks.length > 0) {
      lines.push('\n**Text Preview:**');
      for (let i = 0; i < Math.min(3, section.textBlocks.length); i++) {
        const preview = section.textBlocks[i].substring(0, 80);
        lines.push(`> ${preview}${section.textBlocks[i].length > 80 ? '...' : ''}`);
      }
    }

    lines.push('\n---\n');
  }

  return lines.join('\n');
}

/**
 * Collect debug data during sectionization
 */
export interface DebugCollector {
  blockCandidates: BlockCandidate[];
  features: Array<{ candidate: BlockCandidate; features: BlockFeatures }>;
}

export function createDebugCollector(): DebugCollector {
  return {
    blockCandidates: [],
    features: [],
  };
}
