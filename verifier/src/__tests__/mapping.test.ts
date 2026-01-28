/**
 * Mapping Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getPageMappingBySlug,
  getPageMappingByWixUrl,
  getPageMappingByWpUrl,
} from '../lib/mapping.js';
import type { PageMapping } from '../types.js';

describe('mapping', () => {
  const mockMappings: PageMapping[] = [
    {
      wixUrl: 'https://example.wixsite.com/mysite',
      wpUrl: 'http://localhost:8080/',
      slug: 'home',
      title: 'Home',
    },
    {
      wixUrl: 'https://example.wixsite.com/mysite/about',
      wpUrl: 'http://localhost:8080/about/',
      slug: 'about',
      title: 'About Us',
    },
    {
      wixUrl: 'https://example.wixsite.com/mysite/contact',
      wpUrl: 'http://localhost:8080/contact/',
      slug: 'contact',
      title: 'Contact',
    },
  ];

  describe('getPageMappingBySlug', () => {
    it('should find mapping by slug', () => {
      const result = getPageMappingBySlug(mockMappings, 'about');
      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
      expect(result?.title).toBe('About Us');
    });

    it('should return undefined for non-existent slug', () => {
      const result = getPageMappingBySlug(mockMappings, 'nonexistent');
      expect(result).toBeUndefined();
    });

    it('should find home page', () => {
      const result = getPageMappingBySlug(mockMappings, 'home');
      expect(result).toBeDefined();
      expect(result?.slug).toBe('home');
    });
  });

  describe('getPageMappingByWixUrl', () => {
    it('should find mapping by Wix URL', () => {
      const result = getPageMappingByWixUrl(
        mockMappings,
        'https://example.wixsite.com/mysite/about',
      );
      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
    });

    it('should return undefined for non-existent URL', () => {
      const result = getPageMappingByWixUrl(
        mockMappings,
        'https://example.wixsite.com/mysite/nonexistent',
      );
      expect(result).toBeUndefined();
    });

    it('should handle trailing slashes', () => {
      const result = getPageMappingByWixUrl(
        mockMappings,
        'https://example.wixsite.com/mysite/about/',
      );
      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
    });
  });

  describe('getPageMappingByWpUrl', () => {
    it('should find mapping by WP URL', () => {
      const result = getPageMappingByWpUrl(
        mockMappings,
        'http://localhost:8080/about/',
      );
      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
    });

    it('should handle trailing slashes', () => {
      const result = getPageMappingByWpUrl(
        mockMappings,
        'http://localhost:8080/about',
      );
      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
    });

    it('should handle home page', () => {
      const result = getPageMappingByWpUrl(mockMappings, 'http://localhost:8080/');
      expect(result).toBeDefined();
      expect(result?.slug).toBe('home');
    });

    it('should normalize case', () => {
      const result = getPageMappingByWpUrl(
        mockMappings,
        'http://localhost:8080/ABOUT/',
      );
      expect(result).toBeDefined();
      expect(result?.slug).toBe('about');
    });
  });
});
