/**
 * PHP Section Templates Generator
 *
 * Generate PHP section partial templates for WordPress theme
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Logger } from '../../../crawler/src/lib/logger.js';
import type { GeneratorMode } from '../types/generator.js';
import type { GenerationMetadata } from '../types/generator.js';

/**
 * Generate PHP section templates
 */
export function generatePHPSections(
  themeDir: string,
  _mode: GeneratorMode,
  _metadata: GenerationMetadata,
  logger: Logger,
): void {
  const sectionsDir = join(themeDir, 'parts', 'sections');
  if (!existsSync(sectionsDir)) {
    mkdirSync(sectionsDir, { recursive: true });
  }

  // Generate each section type
  const sectionTypes = [
    'header',
    'hero',
    'footer',
    'cta',
    'contactForm',
    'featureGrid',
    'gallery',
    'testimonial',
    'pricing',
    'faq',
    'richText',
  ];

  for (const sectionType of sectionTypes) {
    const content = generateSectionTemplate(sectionType);
    const filePath = join(sectionsDir, `${sectionType}.php`);
    writeFileSync(filePath, content, 'utf-8');
    logger.debug(`Generated PHP section: ${sectionType}.php`);
  }

  logger.info(`Generated ${sectionTypes.length} PHP section templates`);
}

/**
 * Generate PHP template for specific section type
 */
function generateSectionTemplate(sectionType: string): string {
  switch (sectionType) {
    case 'header':
      return generateHeaderTemplate();
    case 'hero':
      return generateHeroTemplate();
    case 'footer':
      return generateFooterTemplate();
    case 'cta':
      return generateCtaTemplate();
    case 'contactForm':
      return generateContactFormTemplate();
    case 'featureGrid':
      return generateFeatureGridTemplate();
    case 'gallery':
      return generateGalleryTemplate();
    case 'testimonial':
      return generateTestimonialTemplate();
    case 'pricing':
      return generatePricingTemplate();
    case 'faq':
      return generateFaqTemplate();
    case 'richText':
      return generateRichTextTemplate();
    default:
      return generateGenericTemplate(sectionType);
  }
}

/**
 * Header section template
 */
function generateHeaderTemplate(): string {
  return `<?php
/**
 * Section Template: Header
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<header class="site-header section-header" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="header-container">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <div class="site-branding">
        <h1 class="site-title"><?php echo esc_html( $section['heading'] ); ?></h1>
      </div>
    <?php endif; ?>

    <?php if ( ! empty( $section['ctas'] ) ) : ?>
      <nav class="header-nav">
        <?php foreach ( $section['ctas'] as $cta ) : ?>
          <a href="<?php echo esc_url( $cta['href'] ?? '#' ); ?>" class="nav-link">
            <?php echo esc_html( $cta['text'] ?? '' ); ?>
          </a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>
  </div>
</header>
`;
}

/**
 * Hero section template
 */
function generateHeroTemplate(): string {
  return `<?php
/**
 * Section Template: Hero
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="hero-section section-hero" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="hero-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h1 class="hero-heading"><?php echo esc_html( $section['heading'] ); ?></h1>
    <?php endif; ?>

    <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
      <div class="hero-text">
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <p><?php echo esc_html( $text ); ?></p>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if ( ! empty( $section['ctas'] ) ) : ?>
      <div class="hero-actions">
        <?php foreach ( $section['ctas'] as $cta ) : ?>
          <a href="<?php echo esc_url( $cta['href'] ?? '#' ); ?>" class="btn btn-primary">
            <?php echo esc_html( $cta['text'] ?? '' ); ?>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if ( ! empty( $section['media'] ) ) : ?>
      <div class="hero-media">
        <?php foreach ( $section['media'] as $media ) : ?>
          <?php if ( $media['type'] === 'image' && ! empty( $media['src'] ) ) : ?>
            <?php
            $asset_url = resolve_asset_url( $media['src'], $media['localAsset'] ?? null );
            ?>
            <img src="<?php echo esc_url( $asset_url ); ?>" 
                 alt="<?php echo esc_attr( $media['alt'] ?? '' ); ?>" 
                 class="hero-image" />
          <?php endif; ?>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</section>
`;
}

/**
 * Footer section template
 */
function generateFooterTemplate(): string {
  return `<?php
/**
 * Section Template: Footer
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<footer class="site-footer section-footer" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="footer-container">
    <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
      <div class="footer-text">
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <p><?php echo esc_html( $text ); ?></p>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if ( ! empty( $section['ctas'] ) ) : ?>
      <nav class="footer-nav">
        <?php foreach ( $section['ctas'] as $cta ) : ?>
          <a href="<?php echo esc_url( $cta['href'] ?? '#' ); ?>" class="footer-link">
            <?php echo esc_html( $cta['text'] ?? '' ); ?>
          </a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>
  </div>
</footer>
`;
}

/**
 * CTA section template
 */
function generateCtaTemplate(): string {
  return `<?php
/**
 * Section Template: Call-to-Action
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="cta-section section-cta" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="cta-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="cta-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
      <div class="cta-text">
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <p><?php echo esc_html( $text ); ?></p>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <?php if ( ! empty( $section['ctas'] ) ) : ?>
      <div class="cta-actions">
        <?php foreach ( $section['ctas'] as $cta ) : ?>
          <a href="<?php echo esc_url( $cta['href'] ?? '#' ); ?>" class="btn btn-cta">
            <?php echo esc_html( $cta['text'] ?? '' ); ?>
          </a>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</section>
`;
}

/**
 * Contact Form section template
 */
function generateContactFormTemplate(): string {
  return `<?php
/**
 * Section Template: Contact Form
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="contact-form-section section-contactForm" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="contact-form-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="form-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
      <div class="form-description">
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <p><?php echo esc_html( $text ); ?></p>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>

    <form class="contact-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
      <?php wp_nonce_field( 'contact_form_submit', 'contact_form_nonce' ); ?>
      <input type="hidden" name="action" value="submit_contact_form" />
      
      <div class="form-field">
        <label for="contact-name">Name</label>
        <input type="text" id="contact-name" name="name" required />
      </div>

      <div class="form-field">
        <label for="contact-email">Email</label>
        <input type="email" id="contact-email" name="email" required />
      </div>

      <div class="form-field">
        <label for="contact-message">Message</label>
        <textarea id="contact-message" name="message" rows="5" required></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Send Message</button>
      </div>
    </form>
  </div>
</section>
`;
}

/**
 * Feature Grid section template
 */
function generateFeatureGridTemplate(): string {
  return `<?php
/**
 * Section Template: Feature Grid
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="feature-grid-section section-featureGrid" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="feature-grid-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="section-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <div class="feature-grid">
      <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
        <?php foreach ( $section['textBlocks'] as $index => $text ) : ?>
          <div class="feature-item">
            <?php if ( ! empty( $section['media'][ $index ] ) ) : ?>
              <?php $media = $section['media'][ $index ]; ?>
              <?php if ( $media['type'] === 'image' && ! empty( $media['src'] ) ) : ?>
                <?php $asset_url = resolve_asset_url( $media['src'], $media['localAsset'] ?? null ); ?>
                <img src="<?php echo esc_url( $asset_url ); ?>" 
                     alt="<?php echo esc_attr( $media['alt'] ?? '' ); ?>" 
                     class="feature-icon" />
              <?php endif; ?>
            <?php endif; ?>
            <p class="feature-text"><?php echo esc_html( $text ); ?></p>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>
</section>
`;
}

/**
 * Gallery section template
 */
function generateGalleryTemplate(): string {
  return `<?php
/**
 * Section Template: Gallery
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="gallery-section section-gallery" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="gallery-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="section-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <?php if ( ! empty( $section['media'] ) ) : ?>
      <div class="gallery-grid">
        <?php foreach ( $section['media'] as $media ) : ?>
          <?php if ( $media['type'] === 'image' && ! empty( $media['src'] ) ) : ?>
            <?php $asset_url = resolve_asset_url( $media['src'], $media['localAsset'] ?? null ); ?>
            <div class="gallery-item">
              <img src="<?php echo esc_url( $asset_url ); ?>" 
                   alt="<?php echo esc_attr( $media['alt'] ?? '' ); ?>" 
                   class="gallery-image" />
            </div>
          <?php endif; ?>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</section>
`;
}

/**
 * Testimonial section template
 */
function generateTestimonialTemplate(): string {
  return `<?php
/**
 * Section Template: Testimonial
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="testimonial-section section-testimonial" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="testimonial-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="section-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <div class="testimonials">
      <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <blockquote class="testimonial-item">
            <p class="testimonial-text"><?php echo esc_html( $text ); ?></p>
          </blockquote>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>
</section>
`;
}

/**
 * Pricing section template
 */
function generatePricingTemplate(): string {
  return `<?php
/**
 * Section Template: Pricing
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="pricing-section section-pricing" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="pricing-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="section-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <div class="pricing-grid">
      <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
        <?php foreach ( $section['textBlocks'] as $index => $text ) : ?>
          <div class="pricing-item">
            <div class="pricing-details">
              <p><?php echo esc_html( $text ); ?></p>
            </div>
            <?php if ( ! empty( $section['ctas'][ $index ] ) ) : ?>
              <?php $cta = $section['ctas'][ $index ]; ?>
              <a href="<?php echo esc_url( $cta['href'] ?? '#' ); ?>" class="btn btn-pricing">
                <?php echo esc_html( $cta['text'] ?? '' ); ?>
              </a>
            <?php endif; ?>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>
</section>
`;
}

/**
 * FAQ section template
 */
function generateFaqTemplate(): string {
  return `<?php
/**
 * Section Template: FAQ
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="faq-section section-faq" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="faq-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="section-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <div class="faq-list">
      <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <div class="faq-item">
            <p><?php echo esc_html( $text ); ?></p>
          </div>
        <?php endforeach; ?>
      <?php endif; ?>
    </div>
  </div>
</section>
`;
}

/**
 * Rich Text section template
 */
function generateRichTextTemplate(): string {
  return `<?php
/**
 * Section Template: Rich Text
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}
?>

<section class="rich-text-section section-richText" id="<?php echo esc_attr( $section['id'] ?? '' ); ?>">
  <div class="rich-text-content">
    <?php if ( ! empty( $section['heading'] ) ) : ?>
      <h2 class="section-heading"><?php echo esc_html( $section['heading'] ); ?></h2>
    <?php endif; ?>

    <?php if ( ! empty( $section['textBlocks'] ) ) : ?>
      <div class="text-content">
        <?php foreach ( $section['textBlocks'] as $text ) : ?>
          <p><?php echo esc_html( $text ); ?></p>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</section>
`;
}

/**
 * Generic section template fallback
 */
function generateGenericTemplate(sectionType: string): string {
  return `<?php
/**
 * Section Template: ${sectionType}
 *
 * @var array $section Section data
 */

if ( empty( $section ) ) {
  return;
}

render_section_generic( $section );
`;
}
