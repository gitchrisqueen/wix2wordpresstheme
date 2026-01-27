/**
 * Tests for URL normalization and filtering utilities
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  resolveUrl,
  isInternalUrl,
  hasExcludedExtension,
  hasExcludedPathPrefix,
  isValidHttpUrl,
  hasExcludedScheme,
  isFragmentOnly,
  filterAndNormalizeUrls,
  getUrlPath,
} from '../lib/url.js';

describe('normalizeUrl', () => {
  it('should lowercase scheme and host', () => {
    const result = normalizeUrl('HTTP://EXAMPLE.COM/Path');
    expect(result).toBe('http://example.com/Path');
  });

  it('should remove default port 80 for http', () => {
    const result = normalizeUrl('http://example.com:80/path');
    expect(result).toBe('http://example.com/path');
  });

  it('should remove default port 443 for https', () => {
    const result = normalizeUrl('https://example.com:443/path');
    expect(result).toBe('https://example.com/path');
  });

  it('should keep non-default ports', () => {
    const result = normalizeUrl('https://example.com:8080/path');
    expect(result).toBe('https://example.com:8080/path');
  });

  it('should remove trailing slash except for root', () => {
    expect(normalizeUrl('https://example.com/path/')).toBe('https://example.com/path');
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('should strip fragment by default', () => {
    const result = normalizeUrl('https://example.com/path#section');
    expect(result).toBe('https://example.com/path');
  });

  it('should strip query by default', () => {
    const result = normalizeUrl('https://example.com/path?query=value');
    expect(result).toBe('https://example.com/path');
  });

  it('should keep query when stripQuery is false', () => {
    const result = normalizeUrl('https://example.com/path?query=value', {
      stripQuery: false,
    });
    expect(result).toBe('https://example.com/path?query=value');
  });

  it('should throw error for invalid URL', () => {
    expect(() => normalizeUrl('not-a-url')).toThrow('Invalid URL');
  });
});

describe('resolveUrl', () => {
  it('should resolve relative URLs', () => {
    const result = resolveUrl('https://example.com/page', '../other');
    expect(result).toBe('https://example.com/other');
  });

  it('should resolve absolute paths', () => {
    const result = resolveUrl('https://example.com/page', '/other');
    expect(result).toBe('https://example.com/other');
  });

  it('should handle already absolute URLs', () => {
    const result = resolveUrl('https://example.com/', 'https://other.com/page');
    expect(result).toBe('https://other.com/page');
  });

  it('should throw for invalid URLs', () => {
    expect(() => resolveUrl('not-a-url', 'path')).toThrow();
  });
});

describe('isInternalUrl', () => {
  it('should return true for same origin', () => {
    expect(isInternalUrl('https://example.com/page', 'https://example.com/')).toBe(true);
  });

  it('should return false for different protocol', () => {
    expect(isInternalUrl('http://example.com/page', 'https://example.com/')).toBe(false);
  });

  it('should return false for different host', () => {
    expect(isInternalUrl('https://other.com/page', 'https://example.com/')).toBe(false);
  });

  it('should return false for different port', () => {
    expect(isInternalUrl('https://example.com:8080/page', 'https://example.com/')).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(isInternalUrl('invalid', 'https://example.com/')).toBe(false);
  });
});

describe('hasExcludedExtension', () => {
  it('should return true for image extensions', () => {
    expect(hasExcludedExtension('https://example.com/image.png')).toBe(true);
    expect(hasExcludedExtension('https://example.com/image.jpg')).toBe(true);
    expect(hasExcludedExtension('https://example.com/image.jpeg')).toBe(true);
    expect(hasExcludedExtension('https://example.com/image.webp')).toBe(true);
  });

  it('should return true for document extensions', () => {
    expect(hasExcludedExtension('https://example.com/doc.pdf')).toBe(true);
  });

  it('should return true for asset extensions', () => {
    expect(hasExcludedExtension('https://example.com/style.css')).toBe(true);
    expect(hasExcludedExtension('https://example.com/script.js')).toBe(true);
  });

  it('should return false for page URLs', () => {
    expect(hasExcludedExtension('https://example.com/page')).toBe(false);
    expect(hasExcludedExtension('https://example.com/page.html')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(hasExcludedExtension('https://example.com/IMAGE.PNG')).toBe(true);
  });
});

describe('hasExcludedPathPrefix', () => {
  it('should return true for admin paths', () => {
    expect(hasExcludedPathPrefix('https://example.com/wp-admin/users')).toBe(true);
    expect(hasExcludedPathPrefix('https://example.com/account/profile')).toBe(true);
  });

  it('should return true for API paths', () => {
    expect(hasExcludedPathPrefix('https://example.com/_api/data')).toBe(true);
  });

  it('should return false for normal paths', () => {
    expect(hasExcludedPathPrefix('https://example.com/about')).toBe(false);
    expect(hasExcludedPathPrefix('https://example.com/contact')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(hasExcludedPathPrefix('https://example.com/WP-ADMIN/users')).toBe(true);
  });
});

describe('isValidHttpUrl', () => {
  it('should return true for http URLs', () => {
    expect(isValidHttpUrl('http://example.com')).toBe(true);
  });

  it('should return true for https URLs', () => {
    expect(isValidHttpUrl('https://example.com')).toBe(true);
  });

  it('should return false for other protocols', () => {
    expect(isValidHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidHttpUrl('file:///path')).toBe(false);
  });

  it('should return false for invalid URLs', () => {
    expect(isValidHttpUrl('not a url')).toBe(false);
  });
});

describe('hasExcludedScheme', () => {
  it('should return true for mailto', () => {
    expect(hasExcludedScheme('mailto:test@example.com')).toBe(true);
  });

  it('should return true for tel', () => {
    expect(hasExcludedScheme('tel:+1234567890')).toBe(true);
  });

  it('should return true for javascript', () => {
    expect(hasExcludedScheme('javascript:void(0)')).toBe(true);
  });

  it('should return false for http/https', () => {
    expect(hasExcludedScheme('https://example.com')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(hasExcludedScheme('MAILTO:test@example.com')).toBe(true);
  });
});

describe('isFragmentOnly', () => {
  it('should return true for fragment-only URLs', () => {
    expect(isFragmentOnly('#section')).toBe(true);
    expect(isFragmentOnly('  #section')).toBe(true);
  });

  it('should return false for URLs with paths', () => {
    expect(isFragmentOnly('/path#section')).toBe(false);
    expect(isFragmentOnly('https://example.com#section')).toBe(false);
  });
});

describe('filterAndNormalizeUrls', () => {
  const baseUrl = 'https://example.com';

  it('should filter and normalize internal URLs', () => {
    const urls = ['https://example.com/page1', 'https://example.com/page2', '/page3', 'page4'];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(4);
    expect(result).toContain('https://example.com/page1');
    expect(result).toContain('https://example.com/page2');
    expect(result).toContain('https://example.com/page3');
    expect(result).toContain('https://example.com/page4');
  });

  it('should exclude external URLs', () => {
    const urls = ['https://example.com/page1', 'https://other.com/page2'];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(1);
    expect(result).toContain('https://example.com/page1');
  });

  it('should exclude URLs with excluded extensions', () => {
    const urls = ['https://example.com/page', 'https://example.com/image.png'];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(1);
    expect(result).toContain('https://example.com/page');
  });

  it('should exclude URLs with excluded schemes', () => {
    const urls = ['https://example.com/page', 'mailto:test@example.com'];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(1);
    expect(result).toContain('https://example.com/page');
  });

  it('should exclude fragment-only URLs', () => {
    const urls = ['https://example.com/page', '#section'];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(1);
    expect(result).toContain('https://example.com/page');
  });

  it('should deduplicate URLs', () => {
    const urls = [
      'https://example.com/page',
      'https://example.com/page/',
      'https://example.com/page?query=1',
      'https://example.com/page#section',
    ];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(1);
    expect(result).toContain('https://example.com/page');
  });

  it('should skip empty URLs', () => {
    const urls = ['https://example.com/page', '', '  ', null, undefined] as string[];

    const result = filterAndNormalizeUrls(urls, baseUrl);

    expect(result).toHaveLength(1);
  });
});

describe('getUrlPath', () => {
  it('should extract path from URL', () => {
    expect(getUrlPath('https://example.com/path/to/page')).toBe('/path/to/page');
  });

  it('should return root for root URL', () => {
    expect(getUrlPath('https://example.com/')).toBe('/');
  });

  it('should return empty string for invalid URL', () => {
    expect(getUrlPath('not a url')).toBe('');
  });
});
