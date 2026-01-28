/**
 * PageSpec Inference
 *
 * Generate PageSpec from crawl outputs (DOM, meta, HTML, assets).
 */

import type { PageSpec, TemplateHint, Form, FormField, Links } from '../types/spec.js';
import { sectionizeHtml, sectionizeHtmlWithDebug, type SectionizeDebugData } from './sectionizer.js';
import * as cheerio from 'cheerio';
import { isInternalUrl } from '../lib/url.js';

interface PageInputs {
  url: string;
  slug: string;
  baseUrl: string;
  html: string;
  meta: {
    title: string;
    metaDescription: string | null;
    canonical: string | null;
    og?: {
      title?: string | null;
      description?: string | null;
      image?: string | null;
      url?: string | null;
      type?: string | null;
    };
  };
  debug?: boolean;
}

/**
 * Infer template hint from page characteristics
 */
function inferTemplateHint(slug: string, html: string): TemplateHint {
  const $ = cheerio.load(html);

  // Home page
  if (slug === '' || slug === 'index' || slug === 'home') {
    return 'home';
  }

  // Contact page
  if (slug.match(/contact|reach|touch/i)) {
    return 'contact';
  }

  // Blog index
  if (slug.match(/blog|news|articles/i) && $('article').length >= 3) {
    return 'blogIndex';
  }

  // Landing page (single h1, single CTA, minimal navigation)
  const h1Count = $('h1').length;
  const ctaCount = $('button, a[href]')
    .toArray()
    .filter((el) => {
      const text = $(el).text().toLowerCase();
      return Boolean(text.match(/sign|buy|get|start|join|subscribe/));
    }).length;

  if (h1Count === 1 && ctaCount >= 1 && ctaCount <= 3) {
    return 'landing';
  }

  // Content page (lots of paragraphs)
  const pCount = $('p').length;
  if (pCount >= 5) {
    return 'content';
  }

  return 'generic';
}

/**
 * Extract links from HTML
 */
function extractLinks(html: string, baseUrl: string): Links {
  const $ = cheerio.load(html);
  const internal: string[] = [];
  const external: string[] = [];
  const seen = new Set<string>();

  $('a[href]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (
      !href ||
      href.startsWith('#') ||
      href.startsWith('javascript:') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    ) {
      return;
    }

    try {
      const fullUrl = new URL(href, baseUrl).toString();

      if (seen.has(fullUrl)) {
        return;
      }
      seen.add(fullUrl);

      if (isInternalUrl(fullUrl, baseUrl)) {
        internal.push(fullUrl);
      } else {
        external.push(fullUrl);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  return { internal, external };
}

/**
 * Extract forms from HTML
 */
function extractForms(html: string): Form[] {
  const $ = cheerio.load(html);
  const forms: Form[] = [];

  $('form').each((_, formElem) => {
    const $form = $(formElem);
    const name = $form.attr('name') || $form.attr('id') || null;
    const fields: FormField[] = [];

    $form.find('input, textarea, select').each((_, inputElem) => {
      const $input = $(inputElem);
      const type = $input.attr('type') || $input.prop('tagName')?.toLowerCase() || 'text';
      
      // Skip submit and button types
      if (type === 'submit' || type === 'button') {
        return;
      }
      
      const label = $input.attr('placeholder') || $input.attr('aria-label') || null;
      const required = $input.attr('required') !== undefined;

      fields.push({ label, type, required });
    });

    // Extract submit button text
    let submitText: string | null = null;
    const $submit = $form.find('button[type="submit"], input[type="submit"]').first();
    if ($submit.length > 0) {
      submitText = $submit.text() || $submit.attr('value') || null;
    }

    forms.push({ name, fields, submitText });
  });

  return forms;
}

/**
 * Generate PageSpec from inputs
 */
export function inferPageSpec(
  inputs: PageInputs
): { pageSpec: PageSpec; debugData?: SectionizeDebugData } {
  const { url, slug, baseUrl, html, meta, debug } = inputs;

  const notes: string[] = [];

  // Infer template hint
  const templateHint = inferTemplateHint(slug, html);

  // Sectionize HTML
  let sections;
  let debugData: SectionizeDebugData | undefined;

  if (debug) {
    const result = sectionizeHtmlWithDebug(html, baseUrl);
    sections = result.sections;
    debugData = result.debug;
  } else {
    sections = sectionizeHtml(html, baseUrl);
  }

  if (sections.length === 0) {
    notes.push('Warning: No sections could be extracted from the page');
  }

  // Extract links
  const links = extractLinks(html, baseUrl);

  // Extract forms
  const forms = extractForms(html);

  // Build meta object
  const pageMeta = {
    title: meta.title,
    description: meta.metaDescription,
    canonical: meta.canonical,
    og: meta.og,
  };

  const pageSpec: PageSpec = {
    version: '1.0.0',
    baseUrl,
    url,
    slug,
    templateHint,
    meta: pageMeta,
    sections,
    links,
    forms,
    notes,
  };

  return { pageSpec, debugData };
}
