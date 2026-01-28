/**
 * PASS 1: Block Candidate Generation
 *
 * Segment main content into candidate blocks using DOM structure.
 * Prefers semantic sections, falls back to structural grouping.
 */

import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';

export interface BlockCandidate {
  element: Element;
  index: number;
  source: 'semantic' | 'structural';
}

/**
 * Generate block candidates from a container
 */
export function generateBlockCandidates(
  $: CheerioAPI,
  $container: Cheerio<Element>
): BlockCandidate[] {
  const candidates: BlockCandidate[] = [];

  // First, look for semantic sections
  const $semanticSections = $container.find(
    '> section, > article, > aside, > div[class*="section"]'
  );

  if ($semanticSections.length > 0) {
    // Use semantic sections as candidates
    $semanticSections.each((index, elem) => {
      candidates.push({
        element: elem as Element,
        index,
        source: 'semantic',
      });
    });
  } else {
    // Fall back to structural grouping
    // Group direct children by visual/structural boundaries
    const $children = $container.children();

    if ($children.length === 0) {
      // Treat the container itself as a single block
      const elem = $container.get(0);
      if (elem) {
        candidates.push({
          element: elem as Element,
          index: 0,
          source: 'structural',
        });
      }
    } else {
      // Group children based on:
      // 1. Changes in background container
      // 2. Large media blocks
      // 3. Headings delimiting content
      let currentGroup: Element[] = [];
      let groupIndex = 0;

      $children.each((_, child) => {
        const $child = $(child);

        // Check if this is a significant boundary
        const isHeading = /^h[1-6]$/i.test($child.prop('tagName') || '');
        const hasBackground = Boolean(
          $child.css('background-color') && $child.css('background-color') !== 'transparent'
        );
        const isLargeMedia = $child.find('img, video').length > 0 && $child.text().length < 100;

        // If it's a boundary, finalize the current group
        if ((isHeading || hasBackground || isLargeMedia) && currentGroup.length > 0) {
          // Create a wrapper for the group
          const groupWrapper = createGroupWrapper($, currentGroup);
          if (groupWrapper) {
            candidates.push({
              element: groupWrapper,
              index: groupIndex++,
              source: 'structural',
            });
          }
          currentGroup = [];
        }

        currentGroup.push(child as Element);
      });

      // Finalize remaining group
      if (currentGroup.length > 0) {
        const groupWrapper = createGroupWrapper($, currentGroup);
        if (groupWrapper) {
          candidates.push({
            element: groupWrapper,
            index: groupIndex++,
            source: 'structural',
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Create a wrapper element for a group of elements
 */
function createGroupWrapper(_$: CheerioAPI, elements: Element[]): Element | null {
  if (elements.length === 0) return null;

  // If single element, return it
  if (elements.length === 1) {
    return elements[0];
  }

  // For multiple elements, create a virtual wrapper
  // In practice, we'll treat the first element as the anchor
  // and extract content from all elements
  return elements[0];
}

/**
 * Filter out empty or insignificant blocks
 */
export function filterBlockCandidates(
  $: CheerioAPI,
  candidates: BlockCandidate[]
): BlockCandidate[] {
  return candidates.filter((candidate) => {
    const $elem = $(candidate.element);

    // Skip if empty
    const text = $elem.text().trim();
    const hasHeading = $elem.find('h1, h2, h3, h4, h5, h6').length > 0;
    const hasMedia = $elem.find('img, video').length > 0;
    const hasForms = $elem.find('form, input, textarea').length > 0;
    const hasLinks = $elem.find('a[href]').length > 0;

    return text.length > 0 || hasHeading || hasMedia || hasForms || hasLinks;
  });
}
