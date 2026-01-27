/**
 * Slug Generation Tests
 */

import { describe, it, expect } from 'vitest';
import { generateSlug, uniqueSlug } from '../lib/slug.js';

describe('slug generation', () => {
  describe('generateSlug', () => {
    it('should convert homepage to "home"', () => {
      expect(generateSlug('https://example.com')).toBe('home');
      expect(generateSlug('https://example.com/')).toBe('home');
    });

    it('should convert simple path to slug', () => {
      expect(generateSlug('https://example.com/about')).toBe('about');
      expect(generateSlug('https://example.com/contact-us')).toBe('contact-us');
    });

    it('should convert nested paths with double hyphens', () => {
      expect(generateSlug('https://example.com/blog/post-1')).toBe('blog--post-1');
      expect(generateSlug('https://example.com/products/category/item')).toBe(
        'products--category--item'
      );
    });

    it('should strip query strings and hash', () => {
      expect(generateSlug('https://example.com/page?foo=bar')).toBe('page');
      expect(generateSlug('https://example.com/page#section')).toBe('page');
      expect(generateSlug('https://example.com/page?foo=bar#section')).toBe('page');
    });

    it('should handle special characters', () => {
      expect(generateSlug('https://example.com/hello_world')).toBe('hello-world');
      // URL encoding may create intermediate characters
      const slug = generateSlug('https://example.com/café');
      expect(slug).toMatch(/^caf/); // Should start with 'caf' and be valid
    });

    it('should remove leading and trailing slashes', () => {
      expect(generateSlug('https://example.com/about/')).toBe('about');
      expect(generateSlug('https://example.com///about///')).toBe('about');
    });

    it('should truncate very long slugs', () => {
      const longPath = 'a'.repeat(250);
      const slug = generateSlug(`https://example.com/${longPath}`);

      expect(slug.length).toBeLessThanOrEqual(200);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(generateSlug('not a url')).toBe('invalid-url');
    });
  });

  describe('uniqueSlug', () => {
    it('should return base slug if not in existing set', () => {
      const existing = new Set<string>();
      const slug = uniqueSlug('https://example.com/about', existing);

      expect(slug).toBe('about');
    });

    it('should append hash if slug already exists', () => {
      const existing = new Set(['about']);
      const slug = uniqueSlug('https://example.com/about', existing);

      expect(slug).toMatch(/^about-[a-f0-9]{8}$/);
    });

    it('should generate different hashes for different URLs with same slug', () => {
      const existing = new Set(['page']);

      const slug1 = uniqueSlug('https://example.com/page?v=1', existing);
      const slug2 = uniqueSlug('https://example.com/page?v=2', existing);

      expect(slug1).toMatch(/^page-[a-f0-9]{8}$/);
      expect(slug2).toMatch(/^page-[a-f0-9]{8}$/);
      expect(slug1).not.toBe(slug2);
    });
  });
});
