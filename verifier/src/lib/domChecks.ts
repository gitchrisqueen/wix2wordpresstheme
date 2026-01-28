/**
 * DOM Checks
 * 
 * Verify DOM structure and metadata between Wix and WP pages
 */

import { chromium, type Browser, type Page } from 'playwright';
import type { DOMCheckResult } from '../types.js';

/**
 * Perform DOM checks on a WP page
 */
export async function performDOMChecks(
  wpUrl: string,
  expectedTitle?: string,
): Promise<DOMCheckResult[]> {
  const browser = await chromium.launch({ headless: true });
  const results: DOMCheckResult[] = [];

  try {
    const page = await browser.newPage();
    await page.goto(wpUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Check title
    const titleCheck = await checkTitle(page, expectedTitle);
    results.push(titleCheck);

    // Check canonical
    const canonicalCheck = await checkCanonical(page, wpUrl);
    results.push(canonicalCheck);

    // Check H1
    const h1Check = await checkH1(page);
    results.push(h1Check);

    // Check meta description
    const metaDescCheck = await checkMetaDescription(page);
    results.push(metaDescCheck);

    await page.close();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    results.push({
      check: 'page_load',
      passed: false,
      message: `Failed to load page: ${errorMessage}`,
    });
  } finally {
    await browser.close();
  }

  return results;
}

/**
 * Check if page has a title
 */
async function checkTitle(
  page: Page,
  expectedTitle?: string,
): Promise<DOMCheckResult> {
  try {
    const title = await page.title();

    if (!title || title.trim() === '') {
      return {
        check: 'title',
        passed: false,
        expected: expectedTitle || 'non-empty',
        actual: title || '(empty)',
        message: 'Page title is empty',
      };
    }

    if (expectedTitle) {
      // Fuzzy match - check if expected title is contained in actual
      const normalized = normalizeText(title);
      const expectedNormalized = normalizeText(expectedTitle);

      if (!normalized.includes(expectedNormalized)) {
        return {
          check: 'title',
          passed: false,
          expected: expectedTitle,
          actual: title,
          message: 'Title does not match expected value',
        };
      }
    }

    return {
      check: 'title',
      passed: true,
      actual: title,
      message: 'Title is present',
    };
  } catch (error) {
    return {
      check: 'title',
      passed: false,
      message: `Error checking title: ${error}`,
    };
  }
}

/**
 * Check if page has canonical link
 */
async function checkCanonical(
  page: Page,
  expectedUrl: string,
): Promise<DOMCheckResult> {
  try {
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute('href');

    if (!canonical) {
      return {
        check: 'canonical',
        passed: false,
        expected: expectedUrl,
        actual: '(missing)',
        message: 'Canonical link is missing',
      };
    }

    // Normalize URLs for comparison
    const canonicalNorm = normalizeUrl(canonical);
    const expectedNorm = normalizeUrl(expectedUrl);

    if (canonicalNorm !== expectedNorm) {
      return {
        check: 'canonical',
        passed: false,
        expected: expectedUrl,
        actual: canonical,
        message: 'Canonical URL does not match expected',
      };
    }

    return {
      check: 'canonical',
      passed: true,
      actual: canonical,
      message: 'Canonical link is correct',
    };
  } catch (error) {
    return {
      check: 'canonical',
      passed: false,
      message: `Error checking canonical: ${error}`,
    };
  }
}

/**
 * Check if page has H1
 */
async function checkH1(page: Page): Promise<DOMCheckResult> {
  try {
    const h1Elements = await page.locator('h1').all();

    if (h1Elements.length === 0) {
      return {
        check: 'h1',
        passed: false,
        expected: 'at least 1',
        actual: '0',
        message: 'No H1 found on page',
      };
    }

    if (h1Elements.length > 1) {
      return {
        check: 'h1',
        passed: false,
        expected: '1',
        actual: String(h1Elements.length),
        message: `Multiple H1 elements found (${h1Elements.length})`,
      };
    }

    const h1Text = await h1Elements[0].textContent();

    return {
      check: 'h1',
      passed: true,
      actual: h1Text || '(empty)',
      message: 'H1 is present',
    };
  } catch (error) {
    return {
      check: 'h1',
      passed: false,
      message: `Error checking H1: ${error}`,
    };
  }
}

/**
 * Check if page has meta description
 */
async function checkMetaDescription(page: Page): Promise<DOMCheckResult> {
  try {
    const metaDesc = await page
      .locator('meta[name="description"]')
      .getAttribute('content');

    if (!metaDesc || metaDesc.trim() === '') {
      return {
        check: 'meta_description',
        passed: false,
        expected: 'non-empty',
        actual: metaDesc || '(missing)',
        message: 'Meta description is missing or empty',
      };
    }

    return {
      check: 'meta_description',
      passed: true,
      actual: metaDesc.substring(0, 100) + (metaDesc.length > 100 ? '...' : ''),
      message: 'Meta description is present',
    };
  } catch (error) {
    return {
      check: 'meta_description',
      passed: false,
      message: `Error checking meta description: ${error}`,
    };
  }
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return (
      parsed.origin +
      parsed.pathname.toLowerCase().replace(/\/+$/, '')
    );
  } catch {
    return url.toLowerCase().replace(/\/+$/, '');
  }
}
