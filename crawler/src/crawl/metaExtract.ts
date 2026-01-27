// @ts-nocheck - Browser context code uses DOM types not available in Node
/**
 * Metadata Extraction
 *
 * Extracts page metadata including title, meta tags, Open Graph, and headings.
 */

import type { Page } from 'playwright';
import type { Meta } from '../types/crawl.js';

/**
 * Extract metadata from page
 */
export async function extractMetadata(page: Page, url: string, status: number): Promise<Meta> {
  const finalUrl = page.url();

  const metadata = await page.evaluate(() => {
    const __name = (target, value) => target;
    // Get title
    const title = document.title || '';

    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const metaDescription = metaDesc ? metaDesc.getAttribute('content') : null;

    // Get canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalLink ? canonicalLink.getAttribute('href') : null;

    // Get Open Graph metadata
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    const ogTitle = ogTitleEl ? ogTitleEl.getAttribute('content') : null;
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    const ogDesc = ogDescEl ? ogDescEl.getAttribute('content') : null;
    const ogImageEl = document.querySelector('meta[property="og:image"]');
    const ogImage = ogImageEl ? ogImageEl.getAttribute('content') : null;
    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    const ogUrl = ogUrlEl ? ogUrlEl.getAttribute('content') : null;
    const ogTypeEl = document.querySelector('meta[property="og:type"]');
    const ogType = ogTypeEl ? ogTypeEl.getAttribute('content') : null;

    // Get all headings
    const headings = {
      h1: Array.from(document.querySelectorAll('h1')).map((h) => {
        const text = h.textContent ? h.textContent.trim() : '';
        return text;
      }).filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map((h) => {
        const text = h.textContent ? h.textContent.trim() : '';
        return text;
      }).filter(Boolean),
      h3: Array.from(document.querySelectorAll('h3')).map((h) => {
        const text = h.textContent ? h.textContent.trim() : '';
        return text;
      }).filter(Boolean),
      h4: Array.from(document.querySelectorAll('h4')).map((h) => {
        const text = h.textContent ? h.textContent.trim() : '';
        return text;
      }).filter(Boolean),
      h5: Array.from(document.querySelectorAll('h5')).map((h) => {
        const text = h.textContent ? h.textContent.trim() : '';
        return text;
      }).filter(Boolean),
      h6: Array.from(document.querySelectorAll('h6')).map((h) => {
        const text = h.textContent ? h.textContent.trim() : '';
        return text;
      }).filter(Boolean),
    };

    return {
      title,
      metaDescription,
      canonical,
      og: {
        title: ogTitle,
        description: ogDesc,
        image: ogImage,
        url: ogUrl,
        type: ogType,
      },
      headings,
    };
  });

  return {
    url,
    finalUrl,
    status,
    ...metadata,
  };
}

/**
 * Extract metadata from HTML string (for testing)
 */
export function extractMetadataFromHTML(html: string, url: string, status = 200): Meta {
  // Use cheerio for server-side parsing
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  const title = $('title').text() || '';
  const metaDescription = $('meta[name="description"]').attr('content') || null;
  const canonical = $('link[rel="canonical"]').attr('href') || null;

  const og = {
    title: $('meta[property="og:title"]').attr('content') || null,
    description: $('meta[property="og:description"]').attr('content') || null,
    image: $('meta[property="og:image"]').attr('content') || null,
    url: $('meta[property="og:url"]').attr('content') || null,
    type: $('meta[property="og:type"]').attr('content') || null,
  };

  const headings = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h1: $('h1').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h2: $('h2').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h3: $('h3').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h4: $('h4').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h5: $('h5').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h6: $('h6').map((_: any, el: any) => $(el).text().trim()).get().filter(Boolean),
  };

  return {
    url,
    finalUrl: url,
    status,
    title,
    metaDescription,
    canonical,
    og,
    headings,
  };
}
