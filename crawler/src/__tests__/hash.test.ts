/**
 * Hash Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { sha256, hashObject, shortHash } from '../lib/hash.js';

describe('hash utilities', () => {
  describe('sha256', () => {
    it('should generate consistent hash for same input', () => {
      const content = 'test content';
      const hash1 = sha256(content);
      const hash2 = sha256(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 is 64 hex chars
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = sha256('content1');
      const hash2 = sha256('content2');

      expect(hash1).not.toBe(hash2);
    });

    it('should work with Buffer input', () => {
      const buffer = Buffer.from('test');
      const hash = sha256(buffer);

      expect(hash).toHaveLength(64);
    });
  });

  describe('hashObject', () => {
    it('should generate consistent hash for same object', () => {
      const obj = { name: 'test', value: 123 };
      const hash1 = hashObject(obj);
      const hash2 = hashObject(obj);

      expect(hash1).toBe(hash2);
    });

    it('should generate same hash for objects with same properties in different order', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };

      const hash1 = hashObject(obj1);
      const hash2 = hashObject(obj2);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different objects', () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 2 };

      const hash1 = hashObject(obj1);
      const hash2 = hashObject(obj2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('shortHash', () => {
    it('should generate 12 character hash', () => {
      const hash = shortHash('test content');

      expect(hash).toHaveLength(12);
    });

    it('should be prefix of full hash', () => {
      const content = 'test content';
      const full = sha256(content);
      const short = shortHash(content);

      expect(full.startsWith(short)).toBe(true);
    });
  });
});
