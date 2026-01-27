/**
 * Metadata Extraction Tests
 */

import { describe, it, expect } from 'vitest';
import { extractMetadataFromHTML } from '../crawl/metaExtract.js';

describe('metadata extraction', () => {
  it('should extract title', () => {
    const html = '<html><head><title>Test Page</title></head><body></body></html>';
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.title).toBe('Test Page');
  });

  it('should extract meta description', () => {
    const html = `
      <html>
        <head>
          <meta name="description" content="This is a test page">
        </head>
        <body></body>
      </html>
    `;
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.metaDescription).toBe('This is a test page');
  });

  it('should extract canonical URL', () => {
    const html = `
      <html>
        <head>
          <link rel="canonical" href="https://example.com/canonical">
        </head>
        <body></body>
      </html>
    `;
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.canonical).toBe('https://example.com/canonical');
  });

  it('should extract Open Graph metadata', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="OG Title">
          <meta property="og:description" content="OG Description">
          <meta property="og:image" content="https://example.com/image.png">
          <meta property="og:url" content="https://example.com/page">
          <meta property="og:type" content="website">
        </head>
        <body></body>
      </html>
    `;
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.og?.title).toBe('OG Title');
    expect(meta.og?.description).toBe('OG Description');
    expect(meta.og?.image).toBe('https://example.com/image.png');
    expect(meta.og?.url).toBe('https://example.com/page');
    expect(meta.og?.type).toBe('website');
  });

  it('should extract headings by level', () => {
    const html = `
      <html>
        <body>
          <h1>Main Title</h1>
          <h2>Subtitle 1</h2>
          <h2>Subtitle 2</h2>
          <h3>Section 1</h3>
          <h3>Section 2</h3>
        </body>
      </html>
    `;
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.headings?.h1).toEqual(['Main Title']);
    expect(meta.headings?.h2).toEqual(['Subtitle 1', 'Subtitle 2']);
    expect(meta.headings?.h3).toEqual(['Section 1', 'Section 2']);
  });

  it('should handle missing metadata gracefully', () => {
    const html = '<html><body>No metadata</body></html>';
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.title).toBe('');
    expect(meta.metaDescription).toBeNull();
    expect(meta.canonical).toBeNull();
  });

  it('should trim whitespace from extracted text', () => {
    const html = `
      <html>
        <body>
          <h1>  Spaced Title  </h1>
          <h2>
            Multi
            Line
          </h2>
        </body>
      </html>
    `;
    const meta = extractMetadataFromHTML(html, 'https://example.com/test');

    expect(meta.headings?.h1).toEqual(['Spaced Title']);
    // Note: cheerio may preserve some whitespace in multi-line text
  });

  it('should include URL and status in metadata', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>';
    const meta = extractMetadataFromHTML(html, 'https://example.com/test', 200);

    expect(meta.url).toBe('https://example.com/test');
    expect(meta.finalUrl).toBe('https://example.com/test');
    expect(meta.status).toBe(200);
  });
});
