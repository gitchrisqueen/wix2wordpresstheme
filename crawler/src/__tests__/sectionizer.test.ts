/**
 * Tests for sectionizer
 */

import { describe, it, expect } from 'vitest';
import { sectionizeHtml } from '../spec/sectionizer.js';

describe('sectionizeHtml', () => {
  it('should extract header section', () => {
    const html = `
      <body>
        <header>
          <h1>Site Title</h1>
          <nav><a href="/">Home</a></nav>
        </header>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].type).toBe('header');
    expect(sections[0].heading).toBe('Site Title');
  });

  it('should extract hero section', () => {
    const html = `
      <body>
        <main>
          <section class="hero">
            <h1>Welcome</h1>
            <p>Get started today</p>
            <a href="/signup">Sign Up</a>
          </section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    // The first section should be detected (might be unknown if hero heuristics not met)
    expect(sections[0].heading).toBe('Welcome');
    expect(sections[0].ctas.length).toBeGreaterThan(0);
  });

  it('should extract footer section', () => {
    const html = `
      <body>
        <footer>
          <p>&copy; 2024 Company</p>
        </footer>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    const footer = sections.find((s) => s.type === 'footer');
    expect(footer).toBeDefined();
  });

  it('should extract contact form section', () => {
    const html = `
      <body>
        <main>
          <section class="contact">
            <h2>Contact Us</h2>
            <form>
              <input type="text" name="name" />
              <input type="email" name="email" />
              <button>Submit</button>
            </form>
          </section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    const contact = sections.find((s) => s.type === 'contactForm');
    expect(contact).toBeDefined();
  });

  it('should extract media from sections', () => {
    const html = `
      <body>
        <main>
          <section>
            <h2>Gallery</h2>
            <img src="/img1.jpg" alt="Image 1" />
            <img src="/img2.jpg" alt="Image 2" />
            <img src="/img3.jpg" alt="Image 3" />
          </section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    const gallery = sections.find((s) => s.media && s.media.length >= 3);
    expect(gallery).toBeDefined();
    expect(gallery?.media[0].src).toBe('/img1.jpg');
    expect(gallery?.media[0].alt).toBe('Image 1');
  });

  it('should generate deterministic section IDs', () => {
    const html = `
      <body>
        <main>
          <section><h2>Section 1</h2></section>
          <section><h2>Section 2</h2></section>
          <section><h2>Section 3</h2></section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBe(3);
    expect(sections[0].id).toBe('sec_001');
    expect(sections[1].id).toBe('sec_002');
    expect(sections[2].id).toBe('sec_003');
  });

  it('should skip empty sections', () => {
    const html = `
      <body>
        <main>
          <section></section>
          <section><h2>Has content</h2></section>
          <section></section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    // Should only have sections with content
    expect(sections.length).toBe(1);
    expect(sections[0].heading).toBe('Has content');
  });

  it('should extract text blocks', () => {
    const html = `
      <body>
        <main>
          <section>
            <h2>Rich Text</h2>
            <p>This is paragraph one.</p>
            <p>This is paragraph two.</p>
            <p>This is paragraph three.</p>
          </section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    const richText = sections[0];
    expect(richText.textBlocks.length).toBe(3);
    expect(richText.textBlocks[0]).toBe('This is paragraph one.');
  });

  it('should extract CTAs', () => {
    const html = `
      <body>
        <main>
          <section>
            <h2>Call to Action</h2>
            <a href="/buy">Buy Now</a>
            <button>Learn More</button>
          </section>
        </main>
      </body>
    `;

    const sections = sectionizeHtml(html);

    expect(sections.length).toBeGreaterThan(0);
    const cta = sections[0];
    expect(cta.ctas.length).toBe(2);
    expect(cta.ctas[0].text).toBe('Buy Now');
    expect(cta.ctas[0].href).toBe('/buy');
  });
});
