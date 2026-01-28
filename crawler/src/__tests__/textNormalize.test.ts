/**
 * Tests for text normalization utilities
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeWhitespace,
  stripHtml,
  extractText,
  truncate,
  isEmpty,
  splitSentences,
  splitWords,
  wordCount,
  normalizeSelector,
} from '../lib/textNormalize.js';

describe('normalizeWhitespace', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('should replace multiple spaces with single space', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('should remove zero-width characters', () => {
    expect(normalizeWhitespace('hello\u200Bworld')).toBe('helloworld');
  });

  it('should handle newlines', () => {
    expect(normalizeWhitespace('hello\n\nworld')).toBe('hello world');
  });
});

describe('stripHtml', () => {
  it('should remove HTML tags', () => {
    expect(stripHtml('<p>hello</p>')).toBe(' hello ');
  });

  it('should remove script tags and content', () => {
    expect(stripHtml('<script>alert("hi")</script>hello')).toBe('hello');
  });

  it('should remove style tags and content', () => {
    expect(stripHtml('<style>.class{}</style>hello')).toBe('hello');
  });

  it('should decode HTML entities', () => {
    expect(stripHtml('&lt;hello&gt; &amp; &quot;world&quot;')).toBe('<hello> & "world"');
  });

  it('should replace nbsp with space', () => {
    expect(stripHtml('hello&nbsp;world')).toBe('hello world');
  });
});

describe('extractText', () => {
  it('should extract and normalize text from HTML', () => {
    expect(extractText('<p>  hello   world  </p>')).toBe('hello world');
  });

  it('should handle complex HTML', () => {
    const html = '<div><p>Hello</p><script>alert("hi")</script><p>World</p></div>';
    expect(extractText(html)).toBe('Hello World');
  });
});

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long text', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('should use custom suffix', () => {
    expect(truncate('hello world', 8, '…')).toBe('hello w…');
  });
});

describe('isEmpty', () => {
  it('should return true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('should return true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('should return true for whitespace', () => {
    expect(isEmpty('   ')).toBe(true);
  });

  it('should return false for text', () => {
    expect(isEmpty('hello')).toBe(false);
  });
});

describe('splitSentences', () => {
  it('should split on periods', () => {
    expect(splitSentences('Hello. World.')).toEqual(['Hello', 'World']);
  });

  it('should split on exclamation marks', () => {
    expect(splitSentences('Hello! World!')).toEqual(['Hello', 'World']);
  });

  it('should split on question marks', () => {
    expect(splitSentences('Hello? World?')).toEqual(['Hello', 'World']);
  });

  it('should handle multiple punctuation', () => {
    expect(splitSentences('Hello!! World!!')).toEqual(['Hello', 'World']);
  });
});

describe('splitWords', () => {
  it('should split on spaces', () => {
    expect(splitWords('hello world')).toEqual(['hello', 'world']);
  });

  it('should handle multiple spaces', () => {
    expect(splitWords('hello    world')).toEqual(['hello', 'world']);
  });

  it('should filter empty strings', () => {
    expect(splitWords('  hello  world  ')).toEqual(['hello', 'world']);
  });
});

describe('wordCount', () => {
  it('should count words', () => {
    expect(wordCount('hello world')).toBe(2);
  });

  it('should handle empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('should handle multiple spaces', () => {
    expect(wordCount('hello    world')).toBe(2);
  });
});

describe('normalizeSelector', () => {
  it('should remove Wix generated classes', () => {
    expect(normalizeSelector('.comp-abc123')).toBe('');
  });

  it('should keep semantic classes', () => {
    expect(normalizeSelector('.header.main')).toBe('header.main');
  });

  it('should remove wixui classes', () => {
    expect(normalizeSelector('.wixui-button')).toBe('');
  });

  it('should remove style__ classes', () => {
    expect(normalizeSelector('.style__button')).toBe('');
  });

  it('should handle complex selectors', () => {
    expect(normalizeSelector('div.comp-abc .header.main')).toBe('div header.main');
  });
});
