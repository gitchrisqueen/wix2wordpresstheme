/**
 * PageSpec Inference
 *
 * Generate PageSpec from crawl outputs (DOM, meta, HTML, assets).
 */

import type { PageSpec, TemplateHint, Form, FormField, Links } from '../types/spec.js';
import { sectionizeHtml } from './sectionizer.js';
import * as cheerio from 'cheerio';
import { normalizeWhitespace } from '../lib/textNormalize.js';
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
}

/**
 * Infer template hint from page characteristics
 */
function inferTemplateHint(url: string, slug: string, html: string): TemplateHint {
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
  const ctaCount = $('button, a[href]').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return text.match(/sign|buy|get|start|join|subscribe/);
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
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
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
      const label = $input.attr('placeholder') || $input.attr('aria-label') || null;
      const required = $input.attr('required') !== undefined;
      
      fields.push({ label, type, required });
    });
    
    forms.push({ name, fields });
  });
  
  return forms;
}

/**
 * Generate PageSpec from inputs
 */
export function inferPageSpec(inputs: PageInputs): PageSpec {
  const { url, slug, baseUrl, html, meta } = inputs;
  
  const notes: string[] = [];
  
  // Infer template hint
  const templateHint = inferTemplateHint(url, slug, html);
  
  // Sectionize HTML
  const sections = sectionizeHtml(html);
  
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
  
  return {
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
}
