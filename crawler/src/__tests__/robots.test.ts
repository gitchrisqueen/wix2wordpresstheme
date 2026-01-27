/**
 * Tests for robots.txt parser
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RobotsChecker } from '../lib/robots.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('RobotsChecker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow all URLs when robots.txt not found', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const checker = new RobotsChecker('https://example.com');
    await checker.fetch();

    expect(checker.isAllowed('https://example.com/page')).toBe(true);
  });

  it('should respect disallow rules', async () => {
    const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /private/`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => robotsTxt,
    });

    const checker = new RobotsChecker('https://example.com');
    await checker.fetch();

    expect(checker.isAllowed('https://example.com/public')).toBe(true);
    expect(checker.isAllowed('https://example.com/admin/users')).toBe(false);
    expect(checker.isAllowed('https://example.com/private/data')).toBe(false);
  });

  it('should allow all when respectRobots is false', async () => {
    const robotsTxt = `User-agent: *
Disallow: /admin/`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => robotsTxt,
    });

    const checker = new RobotsChecker('https://example.com', { respectRobots: false });
    await checker.fetch();

    expect(checker.isAllowed('https://example.com/admin/users')).toBe(true);
  });

  it('should report when robots.txt was fetched', async () => {
    const robotsTxt = `User-agent: *
Disallow: /admin/`;

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: async () => robotsTxt,
    });

    const checker = new RobotsChecker('https://example.com');
    expect(checker.hasFetched()).toBe(false);

    await checker.fetch();

    expect(checker.hasFetched()).toBe(true);
    expect(checker.getRobotsTxt()).toBeTruthy();
  });

  it('should handle 404 responses gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const checker = new RobotsChecker('https://example.com', { respectRobots: true });
    await checker.fetch();

    // When robots.txt returns 404, all URLs should be allowed
    expect(checker.isAllowed('https://example.com/page')).toBe(true);
    expect(checker.isAllowed('https://example.com/admin')).toBe(true);
  });
});
