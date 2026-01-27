/**
 * Slug Generation
 *
 * Provides stable slug generation from URLs for consistent file naming.
 */

/**
 * Generate a stable slug from a URL path
 * Strips protocol, domain, query, and hash
 * Converts to lowercase and replaces non-alphanumeric with hyphens
 */
export function generateSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;

    // Remove leading and trailing slashes
    path = path.replace(/^\/+|\/+$/g, '');

    // Handle homepage
    if (path === '') {
      return 'home';
    }

    // Convert to slug format
    let slug = path
      .toLowerCase()
      .replace(/\/+/g, '/') // Normalize multiple slashes first
      .replace(/[^a-z0-9\/]+/g, '-') // Replace non-alphanumeric (except /) with hyphens
      .replace(/\//g, '--') // Replace slashes with double hyphens
      .replace(/-{3,}/g, '--') // Collapse 3+ hyphens to 2 (preserve our double-hyphen separators)
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // Limit length
    if (slug.length > 200) {
      slug = slug.substring(0, 200).replace(/-[^-]*$/, ''); // Cut at word boundary
    }

    return slug || 'page';
  } catch (error) {
    // Fallback for invalid URLs
    return 'invalid-url';
  }
}

/**
 * Generate unique slug by appending hash if needed
 */
export function uniqueSlug(url: string, existingSlugs: Set<string>): string {
  const baseSlug = generateSlug(url);

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  // Append short hash from URL to make it unique
  const urlHash = require('crypto')
    .createHash('sha256')
    .update(url)
    .digest('hex')
    .substring(0, 8);

  return `${baseSlug}-${urlHash}`;
}
