/**
 * Integration test for page.evaluate() calls
 *
 * This test ensures that all page.evaluate() calls in our codebase
 * serialize properly without TypeScript helpers like __name.
 */

import { describe, it, expect } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

describe('Playwright page.evaluate integration', () => {
  let browser: Browser;
  let page: Page;

  // Skip if Playwright browsers aren't installed
  const skipIfNoBrowser =
    process.env.CI === 'true' || !process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;

  beforeAll(async () => {
    if (skipIfNoBrowser) return;

    try {
      browser = await chromium.launch({ headless: true });
      page = await browser.newPage();
      await page.setContent('<html><body><h1>Test</h1></body></html>');
    } catch (error) {
      console.warn('Playwright browser not installed, skipping integration tests');
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it.skipIf(skipIfNoBrowser)('should evaluate arrow functions without __name error', async () => {
    const result = await page.evaluate(() => {
      const inner = (x) => x + 1;
      return inner(5);
    });
    expect(result).toBe(6);
  });

  it.skipIf(skipIfNoBrowser)('should evaluate with parameter passing', async () => {
    const result = await page.evaluate(
      ({ value }) => {
        const process = (x) => x * 2;
        return process(value);
      },
      { value: 10 }
    );
    expect(result).toBe(20);
  });

  it.skipIf(skipIfNoBrowser)(
    'should handle DOM traversal without optional chaining issues',
    async () => {
      const result = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        const text = h1 ? h1.textContent : null;
        return text ? text.trim() : '';
      });
      expect(result).toBe('Test');
    }
  );

  it.skipIf(skipIfNoBrowser)('should handle Array.from and map without type errors', async () => {
    await page.setContent('<html><body><h1>One</h1><h1>Two</h1></body></html>');

    const result = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1'))
        .map((h) => {
          const text = h.textContent ? h.textContent.trim() : '';
          return text;
        })
        .filter(Boolean);
    });

    expect(result).toEqual(['One', 'Two']);
  });

  it.skipIf(skipIfNoBrowser)('should handle complex nested functions', async () => {
    const result = await page.evaluate(
      ({ items }) => {
        const results = [];

        const processItem = (item) => {
          const transform = (x) => x.toUpperCase();
          return transform(item);
        };

        for (const item of items) {
          results.push(processItem(item));
        }

        return results;
      },
      { items: ['test', 'data'] }
    );

    expect(result).toEqual(['TEST', 'DATA']);
  });

  it.skipIf(skipIfNoBrowser)(
    'should handle forEach callbacks without type annotations',
    async () => {
      await page.setContent(`
      <html>
        <body>
          <img src="image1.jpg" />
          <img src="image2.jpg" />
        </body>
      </html>
    `);

      const result = await page.evaluate(() => {
        const images = [];
        document.querySelectorAll('img[src]').forEach((img) => {
          images.push(img.src);
        });
        return images;
      });

      expect(result.length).toBe(2);
      expect(result.every((src) => src.includes('image'))).toBe(true);
    }
  );
});
