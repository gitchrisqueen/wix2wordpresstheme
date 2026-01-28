/**
 * Tests for pattern detection
 */

import { describe, it, expect } from 'vitest';
import { detectPatterns } from '../spec/patterns.js';
import type { Section } from '../types/spec.js';

describe('detectPatterns', () => {
  it('should detect patterns from multiple similar sections', () => {
    const sections1: Section[] = [
      {
        id: 'sec_001',
        type: 'hero',
        heading: 'Welcome',
        textBlocks: ['Intro text'],
        ctas: [{ text: 'Get Started', href: '/start' }],
        media: [{ type: 'image', src: '/hero.jpg', alt: '', localAsset: null }],
      },
    ];
    
    const sections2: Section[] = [
      {
        id: 'sec_001',
        type: 'hero',
        heading: 'About',
        textBlocks: ['About text'],
        ctas: [{ text: 'Learn More', href: '/about' }],
        media: [{ type: 'image', src: '/about.jpg', alt: '', localAsset: null }],
      },
    ];
    
    const pagesSections = new Map<string, Section[]>();
    pagesSections.set('home', sections1);
    pagesSections.set('about', sections2);
    
    const patterns = detectPatterns(pagesSections);
    
    expect(patterns.length).toBeGreaterThan(0);
    const heroPattern = patterns.find(p => p.type === 'hero');
    expect(heroPattern).toBeDefined();
    expect(heroPattern?.stats.count).toBe(2);
    expect(heroPattern?.examples).toContain('home#sec_001');
    expect(heroPattern?.examples).toContain('about#sec_001');
  });

  it('should not create patterns for single instances', () => {
    const sections: Section[] = [
      {
        id: 'sec_001',
        type: 'hero',
        heading: 'Welcome',
        textBlocks: [],
        ctas: [],
        media: [],
      },
      {
        id: 'sec_002',
        type: 'footer',
        heading: null,
        textBlocks: [],
        ctas: [],
        media: [],
      },
    ];
    
    const pagesSections = new Map<string, Section[]>();
    pagesSections.set('home', sections);
    
    const patterns = detectPatterns(pagesSections);
    
    // Should have no patterns since no signatures repeat
    expect(patterns.length).toBe(0);
  });

  it('should calculate pattern statistics correctly', () => {
    const createHeroSection = (id: string): Section => ({
      id,
      type: 'hero',
      heading: 'Title',
      textBlocks: ['text1', 'text2'],
      ctas: [{ text: 'CTA', href: '/' }],
      media: [{ type: 'image', src: '/img.jpg', alt: '', localAsset: null }],
    });
    
    const pagesSections = new Map<string, Section[]>();
    pagesSections.set('page1', [createHeroSection('sec_001')]);
    pagesSections.set('page2', [createHeroSection('sec_001')]);
    pagesSections.set('page3', [createHeroSection('sec_001')]);
    
    const patterns = detectPatterns(pagesSections);
    
    expect(patterns.length).toBe(1);
    const pattern = patterns[0];
    expect(pattern.stats.count).toBe(3);
    expect(pattern.stats.headingCount).toBe(1);
    expect(pattern.stats.textCount).toBe(2);
    expect(pattern.stats.ctaCount).toBe(1);
    expect(pattern.stats.mediaCount).toBe(1);
  });

  it('should sort patterns by count descending', () => {
    const createSection = (type: string): Section => ({
      id: 'sec_001',
      type: type as any,
      heading: null,
      textBlocks: [],
      ctas: [],
      media: [],
    });
    
    const pagesSections = new Map<string, Section[]>();
    
    // Create 3 instances of type A
    pagesSections.set('page1', [createSection('typeA')]);
    pagesSections.set('page2', [createSection('typeA')]);
    pagesSections.set('page3', [createSection('typeA')]);
    
    // Create 2 instances of type B
    pagesSections.set('page4', [createSection('typeB')]);
    pagesSections.set('page5', [createSection('typeB')]);
    
    const patterns = detectPatterns(pagesSections);
    
    expect(patterns.length).toBe(2);
    // Should be sorted by count
    expect(patterns[0].stats.count).toBe(3);
    expect(patterns[1].stats.count).toBe(2);
  });

  it('should limit examples to 5', () => {
    const createSection = (): Section => ({
      id: 'sec_001',
      type: 'hero',
      heading: null,
      textBlocks: [],
      ctas: [],
      media: [],
    });
    
    const pagesSections = new Map<string, Section[]>();
    
    // Create 10 instances
    for (let i = 0; i < 10; i++) {
      pagesSections.set(`page${i}`, [createSection()]);
    }
    
    const patterns = detectPatterns(pagesSections);
    
    expect(patterns.length).toBe(1);
    expect(patterns[0].examples.length).toBeLessThanOrEqual(5);
  });
});
