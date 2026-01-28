/**
 * theme.json Generator
 *
 * Converts design tokens to WordPress theme.json format.
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type { GenerationMetadata } from '../types/generator.js';

interface DesignTokens {
  colors?: {
    primary?: string | null;
    secondary?: string | null;
    palette?: string[];
  };
  typography?: {
    fontFamilies?: string[];
    baseFontSizePx?: number | null;
  };
  components?: {
    buttons?: {
      primary?: {
        backgroundColor?: string;
        color?: string;
        borderRadius?: string;
        padding?: string;
        fontWeight?: string;
      };
      secondary?: {
        backgroundColor?: string;
        color?: string;
        borderRadius?: string;
        padding?: string;
        fontWeight?: string;
      };
    };
  };
}

interface ThemeJson {
  $schema: string;
  version: number;
  settings: {
    color?: {
      palette?: Array<{ slug: string; color: string; name: string }>;
    };
    typography?: {
      fontFamilies?: Array<{ slug: string; fontFamily: string; name: string }>;
      fontSizes?: Array<{ slug: string; size: string; name: string }>;
    };
    spacing?: {
      units?: string[];
    };
  };
  styles?: {
    color?: {
      background?: string;
      text?: string;
    };
    typography?: {
      fontFamily?: string;
      fontSize?: string;
    };
    elements?: {
      button?: {
        color?: {
          background?: string;
          text?: string;
        };
        border?: {
          radius?: string;
        };
        spacing?: {
          padding?: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
          };
        };
        typography?: {
          fontWeight?: string;
        };
      };
    };
  };
}

/**
 * Generate theme.json from design tokens
 */
export async function generateThemeJson(
  themeDir: string,
  designTokens: DesignTokens,
  metadata: GenerationMetadata,
  logger: Logger,
): Promise<void> {
  const themeJson: ThemeJson = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 2,
    settings: {
      color: buildColorSettings(designTokens, metadata, logger),
      typography: buildTypographySettings(designTokens, metadata, logger),
      spacing: {
        units: ['px', 'em', 'rem', 'vh', 'vw', '%'],
      },
    },
    styles: buildStyles(designTokens, metadata, logger),
  };

  const path = join(themeDir, 'theme.json');
  writeFileSync(path, JSON.stringify(themeJson, null, 2), 'utf-8');
  logger.debug(`Created theme.json`);
}

/**
 * Build color settings from design tokens
 */
function buildColorSettings(
  designTokens: DesignTokens,
  metadata: GenerationMetadata,
  logger: Logger,
): { palette: Array<{ slug: string; color: string; name: string }> } | undefined {
  const colors = designTokens.colors;
  if (!colors) {
    logger.debug('No color tokens available');
    metadata.warnings.push('theme.json: No color tokens available');
    return undefined;
  }

  const palette: Array<{ slug: string; color: string; name: string }> = [];

  // Add primary color
  if (colors.primary) {
    palette.push({
      slug: 'primary',
      color: colors.primary,
      name: 'Primary',
    });
  }

  // Add secondary color
  if (colors.secondary) {
    palette.push({
      slug: 'secondary',
      color: colors.secondary,
      name: 'Secondary',
    });
  }

  // Add palette colors
  if (colors.palette && colors.palette.length > 0) {
    colors.palette.slice(0, 10).forEach((color, index) => {
      // Skip if already added as primary/secondary
      if (color !== colors.primary && color !== colors.secondary) {
        palette.push({
          slug: `palette-${index + 1}`,
          color: color,
          name: `Palette ${index + 1}`,
        });
      }
    });
  }

  // Add default colors if palette is empty
  if (palette.length === 0) {
    logger.debug('No color tokens found, using defaults');
    palette.push(
      {
        slug: 'primary',
        color: '#0073aa',
        name: 'Primary',
      },
      {
        slug: 'secondary',
        color: '#23282d',
        name: 'Secondary',
      },
    );
    metadata.warnings.push('theme.json: Using default colors (no tokens available)');
  }

  return { palette };
}

/**
 * Build typography settings from design tokens
 */
function buildTypographySettings(
  designTokens: DesignTokens,
  metadata: GenerationMetadata,
  logger: Logger,
):
  | {
      fontFamilies?: Array<{ slug: string; fontFamily: string; name: string }>;
      fontSizes?: Array<{ slug: string; size: string; name: string }>;
    }
  | undefined {
  const typography = designTokens.typography;
  if (!typography) {
    logger.debug('No typography tokens available');
    metadata.warnings.push('theme.json: No typography tokens available');
    return undefined;
  }

  const settings: {
    fontFamilies?: Array<{ slug: string; fontFamily: string; name: string }>;
    fontSizes?: Array<{ slug: string; size: string; name: string }>;
  } = {};

  // Add font families
  if (typography.fontFamilies && typography.fontFamilies.length > 0) {
    settings.fontFamilies = typography.fontFamilies.slice(0, 5).map((family, index) => ({
      slug: index === 0 ? 'base' : `font-${index}`,
      fontFamily: family,
      name: index === 0 ? 'Base' : `Font ${index}`,
    }));
  } else {
    // Default font family
    settings.fontFamilies = [
      {
        slug: 'base',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        name: 'Base',
      },
    ];
    metadata.warnings.push('theme.json: Using default font family');
  }

  // Add font sizes (standard WordPress sizes)
  settings.fontSizes = [
    { slug: 'small', size: '14px', name: 'Small' },
    { slug: 'medium', size: '16px', name: 'Medium' },
    { slug: 'large', size: '20px', name: 'Large' },
    { slug: 'x-large', size: '24px', name: 'Extra Large' },
  ];

  // Override base size if available
  if (typography.baseFontSizePx) {
    settings.fontSizes[1].size = `${typography.baseFontSizePx}px`;
  }

  return settings;
}

/**
 * Build global styles from design tokens
 */
function buildStyles(
  designTokens: DesignTokens,
  metadata: GenerationMetadata,
  logger: Logger,
): ThemeJson['styles'] {
  const styles: ThemeJson['styles'] = {
    typography: {},
    elements: {},
  };

  // Set base font family
  if (designTokens.typography?.fontFamilies?.[0]) {
    styles.typography!.fontFamily = designTokens.typography.fontFamilies[0];
  }

  // Set base font size
  if (designTokens.typography?.baseFontSizePx) {
    styles.typography!.fontSize = `${designTokens.typography.baseFontSizePx}px`;
  }

  // Build button styles from component tokens
  if (designTokens.components?.buttons?.primary) {
    const buttonStyles = designTokens.components.buttons.primary;

    styles.elements!.button = {
      color: {},
      border: {},
      spacing: { padding: {} },
      typography: {},
    };

    if (buttonStyles.backgroundColor) {
      styles.elements!.button!.color!.background = buttonStyles.backgroundColor;
    }

    if (buttonStyles.color) {
      styles.elements!.button!.color!.text = buttonStyles.color;
    }

    if (buttonStyles.borderRadius) {
      styles.elements!.button!.border!.radius = buttonStyles.borderRadius;
    }

    if (buttonStyles.padding) {
      // Parse padding (simple case: assume uniform)
      styles.elements!.button!.spacing!.padding = {
        top: buttonStyles.padding,
        right: buttonStyles.padding,
        bottom: buttonStyles.padding,
        left: buttonStyles.padding,
      };
    }

    if (buttonStyles.fontWeight) {
      styles.elements!.button!.typography!.fontWeight = buttonStyles.fontWeight;
    }
  }

  return styles;
}
