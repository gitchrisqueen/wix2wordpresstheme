/**
 * Asset Discovery Tests
 */

import { describe, it, expect } from 'vitest';
import { parseSrcset, getAssetType } from '../crawl/assetsDiscover.js';

describe('asset discovery utilities', () => {
  describe('parseSrcset', () => {
    it('should parse single URL from srcset', () => {
      const srcset = 'image.png 1x';
      const urls = parseSrcset(srcset);

      expect(urls).toEqual(['image.png']);
    });

    it('should parse multiple URLs from srcset', () => {
      const srcset = 'small.png 480w, medium.png 800w, large.png 1200w';
      const urls = parseSrcset(srcset);

      expect(urls).toEqual(['small.png', 'medium.png', 'large.png']);
    });

    it('should handle srcset with different descriptors', () => {
      const srcset = 'image1.png 1x, image2.png 2x';
      const urls = parseSrcset(srcset);

      expect(urls).toEqual(['image1.png', 'image2.png']);
    });

    it('should handle empty srcset', () => {
      const urls = parseSrcset('');

      expect(urls).toEqual([]);
    });

    it('should trim whitespace', () => {
      const srcset = '  image1.png  1x  ,  image2.png  2x  ';
      const urls = parseSrcset(srcset);

      expect(urls).toEqual(['image1.png', 'image2.png']);
    });

    it('should handle Cloudinary URLs with commas in path (transformation params)', () => {
      const srcset = 'https://static.example.com/media/image.png/v1/fill/w_206,h_90,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/image.png 1x, https://static.example.com/media/image.png/v1/fill/w_412,h_180,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/image.png 2x';
      const urls = parseSrcset(srcset);

      expect(urls).toEqual([
        'https://static.example.com/media/image.png/v1/fill/w_206,h_90,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/image.png',
        'https://static.example.com/media/image.png/v1/fill/w_412,h_180,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/image.png'
      ]);
    });

    it('should handle URL without descriptor', () => {
      const srcset = 'image.png';
      const urls = parseSrcset(srcset);

      expect(urls).toEqual(['image.png']);
    });
  });

  describe('getAssetType', () => {
    it('should identify image types', () => {
      expect(getAssetType('https://example.com/image.png')).toBe('image');
      expect(getAssetType('https://example.com/photo.jpg')).toBe('image');
      expect(getAssetType('https://example.com/graphic.jpeg')).toBe('image');
      expect(getAssetType('https://example.com/logo.svg')).toBe('image');
      expect(getAssetType('https://example.com/animation.gif')).toBe('image');
      expect(getAssetType('https://example.com/photo.webp')).toBe('image');
    });

    it('should identify font types', () => {
      expect(getAssetType('https://example.com/font.woff')).toBe('font');
      expect(getAssetType('https://example.com/font.woff2')).toBe('font');
      expect(getAssetType('https://example.com/font.ttf')).toBe('font');
      expect(getAssetType('https://example.com/font.otf')).toBe('font');
      expect(getAssetType('https://example.com/font.eot')).toBe('font');
    });

    it('should identify CSS', () => {
      expect(getAssetType('https://example.com/style.css')).toBe('css');
      expect(getAssetType('https://example.com/theme.CSS')).toBe('css');
    });

    it('should identify JavaScript', () => {
      expect(getAssetType('https://example.com/script.js')).toBe('js');
      expect(getAssetType('https://example.com/bundle.JS')).toBe('js');
    });

    it('should classify unknown types as "other"', () => {
      expect(getAssetType('https://example.com/document.pdf')).toBe('other');
      expect(getAssetType('https://example.com/data.json')).toBe('other');
      expect(getAssetType('https://example.com/unknown')).toBe('other');
    });

    it('should be case insensitive', () => {
      expect(getAssetType('https://example.com/IMAGE.PNG')).toBe('image');
      expect(getAssetType('https://example.com/FONT.WOFF2')).toBe('font');
    });
  });
});
