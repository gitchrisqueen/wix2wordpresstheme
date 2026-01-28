/**
 * Sectionizer - Multi-Pass Pipeline
 *
 * Converts DOM structure into ordered sections for PageSpec.
 * Uses a layout-agnostic multi-pass approach:
 * - PASS 0: Identify landmarks (header, footer, main)
 * - PASS 1: Segment main content into candidate blocks
 * - PASS 2: Classify blocks using conservative heuristics
 * - PASS 3: Extract structured content from each section
 * - PASS 4: Generate stable anchors
 */

import type { Section } from '../types/spec.js';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

// Import pipeline modules
import { detectLandmarks, getMainContentArea } from './sectionizer/landmarks.js';
import {
  generateBlockCandidates,
  filterBlockCandidates,
  type BlockCandidate,
} from './sectionizer/blockCandidates.js';
import { computeBlockFeatures, classifyBlock, type BlockFeatures } from './sectionizer/classify.js';
import {
  extractHeading,
  extractTextBlocks,
  extractCtas,
  extractMedia,
  extractForms,
  extractLinkCounts,
  extractStyleHints,
} from './sectionizer/extract.js';
import { generateDomAnchor } from './sectionizer/anchor.js';
import { generateStructuralHash } from './sectionizer/signature.js';

interface DomNode {
  type: 'element' | 'text';
  tag?: string;
  attributes?: Record<string, string>;
  text?: string;
  children?: DomNode[];
}

export interface SectionizeDebugData {
  blockCandidates: BlockCandidate[];
  features: Array<{ candidate: BlockCandidate; features: BlockFeatures }>;
  $: cheerio.CheerioAPI;
}

/**
 * Generate deterministic section ID
 */
function generateSectionId(index: number): string {
  return `sec_${String(index + 1).padStart(3, '0')}`;
}

/**
 * Convert HTML to ordered sections using multi-pass pipeline
 */
export function sectionizeHtml(html: string, baseUrl = ''): Section[] {
  const result = sectionizeHtmlWithDebug(html, baseUrl);
  return result.sections;
}

/**
 * Convert HTML to ordered sections with debug data
 */
export function sectionizeHtmlWithDebug(
  html: string,
  baseUrl = ''
): { sections: Section[]; debug: SectionizeDebugData } {
  const $ = cheerio.load(html);
  const sections: Section[] = [];
  const debugData: SectionizeDebugData = {
    blockCandidates: [],
    features: [],
    $,
  };

  // PASS 0: Detect landmarks
  const landmarks = detectLandmarks($);

  // Add header as first section if present
  if (landmarks.header) {
    const $header = $(landmarks.header.element);
    const section = createSectionFromElement($, $header, sections.length, 'header', baseUrl);
    if (section) {
      sections.push(section);
    }
  }

  // PASS 1: Get main content area and generate block candidates
  const $mainArea = getMainContentArea($, landmarks);
  let blockCandidates = generateBlockCandidates($, $mainArea);

  // Filter out empty/insignificant blocks
  blockCandidates = filterBlockCandidates($, blockCandidates);

  // Store for debug
  debugData.blockCandidates = blockCandidates;

  // Process each block candidate
  for (const candidate of blockCandidates) {
    const $elem = $(candidate.element);

    // PASS 2: Compute features and classify
    const features = computeBlockFeatures($, $elem);
    const classification = classifyBlock(features, null);

    // Store for debug
    debugData.features.push({ candidate, features });

    // PASS 3 & 4: Extract content and create section
    const section = createSectionFromElement(
      $,
      $elem,
      sections.length,
      classification.type,
      baseUrl,
      classification.notes
    );

    if (section) {
      sections.push(section);
    }
  }

  // Add footer as last section if present
  if (landmarks.footer) {
    const $footer = $(landmarks.footer.element);
    const section = createSectionFromElement($, $footer, sections.length, 'footer', baseUrl);
    if (section) {
      sections.push(section);
    }
  }

  return { sections, debug: debugData };
}

/**
 * Create a section from an element using extraction pipeline
 */
function createSectionFromElement(
  $: cheerio.CheerioAPI,
  $elem: cheerio.Cheerio<Element>,
  index: number,
  sectionType: string,
  baseUrl: string,
  notes: string[] = []
): Section | null {
  // PASS 3: Extract content
  const heading = extractHeading($, $elem);
  const textBlocks = extractTextBlocks($, $elem);
  const excludeNavCtas = sectionType === 'header' || sectionType === 'footer';
  const ctas = extractCtas($, $elem, excludeNavCtas);
  const media = extractMedia($, $elem);
  const forms = extractForms($, $elem);
  const links = baseUrl ? extractLinkCounts($, $elem, baseUrl) : undefined;
  const styleHints = extractStyleHints($, $elem);

  // PASS 4: Generate anchor
  const landmarkType =
    sectionType === 'header' ? 'header' :
    sectionType === 'footer' ? 'footer' :
    sectionType === 'main' ? 'main' :
    null;
  const domAnchor = generateDomAnchor($, $elem, index, landmarkType);

  // Generate structural hash
  const structuralHash = generateStructuralHash($, $elem);

  // Skip empty sections (unless it's a landmark)
  const isLandmark = sectionType === 'header' || sectionType === 'footer';
  if (
    !isLandmark &&
    !heading &&
    textBlocks.length === 0 &&
    ctas.length === 0 &&
    media.length === 0 &&
    forms.length === 0
  ) {
    return null;
  }

  return {
    id: generateSectionId(index),
    type: sectionType as Section['type'],
    heading,
    textBlocks,
    ctas,
    media,
    domAnchor,
    forms,
    links,
    notes,
    styleHints: styleHints.backgroundColor || styleHints.layout ? styleHints : undefined,
    structuralHash,
  };
}

/**
 * Sectionize from DOM JSON structure
 */
export function sectionizeFromDom(domRoot: DomNode, baseUrl = ''): Section[] {
  // Convert DOM node to HTML string for cheerio processing
  const html = domNodeToHtml(domRoot);
  return sectionizeHtml(html, baseUrl);
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
