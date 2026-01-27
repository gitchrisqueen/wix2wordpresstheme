/**
 * Robots.txt Parser
 *
 * Minimal robots.txt compliance to respect disallow rules.
 */

import robotsParser from 'robots-parser';

export interface RobotsOptions {
  respectRobots: boolean;
}

export class RobotsChecker {
  private robotsTxt: string | null = null;
  private parser: ReturnType<typeof robotsParser> | null = null;
  private baseUrl: string;
  private respectRobots: boolean;

  constructor(baseUrl: string, options: RobotsOptions = { respectRobots: true }) {
    this.baseUrl = baseUrl;
    this.respectRobots = options.respectRobots;
  }

  /**
   * Fetch and parse robots.txt
   */
  async fetch(): Promise<void> {
    if (!this.respectRobots) {
      return;
    }

    try {
      const robotsUrl = new URL('/robots.txt', this.baseUrl).toString();
      const response = await fetch(robotsUrl);

      if (response.ok) {
        this.robotsTxt = await response.text();
        this.parser = robotsParser(robotsUrl, this.robotsTxt);
      }
    } catch (error) {
      // Robots.txt not found or error fetching - allow all
      this.robotsTxt = null;
      this.parser = null;
    }
  }

  /**
   * Check if a URL is allowed by robots.txt
   */
  isAllowed(url: string, userAgent = '*'): boolean {
    if (!this.respectRobots) {
      return true;
    }

    if (!this.parser) {
      // No robots.txt found - allow all
      return true;
    }

    return this.parser.isAllowed(url, userAgent) ?? true;
  }

  /**
   * Get the robots.txt content
   */
  getRobotsTxt(): string | null {
    return this.robotsTxt;
  }

  /**
   * Check if robots.txt was successfully fetched
   */
  hasFetched(): boolean {
    return this.robotsTxt !== null;
  }
}
