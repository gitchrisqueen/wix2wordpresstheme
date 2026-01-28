/**
 * JSON Report
 * 
 * Generate machine-readable verification report
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { VerificationReport } from '../types.js';

/**
 * Generate and save JSON report
 */
export function generateJsonReport(
  report: VerificationReport,
  outputDir: string,
): string {
  const reportPath = join(outputDir, 'verify-summary.json');

  // Ensure directory exists
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  return reportPath;
}

/**
 * Create empty verification report
 */
export function createEmptyReport(
  baseUrl: string,
  wpUrl: string,
  themeName: string,
  thresholdPixelRatio: number,
): VerificationReport {
  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    baseUrl,
    wpUrl,
    themeName,
    thresholdPixelRatio,
    summary: {
      totalPages: 0,
      passedPages: 0,
      failedPages: 0,
      totalDiffs: 0,
      passedDiffs: 0,
      failedDiffs: 0,
    },
    pages: [],
    errors: [],
    warnings: [],
  };
}

/**
 * Update report summary based on page results
 */
export function updateReportSummary(
  report: VerificationReport,
): VerificationReport {
  const summary = {
    totalPages: report.pages.length,
    passedPages: 0,
    failedPages: 0,
    totalDiffs: 0,
    passedDiffs: 0,
    failedDiffs: 0,
  };

  for (const page of report.pages) {
    if (page.passed) {
      summary.passedPages++;
    } else {
      summary.failedPages++;
    }

    for (const diff of page.diffs) {
      summary.totalDiffs++;
      if (diff.passed) {
        summary.passedDiffs++;
      } else {
        summary.failedDiffs++;
      }
    }
  }

  report.summary = summary;
  return report;
}
