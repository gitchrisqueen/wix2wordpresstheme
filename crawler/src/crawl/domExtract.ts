/**
 * DOM Extraction
 *
 * Extracts and serializes DOM to a pruned JSON structure for analysis.
 */

import type { Page } from 'playwright';
import type { DOMNode, DOMSnapshot, KeyElements } from '../types/crawl.js';
import { hashObject } from '../lib/hash.js';

/**
 * Attributes to capture from elements
 */
const CAPTURED_ATTRIBUTES = [
  'id',
  'class',
  'href',
  'src',
  'srcset',
  'alt',
  'role',
  'aria-label',
  'name',
  'type',
  'data-testid',
  'rel',
  'title',
];

/**
 * Tags to skip entirely (scripts, styles, etc.)
 */
const SKIP_TAGS = ['script', 'style', 'noscript', 'iframe', 'svg'];

/**
 * Extract DOM snapshot from page
 */
export async function extractDOM(page: Page, url: string): Promise<DOMSnapshot> {
  // Execute in browser context to serialize DOM
  const serializedDOM = await page.evaluate(
    ({ capturedAttrs, skipTags }) => {
      function serializeNode(node: Node): any {
        // Skip comments and other non-element/text nodes
        if (node.nodeType === Node.COMMENT_NODE) {
          return null;
        }

        // Text node
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (!text) return null;

          return {
            type: 'text',
            text: text.replace(/\s+/g, ' '), // Normalize whitespace
          };
        }

        // Element node
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tag = element.tagName.toLowerCase();

          // Skip certain tags
          if (skipTags.includes(tag)) {
            return null;
          }

          // Build attributes object
          const attributes: Record<string, string> = {};
          for (const attr of capturedAttrs) {
            const value = element.getAttribute(attr);
            if (value) {
              attributes[attr] = value;
            }
          }

          // Serialize children
          const children: any[] = [];
          for (const child of Array.from(node.childNodes)) {
            const serialized = serializeNode(child);
            if (serialized) {
              children.push(serialized);
            }
          }

          const result: any = {
            type: 'element',
            tag,
          };

          if (Object.keys(attributes).length > 0) {
            result.attributes = attributes;
          }

          if (children.length > 0) {
            result.children = children;
          }

          return result;
        }

        return null;
      }

      const body = document.body;
      return serializeNode(body);
    },
    { capturedAttrs: CAPTURED_ATTRIBUTES, skipTags: SKIP_TAGS }
  );

  // Extract key elements
  const keyElements = await extractKeyElements(page);

  // Build snapshot
  const snapshot: DOMSnapshot = {
    url,
    capturedAt: new Date().toISOString(),
    hash: hashObject(serializedDOM),
    root: serializedDOM as DOMNode,
    keyElements,
  };

  return snapshot;
}

/**
 * Extract key structural element selectors
 */
async function extractKeyElements(page: Page): Promise<KeyElements> {
  return await page.evaluate(() => {
    const keyElements: KeyElements = {
      nav: null,
      footer: null,
      main: null,
    };

    // Find primary nav
    const navSelectors = [
      'nav[role="navigation"]',
      'nav',
      '[role="navigation"]',
      'header nav',
      '.navigation',
      '#navigation',
    ];

    for (const selector of navSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        keyElements.nav = selector;
        break;
      }
    }

    // Find footer
    const footerSelectors = ['footer', '[role="contentinfo"]', '.footer', '#footer'];

    for (const selector of footerSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        keyElements.footer = selector;
        break;
      }
    }

    // Find main content
    const mainSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.content',
      '#content',
    ];

    for (const selector of mainSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        keyElements.main = selector;
        break;
      }
    }

    return keyElements;
  });
}

/**
 * Validate DOM snapshot structure
 */
export function validateDOMNode(node: DOMNode): boolean {
  if (!node || !node.type) {
    return false;
  }

  if (node.type === 'text') {
    return typeof node.text === 'string';
  }

  if (node.type === 'element') {
    if (!node.tag || typeof node.tag !== 'string') {
      return false;
    }

    if (node.children) {
      return Array.isArray(node.children) && node.children.every(validateDOMNode);
    }

    return true;
  }

  return false;
}
