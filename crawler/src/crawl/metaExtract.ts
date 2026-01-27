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
    // Get title
    const title = document.title || '';

    // Get meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const metaDescription = metaDesc?.getAttribute('content') || null;

    // Get canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const canonical = canonicalLink?.getAttribute('href') || null;

    // Get Open Graph metadata
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || null;
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || null;
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || null;
    const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || null;
    const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content') || null;

    // Get all headings
    const headings = {
      h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent?.trim() || '').filter(Boolean),
      h2: Array.from(document.querySelectorAll('h2')).map((h) => h.textContent?.trim() || '').filter(Boolean),
      h3: Array.from(document.querySelectorAll('h3')).map((h) => h.textContent?.trim() || '').filter(Boolean),
      h4: Array.from(document.querySelectorAll('h4')).map((h) => h.textContent?.trim() || '').filter(Boolean),
      h5: Array.from(document.querySelectorAll('h5')).map((h) => h.textContent?.trim() || '').filter(Boolean),
      h6: Array.from(document.querySelectorAll('h6')).map((h) => h.textContent?.trim() || '').filter(Boolean),
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
    h1: $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    h2: $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    h3: $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    h4: $('h4').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    h5: $('h5').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    h6: $('h6').map((_, el) => $(el).text().trim()).get().filter(Boolean),
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
