/**
 * Verifier Types
 * 
 * Type definitions for the verification system
 */

export interface VerifyOptions {
  baseUrl: string;
  wpUrl: string;
  manifest: string;
  themeName: string;
  outDir: string;
  breakpoints: string[];
  thresholdPixelRatio: number;
  allowPartial: boolean;
  verbose: boolean;
}

export interface PageMapping {
  wixUrl: string;
  wpUrl: string;
  slug: string;
  title: string;
  templateHint?: string;
}

export interface ScreenshotResult {
  url: string;
  breakpoint: string;
  path: string;
  timestamp: string;
  width: number;
  height: number;
  error?: string;
}

export interface DiffResult {
  wixScreenshot: string;
  wpScreenshot: string;
  diffScreenshot: string;
  pixelDifference: number;
  percentDifference: number;
  passed: boolean;
  breakpoint: string;
}

export interface DOMCheckResult {
  check: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  message?: string;
}

export interface LinkCheckResult {
  url: string;
  status: number;
  passed: boolean;
  type: 'internal' | 'external' | 'asset';
  message?: string;
}

export interface PageVerificationResult {
  slug: string;
  wixUrl: string;
  wpUrl: string;
  passed: boolean;
  screenshots: {
    wix: ScreenshotResult[];
    wp: ScreenshotResult[];
  };
  diffs: DiffResult[];
  domChecks: DOMCheckResult[];
  linkChecks: LinkCheckResult[];
  errors: string[];
  warnings: string[];
}

export interface VerificationReport {
  version: string;
  timestamp: string;
  baseUrl: string;
  wpUrl: string;
  themeName: string;
  thresholdPixelRatio: number;
  summary: {
    totalPages: number;
    passedPages: number;
    failedPages: number;
    totalDiffs: number;
    passedDiffs: number;
    failedDiffs: number;
  };
  pages: PageVerificationResult[];
  errors: string[];
  warnings: string[];
}

export interface Breakpoint {
  name: string;
  width: number;
  height: number;
}

export const DEFAULT_BREAKPOINTS: Record<string, Breakpoint> = {
  desktop: { name: 'desktop', width: 1920, height: 1080 },
  mobile: { name: 'mobile', width: 375, height: 667 },
  tablet: { name: 'tablet', width: 768, height: 1024 },
};
