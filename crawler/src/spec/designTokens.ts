/**
 * Design Tokens Extraction
 *
 * Extract global design tokens (colors, typography, components) from pages.
 */

import type { DesignTokens, ButtonStyle } from '../types/spec.js';
import { parseCssVariables, parseButtonStyles } from './htmlParse.js';

interface PageData {
  html: string;
  slug: string;
}

/**
 * Extract design tokens from multiple pages
 */
export function extractDesignTokens(pages: PageData[]): DesignTokens {
  const allColors = new Set<string>();
  const allFonts = new Set<string>();
  const buttonStylesCollected: Array<{
    primary: Record<string, string> | null;
    secondary: Record<string, string> | null;
  }> = [];

  // Process each page
  for (const page of pages) {
    const { colors, fonts } = parseCssVariables(page.html);

    // Collect colors
    colors.forEach((c) => allColors.add(c));

    // Collect fonts
    fonts.forEach((f) => allFonts.add(f));

    // Collect button styles
    const buttons = parseButtonStyles(page.html);
    buttonStylesCollected.push(buttons);
  }

  // Deduplicate and analyze
  const colorPalette = Array.from(allColors);
  const fontFamilies = Array.from(allFonts);

  // Infer primary colors (most common colors)
  const colorFreq = new Map<string, number>();
  for (const page of pages) {
    const { colors } = parseCssVariables(page.html);
    colors.forEach((c) => {
      colorFreq.set(c, (colorFreq.get(c) || 0) + 1);
    });
  }

  const sortedColors = Array.from(colorFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  const primaryColor = sortedColors[0] || null;
  const secondaryColor = sortedColors[1] || null;

  // Infer button styles (most common)
  const primaryButtons = buttonStylesCollected.map((b) => b.primary).filter((b) => b !== null);

  const secondaryButtons = buttonStylesCollected.map((b) => b.secondary).filter((b) => b !== null);

  const primaryButtonStyle = mergeButtonStyles(primaryButtons);
  const secondaryButtonStyle = mergeButtonStyles(secondaryButtons);

  return {
    colors: {
      primary: primaryColor,
      secondary: secondaryColor,
      background: null, // Could infer from body background
      text: null, // Could infer from body color
      palette: colorPalette,
    },
    typography: {
      fontFamilies,
      baseFontSizePx: null, // Hard to infer without computed styles
      headings: undefined, // Could parse h1-h6 styles
    },
    components: {
      buttons: {
        primary: primaryButtonStyle,
        secondary: secondaryButtonStyle,
      },
    },
    sources: {
      pagesAnalyzed: pages.length,
      methods: ['inline-styles', 'css-variables'],
    },
  };
}

/**
 * Merge multiple button style objects into one representative style
 */
function mergeButtonStyles(styles: Record<string, string>[]): ButtonStyle | undefined {
  if (styles.length === 0) {
    return undefined;
  }

  // For now, use the first style as representative
  // Could implement frequency-based merging for better results
  const first = styles[0];

  return {
    backgroundColor: first['background-color'] || first['background'] || null,
    color: first['color'] || null,
    borderRadius: first['border-radius'] || null,
    fontWeight: first['font-weight'] || null,
    padding: first['padding'] || null,
  };
}
