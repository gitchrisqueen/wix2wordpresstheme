/**
 * Test for generated theme compliance
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createThemeScaffold } from '../generator/scaffold';
import { validateTheme } from '../generator/validator';
import { Logger, LogLevel } from '../../../crawler/src/lib/logger';

describe('Theme Compliance Tests', () => {
  const testDir = join(__dirname, '__test-output__');
  const themeName = 'test-theme';
  const logger = new Logger(LogLevel.ERROR); // Suppress logs in tests

  beforeAll(() => {
    // Clean up any existing test output
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // Clean up test output
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should generate all required WordPress theme files', async () => {
    const themeDir = await createThemeScaffold(
      testDir,
      themeName,
      {
        colors: { primary: '#0073aa', secondary: '#23282d' },
        typography: { fontFamilies: ['Arial, sans-serif'] },
      },
      logger
    );

    // Check for required files
    expect(existsSync(join(themeDir, 'style.css'))).toBe(true);
    expect(existsSync(join(themeDir, 'index.php'))).toBe(true);
    expect(existsSync(join(themeDir, 'functions.php'))).toBe(true);
    expect(existsSync(join(themeDir, 'header.php'))).toBe(true);
    expect(existsSync(join(themeDir, 'footer.php'))).toBe(true);
  });

  it('should include wp_head() in header.php', async () => {
    const themeDir = join(testDir, themeName);
    const headerContent = readFileSync(join(themeDir, 'header.php'), 'utf-8');

    expect(headerContent).toContain('wp_head()');
    expect(headerContent).toContain('<!DOCTYPE html>');
    expect(headerContent).toContain('<head>');
  });

  it('should include wp_footer() in footer.php', async () => {
    const themeDir = join(testDir, themeName);
    const footerContent = readFileSync(join(themeDir, 'footer.php'), 'utf-8');

    expect(footerContent).toContain('wp_footer()');
    expect(footerContent).toContain('</body>');
    expect(footerContent).toContain('</html>');
  });

  it('should include WordPress Loop in index.php', async () => {
    const themeDir = join(testDir, themeName);
    const indexContent = readFileSync(join(themeDir, 'index.php'), 'utf-8');

    expect(indexContent).toContain('get_header()');
    expect(indexContent).toContain('get_footer()');
    expect(indexContent).toContain('have_posts()');
    expect(indexContent).toContain('the_post()');
    expect(indexContent).toContain('the_content()');
  });

  it('should have proper theme header in style.css', async () => {
    const themeDir = join(testDir, themeName);
    const styleContent = readFileSync(join(themeDir, 'style.css'), 'utf-8');

    expect(styleContent).toContain('Theme Name:');
    expect(styleContent).toContain('Theme URI: https://example.com');
    expect(styleContent).toContain('Author: Wix2WP Converter');
    expect(styleContent).toContain('Version:');
    expect(styleContent).toContain('Text Domain:');
  });

  it('should include theme support in functions.php', async () => {
    const themeDir = join(testDir, themeName);
    const functionsContent = readFileSync(join(themeDir, 'functions.php'), 'utf-8');

    expect(functionsContent).toContain("add_theme_support( 'title-tag' )");
    expect(functionsContent).toContain("add_theme_support( 'post-thumbnails' )");
    expect(functionsContent).toContain("add_theme_support( 'menus' )");
  });

  it('should register navigation menus in functions.php', async () => {
    const themeDir = join(testDir, themeName);
    const functionsContent = readFileSync(join(themeDir, 'functions.php'), 'utf-8');

    expect(functionsContent).toContain('register_nav_menus');
    expect(functionsContent).toContain('primary');
  });

  it('should enqueue styles in functions.php', async () => {
    const themeDir = join(testDir, themeName);
    const functionsContent = readFileSync(join(themeDir, 'functions.php'), 'utf-8');

    expect(functionsContent).toContain('wp_enqueue_style');
    expect(functionsContent).toContain('get_stylesheet_uri()');
  });

  it('should wrap functions with function_exists checks', async () => {
    const themeDir = join(testDir, themeName);
    const functionsContent = readFileSync(join(themeDir, 'functions.php'), 'utf-8');

    expect(functionsContent).toContain('if ( ! function_exists(');
  });

  it('should pass theme validation', async () => {
    const themeDir = join(testDir, themeName);
    const validationResult = await validateTheme(themeDir, logger);

    // Should have no errors (warnings are ok, e.g., PHP not found)
    expect(validationResult.errors).toHaveLength(0);
  });

  it('should create necessary directory structure', async () => {
    const themeDir = join(testDir, themeName);

    expect(existsSync(join(themeDir, 'assets'))).toBe(true);
    expect(existsSync(join(themeDir, 'assets', 'imported'))).toBe(true);
    expect(existsSync(join(themeDir, 'assets', 'css'))).toBe(true);
    expect(existsSync(join(themeDir, 'assets', 'js'))).toBe(true);
    expect(existsSync(join(themeDir, 'block-templates'))).toBe(true);
    expect(existsSync(join(themeDir, 'patterns'))).toBe(true);
    expect(existsSync(join(themeDir, 'parts', 'sections'))).toBe(true);
    expect(existsSync(join(themeDir, 'inc'))).toBe(true);
  });

  it('should create render helpers with function_exists checks', async () => {
    const themeDir = join(testDir, themeName);
    const renderContent = readFileSync(join(themeDir, 'inc', 'render.php'), 'utf-8');

    expect(renderContent).toContain('if ( ! function_exists( \'render_section\' ) )');
    expect(renderContent).toContain('if ( ! function_exists( \'render_section_generic\' ) )');
    expect(renderContent).toContain('if ( ! function_exists( \'resolve_asset_url\' ) )');
  });
});
