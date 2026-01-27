/**
 * Hash Utilities
 *
 * Provides functions for hashing content for deterministic file naming and content verification.
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 hash of a string or buffer
 */
export function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generate stable hash of an object by stringifying it
 */
export function hashObject(obj: unknown): string {
  const str = JSON.stringify(obj, Object.keys(obj as object).sort());
  return sha256(str);
}

/**
 * Generate short hash (first 12 characters) for file naming
 */
export function shortHash(content: string | Buffer): string {
  return sha256(content).substring(0, 12);
}
