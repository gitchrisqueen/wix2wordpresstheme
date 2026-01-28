/**
 * PASS 0: Landmarks Detection
 *
 * Identify page landmarks (header, nav, footer, main content).
 * These landmarks become sections and define regions for further segmentation.
 */

import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';

export interface Landmark {
  type: 'header' | 'footer' | 'main';
  element: Element;
  selector: string;
}

/**
 * Detect page landmarks
 */
export function detectLandmarks($: CheerioAPI): {
  header: Landmark | null;
  footer: Landmark | null;
  main: Landmark | null;
} {
  let header: Landmark | null = null;
  let footer: Landmark | null = null;
  let main: Landmark | null = null;

  // Detect header/nav
  const $headers = $('header, [role="banner"], nav, [role="navigation"]').first();
  if ($headers.length > 0) {
    const elem = $headers.get(0);
    if (elem) {
      const tag = $(elem).prop('tagName')?.toLowerCase();
      const role = $(elem).attr('role');
      let selector = tag || 'div';
      if (role) {
        selector = `[role="${role}"]`;
      }
      header = {
        type: 'header',
        element: elem as Element,
        selector,
      };
    }
  }

  // Detect footer
  const $footers = $('footer, [role="contentinfo"]').first();
  if ($footers.length > 0) {
    const elem = $footers.get(0);
    if (elem) {
      const tag = $(elem).prop('tagName')?.toLowerCase();
      const role = $(elem).attr('role');
      let selector = tag || 'div';
      if (role) {
        selector = `[role="${role}"]`;
      }
      footer = {
        type: 'footer',
        element: elem as Element,
        selector,
      };
    }
  }

  // Detect main content
  const $mains = $('main, [role="main"]').first();
  if ($mains.length > 0) {
    const elem = $mains.get(0);
    if (elem) {
      const tag = $(elem).prop('tagName')?.toLowerCase();
      const role = $(elem).attr('role');
      let selector = tag || 'div';
      if (role) {
        selector = `[role="${role}"]`;
      }
      main = {
        type: 'main',
        element: elem as Element,
        selector,
      };
    }
  } else {
    // If no main, find the largest container that's not header or footer
    const $body = $('body');
    let largestContainer: Element | null = null;
    let largestSize = 0;

    $body.find('> div, > section, > article').each((_, elem) => {
      // Skip if it's the header or footer
      if (header && $(elem).is($(header.element))) return;
      if (footer && $(elem).is($(footer.element))) return;

      const size = $(elem).text().length;
      if (size > largestSize) {
        largestSize = size;
        largestContainer = elem as Element;
      }
    });

    if (largestContainer) {
      main = {
        type: 'main',
        element: largestContainer,
        selector: 'body > div:nth-of-type(1)', // Fallback selector
      };
    }
  }

  return { header, footer, main };
}

/**
 * Get main content area for segmentation
 * Returns the element that should be segmented into blocks
 */
export function getMainContentArea($: CheerioAPI, landmarks: ReturnType<typeof detectLandmarks>) {
  if (landmarks.main) {
    return $(landmarks.main.element);
  }
  // Fallback to body
  return $('body');
}
