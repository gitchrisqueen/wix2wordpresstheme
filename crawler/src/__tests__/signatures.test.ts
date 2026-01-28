/**
 * Tests for section signatures
 */

import { describe, it, expect } from 'vitest';
import { generateSignature, sectionsMatch, generateSectionRef } from '../spec/signatures.js';
import type { Section } from '../types/spec.js';

describe('generateSignature', () => {
  it('should generate signature for empty section', () => {
    const section: Section = {
      id: 'sec_001',
      type: 'unknown',
      textBlocks: [],
      ctas: [],
      media: [],
    };

    expect(generateSignature(section)).toBe('type:unknown|h:0|txt:0|med:0|cta:0');
  });

  it('should generate signature for hero section', () => {
    const section: Section = {
      id: 'sec_001',
      type: 'hero',
      heading: 'Welcome',
      textBlocks: ['Some text'],
      ctas: [{ text: 'Get Started', href: '/signup' }],
      media: [{ type: 'image', src: '/hero.jpg', alt: 'Hero', localAsset: null }],
    };

    expect(generateSignature(section)).toBe('type:hero|h:1|txt:1|med:1|cta:1');
  });

  it('should bucket text blocks correctly', () => {
    const section: Section = {
      id: 'sec_001',
      type: 'richText',
      textBlocks: ['1', '2', '3', '4', '5', '6'],
      ctas: [],
      media: [],
    };

    expect(generateSignature(section)).toBe('type:richText|h:0|txt:many|med:0|cta:0');
  });

  it('should bucket media correctly', () => {
    const section: Section = {
      id: 'sec_001',
      type: 'gallery',
      textBlocks: [],
      ctas: [],
      media: [
        { type: 'image', src: '/1.jpg', alt: '', localAsset: null },
        { type: 'image', src: '/2.jpg', alt: '', localAsset: null },
        { type: 'image', src: '/3.jpg', alt: '', localAsset: null },
      ],
    };

    expect(generateSignature(section)).toBe('type:gallery|h:0|txt:0|med:few|cta:0');
  });
});

describe('sectionsMatch', () => {
  it('should match identical signatures', () => {
    const sig = 'type:hero|h:1|txt:1|med:1|cta:1';
    expect(sectionsMatch(sig, sig)).toBe(true);
  });

  it('should not match different signatures', () => {
    const sig1 = 'type:hero|h:1|txt:1|med:1|cta:1';
    const sig2 = 'type:footer|h:0|txt:few|med:0|cta:0';
    expect(sectionsMatch(sig1, sig2)).toBe(false);
  });
});

describe('generateSectionRef', () => {
  it('should generate section reference', () => {
    expect(generateSectionRef('home', 'sec_001')).toBe('home#sec_001');
  });

  it('should handle complex slugs', () => {
    expect(generateSectionRef('about-us', 'sec_010')).toBe('about-us#sec_010');
  });
});
