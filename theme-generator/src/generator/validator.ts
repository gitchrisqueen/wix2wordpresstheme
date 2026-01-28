/**
 * Theme Validator
 *
 * Validates generated WordPress themes for compliance
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { Logger } from '../../../crawler/src/lib/logger.js';

const execAsync = promisify(exec);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate generated theme for WordPress compliance
 */
export async function validateTheme(themeDir: string, logger: Logger): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  logger.info('Validating generated theme...');

  // Check for required files
  validateRequiredFiles(themeDir, result, logger);

  // Validate PHP syntax
  await validatePHPSyntax(themeDir, result, logger);

  // Check for required hooks
  await validateRequiredHooks(themeDir, result, logger);

  // Set overall validity
  result.valid = result.errors.length === 0;

  if (result.valid) {
    logger.info('✅ Theme validation passed');
  } else {
    logger.error(`❌ Theme validation failed with ${result.errors.length} errors`);
  }

  if (result.warnings.length > 0) {
    logger.warn(`⚠️  ${result.warnings.length} warnings found`);
  }

  return result;
}

/**
 * Validate that all required WordPress theme files exist
 */
function validateRequiredFiles(
  themeDir: string,
  result: ValidationResult,
  logger: Logger
): void {
  const requiredFiles = ['style.css', 'index.php', 'functions.php', 'header.php', 'footer.php'];

  logger.debug('Checking for required files...');

  for (const file of requiredFiles) {
    const filePath = join(themeDir, file);
    if (!existsSync(filePath)) {
      result.errors.push(`Required file missing: ${file}`);
      logger.error(`Missing required file: ${file}`);
    } else {
      logger.debug(`✓ Found ${file}`);
    }
  }
}

/**
 * Validate PHP syntax using php -l
 */
async function validatePHPSyntax(
  themeDir: string,
  result: ValidationResult,
  logger: Logger
): Promise<void> {
  const phpFiles = ['index.php', 'functions.php', 'header.php', 'footer.php', 'inc/render.php'];

  logger.debug('Validating PHP syntax...');

  for (const file of phpFiles) {
    const filePath = join(themeDir, file);
    if (!existsSync(filePath)) {
      continue; // Already reported as missing
    }

    try {
      const { stdout, stderr } = await execAsync(`php -l "${filePath}"`);
      if (stderr || !stdout.includes('No syntax errors')) {
        result.errors.push(`PHP syntax error in ${file}: ${stderr || stdout}`);
        logger.error(`PHP syntax error in ${file}`);
      } else {
        logger.debug(`✓ ${file} syntax valid`);
      }
    } catch (error) {
      // If php is not available, log warning but don't fail
      const err = error as { code?: string; message?: string };
      if (err.code === 'ENOENT') {
        result.warnings.push('PHP not found - skipping syntax validation');
        logger.warn('PHP command not found - skipping syntax validation');
        break; // Don't try other files
      } else {
        result.errors.push(`Failed to validate ${file}: ${err.message || 'Unknown error'}`);
        logger.error(`Failed to validate ${file}: ${err.message || 'Unknown error'}`);
      }
    }
  }
}

/**
 * Validate that required WordPress hooks are present
 */
async function validateRequiredHooks(
  themeDir: string,
  result: ValidationResult,
  logger: Logger
): Promise<void> {
  logger.debug('Checking for required WordPress hooks...');

  // Check header.php for wp_head()
  const headerPath = join(themeDir, 'header.php');
  if (existsSync(headerPath)) {
    const { default: fs } = await import('fs');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');
    if (!headerContent.includes('wp_head()')) {
      result.errors.push('header.php is missing wp_head() hook');
      logger.error('header.php is missing wp_head() hook');
    } else {
      logger.debug('✓ header.php contains wp_head()');
    }
  }

  // Check footer.php for wp_footer()
  const footerPath = join(themeDir, 'footer.php');
  if (existsSync(footerPath)) {
    const { default: fs } = await import('fs');
    const footerContent = fs.readFileSync(footerPath, 'utf-8');
    if (!footerContent.includes('wp_footer()')) {
      result.errors.push('footer.php is missing wp_footer() hook');
      logger.error('footer.php is missing wp_footer() hook');
    } else {
      logger.debug('✓ footer.php contains wp_footer()');
    }
  }

  // Check functions.php for theme support
  const functionsPath = join(themeDir, 'functions.php');
  if (existsSync(functionsPath)) {
    const { default: fs } = await import('fs');
    const functionsContent = fs.readFileSync(functionsPath, 'utf-8');

    const requiredSupport = ['title-tag', 'post-thumbnails', 'menus'];

    for (const support of requiredSupport) {
      if (!functionsContent.includes(`'${support}'`)) {
        result.warnings.push(`functions.php may be missing theme support for: ${support}`);
        logger.warn(`functions.php may be missing theme support for: ${support}`);
      } else {
        logger.debug(`✓ functions.php has support for ${support}`);
      }
    }

    // Check for wp_enqueue_style
    if (!functionsContent.includes('wp_enqueue_style')) {
      result.warnings.push('functions.php may be missing wp_enqueue_style()');
      logger.warn('functions.php may be missing wp_enqueue_style()');
    } else {
      logger.debug('✓ functions.php contains wp_enqueue_style()');
    }
  }
}
