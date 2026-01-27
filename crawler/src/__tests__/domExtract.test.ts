/**
 * DOM Extraction Tests
 */

import { describe, it, expect } from 'vitest';
import { validateDOMNode } from '../crawl/domExtract.js';
import type { DOMNode } from '../types/crawl.js';

describe('DOM extraction', () => {
  describe('validateDOMNode', () => {
    it('should validate text nodes', () => {
      const node: DOMNode = {
        type: 'text',
        text: 'Hello world',
      };

      expect(validateDOMNode(node)).toBe(true);
    });

    it('should validate element nodes', () => {
      const node: DOMNode = {
        type: 'element',
        tag: 'div',
      };

      expect(validateDOMNode(node)).toBe(true);
    });

    it('should validate element nodes with attributes', () => {
      const node: DOMNode = {
        type: 'element',
        tag: 'a',
        attributes: {
          href: 'https://example.com',
          class: 'link',
        },
      };

      expect(validateDOMNode(node)).toBe(true);
    });

    it('should validate element nodes with children', () => {
      const node: DOMNode = {
        type: 'element',
        tag: 'div',
        children: [
          {
            type: 'text',
            text: 'Child text',
          },
          {
            type: 'element',
            tag: 'span',
          },
        ],
      };

      expect(validateDOMNode(node)).toBe(true);
    });

    it('should reject nodes without type', () => {
      const node = {} as DOMNode;

      expect(validateDOMNode(node)).toBe(false);
    });

    it('should reject text nodes without text', () => {
      const node = {
        type: 'text',
      } as DOMNode;

      expect(validateDOMNode(node)).toBe(false);
    });

    it('should reject element nodes without tag', () => {
      const node = {
        type: 'element',
      } as DOMNode;

      expect(validateDOMNode(node)).toBe(false);
    });

    it('should reject nodes with invalid children', () => {
      const node: DOMNode = {
        type: 'element',
        tag: 'div',
        children: [
          {
            type: 'text',
            text: 'Valid',
          },
          {} as DOMNode, // Invalid child
        ],
      };

      expect(validateDOMNode(node)).toBe(false);
    });

    it('should validate deeply nested structures', () => {
      const node: DOMNode = {
        type: 'element',
        tag: 'div',
        children: [
          {
            type: 'element',
            tag: 'section',
            children: [
              {
                type: 'element',
                tag: 'article',
                children: [
                  {
                    type: 'text',
                    text: 'Deep content',
                  },
                ],
              },
            ],
          },
        ],
      };

      expect(validateDOMNode(node)).toBe(true);
    });
  });
});
