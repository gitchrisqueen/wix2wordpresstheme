/**
 * Theme Scaffold Generator
 *
 * Creates the basic WordPress theme directory structure and core files.
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type { ThemeMetadata } from '../types/generator.js';

interface DesignTokens {
  colors?: {
    primary?: string | null;
    secondary?: string | null;
  };
  typography?: {
    fontFamilies?: string[];
  };
}

/**
 * Create theme scaffold with all required directories and base files
 */
export async function createThemeScaffold(
  outDir: string,
  themeName: string,
  designTokens: DesignTokens,
  logger: Logger
): Promise<string> {
  // Create output directory if it doesn't exist
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  // Theme directory path
  const themeDir = join(outDir, themeName);

  // Create theme directory structure
  const directories = [
    themeDir,
    join(themeDir, 'assets'),
    join(themeDir, 'assets', 'imported'),
    join(themeDir, 'assets', 'css'),
    join(themeDir, 'assets', 'js'),
    join(themeDir, 'block-templates'),
    join(themeDir, 'block-template-parts'),
    join(themeDir, 'patterns'),
    join(themeDir, 'parts'),
    join(themeDir, 'parts', 'sections'),
    join(themeDir, 'inc'),
    join(themeDir, '.generated'),
  ];

  for (const dir of directories) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  }

  // Generate theme metadata
  const metadata: ThemeMetadata = {
    name: formatThemeName(themeName),
    description: `A WordPress theme generated from Wix site`,
    version: '1.0.0',
    textDomain: themeName,
    author: 'Wix2WordPress Converter',
    tags: ['block-patterns', 'block-styles', 'custom-colors', 'editor-style'],
  };

  // Create style.css
  await createStyleCSS(themeDir, metadata, designTokens, logger);

  // Create functions.php
  await createFunctionsPHP(themeDir, themeName, logger);

  // Create inc/render.php
  await createRenderPHP(themeDir, logger);

  // Create index.php (required by WordPress)
  await createIndexPHP(themeDir, logger);

  // Create header.php
  await createHeaderPHP(themeDir, themeName, logger);

  // Create footer.php
  await createFooterPHP(themeDir, logger);

  logger.info(`Theme scaffold created at: ${themeDir}`);
  return themeDir;
}

/**
 * Format theme name for display
 */
function formatThemeName(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Sanitize theme name for use in PHP function names
 * Replace hyphens and other invalid characters with underscores
 */
function sanitizeFunctionName(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Create style.css with theme header
 */
async function createStyleCSS(
  themeDir: string,
  metadata: ThemeMetadata,
  designTokens: DesignTokens,
  logger: Logger
): Promise<void> {
  const content = `/*
Theme Name: ${metadata.name}
Theme URI: https://example.com
Author: Wix2WP Converter
Author URI: ${metadata.authorUri || ''}
Description: ${metadata.description}
Version: ${metadata.version}
License: ${metadata.license || 'GPL-2.0-or-later'}
License URI: ${metadata.license ? 'https://www.gnu.org/licenses/gpl-2.0.html' : ''}
Text Domain: ${metadata.textDomain}
Tags: ${metadata.tags?.join(', ') || ''}
*/

/*
 * Global Styles
 */

:root {
  /* Colors from design tokens */
  --wp--preset--color--primary: ${designTokens.colors?.primary || '#0073aa'};
  --wp--preset--color--secondary: ${designTokens.colors?.secondary || '#23282d'};
  
  /* Typography */
  --wp--preset--font-family--base: ${designTokens.typography?.fontFamilies?.[0] || 'system-ui, -apple-system, sans-serif'};
}

body {
  font-family: var(--wp--preset--font-family--base);
  line-height: 1.6;
  color: #333;
}

.wp-block-group {
  margin-top: 0;
  margin-bottom: 0;
}
`;

  const path = join(themeDir, 'style.css');
  writeFileSync(path, content, 'utf-8');
  logger.debug(`Created style.css`);
}

/**
 * Create functions.php
 */
async function createFunctionsPHP(
  themeDir: string,
  themeName: string,
  logger: Logger
): Promise<void> {
  const functionPrefix = sanitizeFunctionName(themeName);
  const content = `<?php
/**
 * Theme functions and definitions
 *
 * @package ${formatThemeName(themeName)}
 */

if ( ! defined( 'ABSPATH' ) ) {
  exit;
}

/**
 * Theme setup
 */
if ( ! function_exists( '${functionPrefix}_setup' ) ) {
  function ${functionPrefix}_setup() {
    // Add theme support
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'menus' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
    add_theme_support( 'automatic-feed-links' );
    
    // Block editor support
    add_theme_support( 'wp-block-styles' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'editor-styles' );
    
    // Register navigation menus
    register_nav_menus( array(
      'primary' => __( 'Primary Menu', '${themeName}' ),
    ) );
    
    // Register block patterns
    if ( function_exists( 'register_block_pattern_category' ) ) {
      register_block_pattern_category( 'wix2wp-hero', array( 'label' => __( 'Hero Sections', '${themeName}' ) ) );
      register_block_pattern_category( 'wix2wp-content', array( 'label' => __( 'Content Sections', '${themeName}' ) ) );
      register_block_pattern_category( 'wix2wp-layout', array( 'label' => __( 'Layout Patterns', '${themeName}' ) ) );
      register_block_pattern_category( 'wix2wp-cta', array( 'label' => __( 'Call to Action', '${themeName}' ) ) );
    }
  }
}
add_action( 'after_setup_theme', '${functionPrefix}_setup' );

/**
 * Enqueue scripts and styles
 */
if ( ! function_exists( '${functionPrefix}_scripts' ) ) {
  function ${functionPrefix}_scripts() {
    // Main stylesheet
    wp_enqueue_style( '${themeName}-style', get_stylesheet_uri(), array(), '1.0.0' );
    
    // Block editor styles (if exists)
    if ( file_exists( get_template_directory() . '/assets/css/editor.css' ) ) {
      add_editor_style( 'assets/css/editor.css' );
    }
  }
}
add_action( 'wp_enqueue_scripts', '${functionPrefix}_scripts' );

/**
 * Include render helpers
 */
require_once get_template_directory() . '/inc/render.php';

/**
 * Register block patterns
 */
if ( ! function_exists( '${functionPrefix}_register_patterns' ) ) {
  function ${functionPrefix}_register_patterns() {
    $patterns_dir = get_template_directory() . '/patterns';
    
    if ( ! is_dir( $patterns_dir ) ) {
      return;
    }
    
    $patterns = glob( $patterns_dir . '/*.php' );
    
    foreach ( $patterns as $pattern_file ) {
      $pattern_slug = '${themeName}/' . basename( $pattern_file, '.php' );
      require_once $pattern_file;
    }
  }
}
add_action( 'init', '${functionPrefix}_register_patterns' );
`;

  const path = join(themeDir, 'functions.php');
  writeFileSync(path, content, 'utf-8');
  logger.debug(`Created functions.php`);
}

/**
 * Create inc/render.php with rendering helpers
 */
async function createRenderPHP(themeDir: string, logger: Logger): Promise<void> {
  const content = `<?php
/**
 * Rendering helpers for PHP sections
 *
 * @package Wix2WP
 */

if ( ! defined( 'ABSPATH' ) ) {
  exit;
}

/**
 * Render a section by ID
 *
 * @param string $section_id Section identifier
 * @param array  $data       Section data
 */
if ( ! function_exists( 'render_section' ) ) {
  function render_section( $section_id, $data = array() ) {
    if ( empty( $data ) ) {
      echo '<!-- Section ' . esc_attr( $section_id ) . ' -->';
      return;
    }
    
    $type = $data['type'] ?? 'unknown';
    $template_path = get_template_directory() . '/parts/sections/' . $type . '.php';
    
    if ( file_exists( $template_path ) ) {
      set_query_var( 'section', $data );
      load_template( $template_path, false );
    } else {
      // Fallback to generic rendering
      render_section_generic( $data );
    }
  }
}

/**
 * Generic section renderer
 *
 * @param array $section Section data
 */
if ( ! function_exists( 'render_section_generic' ) ) {
  function render_section_generic( $section ) {
    ?>
    <div class="wp-block-group section-<?php echo esc_attr( $section['type'] ?? 'unknown' ); ?>">
      <?php if ( ! empty( $section['heading'] ) ) : ?>
        <h2><?php echo esc_html( $section['heading'] ); ?></h2>
      <?php endif; ?>
      
      <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <p><?php echo esc_html( $text ); ?></p>
        <?php endforeach; ?>
      <?php endif; ?>
      
      <?php if ( ! empty( $section['ctas'] ) ) : ?>
        <div class="wp-block-buttons">
          <?php foreach ( $section['ctas'] as $cta ) : ?>
            <?php if ( ! empty( $cta['href'] ) ) : ?>
              <div class="wp-block-button">
                <a class="wp-block-button__link" href="<?php echo esc_url( $cta['href'] ); ?>">
                  <?php echo esc_html( $cta['text'] ); ?>
                </a>
              </div>
            <?php endif; ?>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
      
      <?php if ( ! empty( $section['media'] ) ) : ?>
        <?php foreach ( $section['media'] as $media ) : ?>
          <?php if ( $media['type'] === 'image' && ! empty( $media['src'] ) ) : ?>
            <figure class="wp-block-image">
              <img src="<?php echo esc_url( resolve_asset_url( $media['src'] ) ); ?>" 
                   alt="<?php echo esc_attr( $media['alt'] ?? '' ); ?>" />
            </figure>
          <?php endif; ?>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
    <?php
  }
}

/**
 * Resolve asset URL to theme asset or fallback to original
 *
 * @param string $original_url Original asset URL
 * @return string Resolved URL
 */
if ( ! function_exists( 'resolve_asset_url' ) ) {
  function resolve_asset_url( $original_url ) {
    static $asset_map = null;
    
    if ( $asset_map === null ) {
      $map_path = get_template_directory() . '/.generated/asset-map.json';
      if ( file_exists( $map_path ) ) {
        $asset_map = json_decode( file_get_contents( $map_path ), true );
      } else {
        $asset_map = array();
      }
    }
    
    if ( isset( $asset_map[ $original_url ] ) ) {
      return get_template_directory_uri() . '/' . $asset_map[ $original_url ];
    }
    
    return $original_url;
  }
}

/**
 * Sanitize text for output
 *
 * @param string $text Text to sanitize
 * @return string Sanitized text
 */
function sanitize_text( $text ) {
  return wp_kses_post( $text );
}
`;

  const path = join(themeDir, 'inc', 'render.php');
  writeFileSync(path, content, 'utf-8');
  logger.debug(`Created inc/render.php`);
}

/**
 * Create index.php (required by WordPress)
 */
async function createIndexPHP(themeDir: string, logger: Logger): Promise<void> {
  const content = `<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 * It is used to display a page when nothing more specific matches a query.
 *
 * @package Wix2WP
 */

get_header();
?>

<main id="primary" class="site-main">

  <?php
  if ( have_posts() ) :
    while ( have_posts() ) :
      the_post();
      ?>
      <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
        <header class="entry-header">
          <?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
        </header>

        <div class="entry-content">
          <?php
          the_content();
          ?>
        </div>
      </article>
      <?php
    endwhile;
  else :
    ?>
    <div class="no-content">
      <h1><?php esc_html_e( 'Nothing Found', 'wix2wp' ); ?></h1>
      <p><?php esc_html_e( 'It looks like nothing was found at this location.', 'wix2wp' ); ?></p>
    </div>
    <?php
  endif;
  ?>

</main>

<?php
get_footer();
`;

  const path = join(themeDir, 'index.php');
  writeFileSync(path, content, 'utf-8');
  logger.debug(`Created index.php`);
}

/**
 * Create header.php with wp_head() hook
 */
async function createHeaderPHP(
  themeDir: string,
  themeName: string,
  logger: Logger
): Promise<void> {
  const content = `<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @package ${formatThemeName(themeName)}
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="profile" href="https://gmpg.org/xfn/11">

  <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
  <a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', '${themeName}' ); ?></a>

  <header id="masthead" class="site-header">
    <div class="site-branding">
      <?php
      if ( has_custom_logo() ) :
        the_custom_logo();
      else :
        ?>
        <h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
        <?php
        $description = get_bloginfo( 'description', 'display' );
        if ( $description || is_customize_preview() ) :
          ?>
          <p class="site-description"><?php echo esc_html( $description ); ?></p>
          <?php
        endif;
      endif;
      ?>
    </div>

    <nav id="site-navigation" class="main-navigation">
      <?php
      wp_nav_menu(
        array(
          'theme_location' => 'primary',
          'menu_id'        => 'primary-menu',
          'fallback_cb'    => false,
        )
      );
      ?>
    </nav>
  </header>

  <div id="content" class="site-content">
`;

  const path = join(themeDir, 'header.php');
  writeFileSync(path, content, 'utf-8');
  logger.debug(`Created header.php`);
}

/**
 * Create footer.php with wp_footer() hook
 */
async function createFooterPHP(themeDir: string, logger: Logger): Promise<void> {
  const content = `<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @package Wix2WP
 */
?>

  </div><!-- #content -->

  <footer id="colophon" class="site-footer">
    <div class="site-info">
      <a href="<?php echo esc_url( __( 'https://wordpress.org/', 'wix2wp' ) ); ?>">
        <?php
        /* translators: %s: CMS name, i.e. WordPress. */
        printf( esc_html__( 'Proudly powered by %s', 'wix2wp' ), 'WordPress' );
        ?>
      </a>
      <span class="sep"> | </span>
      <?php
      /* translators: %s: Theme name */
      printf( esc_html__( 'Theme: %s', 'wix2wp' ), '<span>Wix2WP</span>' );
      ?>
    </div>
  </footer>
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>
`;

  const path = join(themeDir, 'footer.php');
  writeFileSync(path, content, 'utf-8');
  logger.debug(`Created footer.php`);
}
