/**
 * Tests for HTML parsing utilities
 */

import { describe, it, expect } from 'vitest';
import { parseCssVariables, parseButtonStyles, extractInlineStyles } from '../spec/htmlParse.js';

describe('parseCssVariables', () => {
  it('should extract hex colors from style tags', () => {
    const html = `
      <html>
        <style>
          :root {
            --primary: #ff0000;
            --secondary: #00ff00;
          }
        </style>
      </html>
    `;

    const { colors } = parseCssVariables(html);

    expect(colors).toContain('#ff0000');
    expect(colors).toContain('#00ff00');
  });

  it('should extract rgb colors', () => {
    const html = `
      <html>
        <style>
          .button { background: rgb(255, 0, 0); }
        </style>
      </html>
    `;

    const { colors } = parseCssVariables(html);

    expect(colors.some((c) => c.includes('rgb'))).toBe(true);
  });

  it('should extract colors from inline styles', () => {
    const html = `
      <div style="color: #ff0000; background: #00ff00;">Test</div>
    `;

    const { colors } = parseCssVariables(html);

    expect(colors).toContain('#ff0000');
    expect(colors).toContain('#00ff00');
  });

  it('should extract font families from style tags', () => {
    const html = `
      <html>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { font-family: "Helvetica Neue", Helvetica; }
        </style>
      </html>
    `;

    const { fonts } = parseCssVariables(html);

    expect(fonts).toContain('Arial');
    expect(fonts).toContain('sans-serif');
    expect(fonts).toContain('Helvetica Neue');
  });

  it('should extract font families from inline styles', () => {
    const html = `
      <div style="font-family: Georgia, serif;">Test</div>
    `;

    const { fonts } = parseCssVariables(html);

    expect(fonts).toContain('Georgia');
    expect(fonts).toContain('serif');
  });

  it('should deduplicate colors and fonts', () => {
    const html = `
      <html>
        <style>
          .a { color: #ff0000; font-family: Arial; }
          .b { color: #ff0000; font-family: Arial; }
        </style>
      </html>
    `;

    const { colors, fonts } = parseCssVariables(html);

    // Should have only one instance of each
    expect(colors.filter((c) => c === '#ff0000').length).toBe(1);
    expect(fonts.filter((f) => f === 'Arial').length).toBe(1);
  });
});

describe('extractInlineStyles', () => {
  it('should extract inline styles from matched elements', () => {
    const html = `
      <button style="background-color: red; padding: 10px;">Click</button>
      <button style="background-color: blue; padding: 15px;">Click</button>
    `;

    const styles = extractInlineStyles(html, 'button');

    expect(styles.length).toBe(2);
    expect(styles[0]['background-color']).toBe('red');
    expect(styles[0]['padding']).toBe('10px');
    expect(styles[1]['background-color']).toBe('blue');
  });

  it('should return empty array when no matches', () => {
    const html = `<div>No buttons here</div>`;

    const styles = extractInlineStyles(html, 'button');

    expect(styles.length).toBe(0);
  });

  it('should skip elements without inline styles', () => {
    const html = `
      <button>No style</button>
      <button style="color: red;">Has style</button>
    `;

    const styles = extractInlineStyles(html, 'button');

    expect(styles.length).toBe(1);
    expect(styles[0]['color']).toBe('red');
  });
});

describe('parseButtonStyles', () => {
  it('should extract primary and secondary button styles', () => {
    const html = `
      <button style="background-color: blue; color: white; border-radius: 4px;">Primary</button>
      <button style="background-color: blue; color: white; border-radius: 4px;">Primary</button>
      <button style="background-color: gray; color: black; border-radius: 4px;">Secondary</button>
    `;

    const { primary, secondary } = parseButtonStyles(html);

    expect(primary).toBeDefined();
    expect(primary?.['background-color']).toBe('blue');
    expect(secondary).toBeDefined();
    expect(secondary?.['background-color']).toBe('gray');
  });

  it('should return null when no buttons found', () => {
    const html = `<div>No buttons</div>`;

    const { primary, secondary } = parseButtonStyles(html);

    expect(primary).toBeNull();
    expect(secondary).toBeNull();
  });

  it('should find buttons by role attribute', () => {
    const html = `
      <a role="button" style="background-color: blue;">Button Link</a>
    `;

    const { primary } = parseButtonStyles(html);

    expect(primary).toBeDefined();
    expect(primary?.['background-color']).toBe('blue');
  });

  it('should find buttons by class names', () => {
    const html = `
      <a class="button" style="background-color: red;">Button</a>
      <a class="btn" style="background-color: green;">Button</a>
    `;

    const { primary, secondary } = parseButtonStyles(html);

    expect(primary).toBeDefined();
    expect(secondary).toBeDefined();
  });
});
