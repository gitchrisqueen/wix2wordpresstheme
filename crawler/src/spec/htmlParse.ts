/**
 * HTML Parsing Utilities
 *
 * Extract CSS variables and inline styles from HTML content.
 */

import * as cheerio from 'cheerio';

/**
 * Extract color values from text
 */
function extractColors(text: string): string[] {
  const colors: string[] = [];

  // Match hex colors: #RGB, #RRGGBB, #RRGGBBAA
  const hexMatches = text.match(/#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi);
  if (hexMatches) {
    colors.push(...hexMatches.map((c) => c.toLowerCase()));
  }

  // Match rgb/rgba
  const rgbMatches = text.match(/rgba?\([^)]+\)/gi);
  if (rgbMatches) {
    colors.push(...rgbMatches.map((c) => c.toLowerCase()));
  }

  return colors;
}

/**
 * Extract font families from text
 */
function extractFontFamilies(text: string): string[] {
  const fonts: string[] = [];

  // Match font-family declarations
  const fontMatch = text.match(/font-family\s*:\s*([^;]+)/gi);
  if (fontMatch) {
    fontMatch.forEach((match) => {
      const families = match
        .replace(/font-family\s*:\s*/i, '')
        .split(',')
        .map((f) => f.trim().replace(/['"]/g, ''))
        .filter((f) => f && f !== 'inherit' && f !== 'initial');
      fonts.push(...families);
    });
  }

  return fonts;
}

/**
 * Parse CSS variables from style tags and inline styles
 */
export function parseCssVariables(html: string): {
  colors: string[];
  fonts: string[];
} {
  const $ = cheerio.load(html);
  const colors = new Set<string>();
  const fonts = new Set<string>();

  // Extract from style tags
  $('style').each((_, elem) => {
    const styleContent = $(elem).html() || '';

    // Extract colors
    extractColors(styleContent).forEach((c) => colors.add(c));

    // Extract fonts
    extractFontFamilies(styleContent).forEach((f) => fonts.add(f));
  });

  // Extract from inline styles
  $('[style]').each((_, elem) => {
    const inlineStyle = $(elem).attr('style') || '';

    // Extract colors
    extractColors(inlineStyle).forEach((c) => colors.add(c));

    // Extract fonts
    extractFontFamilies(inlineStyle).forEach((f) => fonts.add(f));
  });

  return {
    colors: Array.from(colors),
    fonts: Array.from(fonts),
  };
}

/**
 * Extract inline styles from specific elements
 */
export function extractInlineStyles(html: string, selector: string): Record<string, string>[] {
  const $ = cheerio.load(html);
  const styles: Record<string, string>[] = [];

  $(selector).each((_, elem) => {
    const inlineStyle = $(elem).attr('style');
    if (inlineStyle) {
      const styleObj: Record<string, string> = {};

      // Parse inline style
      inlineStyle.split(';').forEach((rule) => {
        const [prop, value] = rule.split(':').map((s) => s.trim());
        if (prop && value) {
          styleObj[prop] = value;
        }
      });

      if (Object.keys(styleObj).length > 0) {
        styles.push(styleObj);
      }
    }
  });

  return styles;
}

/**
 * Parse button styles from HTML
 */
export function parseButtonStyles(html: string): {
  primary: Record<string, string> | null;
  secondary: Record<string, string> | null;
} {
  const $ = cheerio.load(html);

  const buttonStyles: Record<string, string>[] = [];

  // Find buttons and links that look like buttons
  $('button, a[role="button"], .button, .btn, a.cta').each((_, elem) => {
    const $elem = $(elem);
    const inlineStyle = $elem.attr('style');

    if (inlineStyle) {
      const styleObj: Record<string, string> = {};

      inlineStyle.split(';').forEach((rule) => {
        const [prop, value] = rule.split(':').map((s) => s.trim());
        if (prop && value) {
          styleObj[prop] = value;
        }
      });

      if (Object.keys(styleObj).length > 0) {
        buttonStyles.push(styleObj);
      }
    }
  });

  // Simple heuristic: first distinct style is primary, second is secondary
  const uniqueStyles = buttonStyles.filter((style, index, self) => {
    const sig = JSON.stringify(style);
    return self.findIndex((s) => JSON.stringify(s) === sig) === index;
  });

  return {
    primary: uniqueStyles[0] || null,
    secondary: uniqueStyles[1] || null,
  };
}

/**
 * Extract computed colors (this is limited without browser context)
 */
export function extractComputedColors(html: string): string[] {
  const { colors } = parseCssVariables(html);
  return colors;
}
