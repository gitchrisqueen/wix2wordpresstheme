/**
 * Text Normalization Utilities
 *
 * Provides functions for normalizing and cleaning text content.
 */

/**
 * Normalize whitespace in text
 * - Trim leading/trailing whitespace
 * - Replace multiple spaces with single space
 * - Remove zero-width characters
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Extract plain text from HTML
 */
export function extractText(html: string): string {
  return normalizeWhitespace(stripHtml(html));
}

/**
 * Truncate text to maximum length
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Check if text is empty or only whitespace
 */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || normalizeWhitespace(text).length === 0;
}

/**
 * Split text into sentences (simple heuristic)
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => normalizeWhitespace(s))
    .filter((s) => s.length > 0);
}

/**
 * Split text into words
 */
export function splitWords(text: string): string[] {
  return normalizeWhitespace(text)
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Count words in text
 */
export function wordCount(text: string): number {
  return splitWords(text).length;
}

/**
 * Normalize CSS selector by removing volatile Wix classes
 */
export function normalizeSelector(selector: string): string {
  // Remove Wix-generated volatile classes like comp-xxx, wixui-xxx
  return selector
    .split(' ')
    .map((part) => {
      // Remove classes that look like comp-xxxx or wixui-xxxx
      const classes = part.split('.').filter((cls) => {
        if (!cls) return false;
        // Keep semantic classes, remove generated ones
        if (cls.match(/^(comp|wixui|style__)[a-zA-Z0-9_-]+/)) {
          return false;
        }
        return true;
      });
      return classes.join('.');
    })
    .filter((part) => part.length > 0)
    .join(' ');
}
