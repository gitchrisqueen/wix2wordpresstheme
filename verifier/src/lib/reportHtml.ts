/**
 * HTML Report
 * 
 * Generate designer-friendly HTML verification report
 */

import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import type { VerificationReport, PageVerificationResult } from '../types.js';

/**
 * Generate and save HTML report
 */
export function generateHtmlReport(
  report: VerificationReport,
  outputDir: string,
): string {
  const timestamp = report.timestamp.replace(/[:.]/g, '-').split('T')[0];
  const reportDir = join(outputDir, '..', '..', 'docs', 'REPORTS', timestamp);

  // Ensure directory exists
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = join(reportDir, 'index.html');

  // Generate HTML
  const html = generateHtml(report, outputDir, reportDir);

  // Write report
  writeFileSync(reportPath, html, 'utf-8');

  return reportPath;
}

/**
 * Generate HTML content
 */
function generateHtml(
  report: VerificationReport,
  outputDir: string,
  reportDir: string,
): string {
  const passRate =
    report.summary.totalPages > 0
      ? (report.summary.passedPages / report.summary.totalPages) * 100
      : 0;

  const diffPassRate =
    report.summary.totalDiffs > 0
      ? (report.summary.passedDiffs / report.summary.totalDiffs) * 100
      : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wix vs WordPress Verification Report</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 Wix vs WordPress Verification</h1>
      <p class="subtitle">Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    </header>

    <section class="summary">
      <h2>Summary</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value ${passRate >= 80 ? 'success' : passRate >= 50 ? 'warning' : 'error'}">${report.summary.passedPages}/${report.summary.totalPages}</div>
          <div class="stat-label">Pages Passed</div>
          <div class="stat-percent">${passRate.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-value ${diffPassRate >= 90 ? 'success' : diffPassRate >= 70 ? 'warning' : 'error'}">${report.summary.passedDiffs}/${report.summary.totalDiffs}</div>
          <div class="stat-label">Visual Matches</div>
          <div class="stat-percent">${diffPassRate.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${report.themeName}</div>
          <div class="stat-label">Theme</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(report.thresholdPixelRatio * 100).toFixed(1)}%</div>
          <div class="stat-label">Diff Threshold</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <strong>Wix Site:</strong> <a href="${report.baseUrl}" target="_blank">${report.baseUrl}</a>
        </div>
        <div class="info-item">
          <strong>WordPress Site:</strong> <a href="${report.wpUrl}" target="_blank">${report.wpUrl}</a>
        </div>
      </div>
    </section>

    ${report.errors.length > 0 ? generateErrorsSection(report.errors) : ''}
    ${report.warnings.length > 0 ? generateWarningsSection(report.warnings) : ''}

    <section class="pages">
      <h2>Page Results</h2>
      ${report.pages.map((page) => generatePageSection(page, outputDir, reportDir)).join('\n')}
    </section>

    <footer>
      <p>Wix to WordPress Theme Converter - Phase 5 Verification</p>
      <p>Report generated at ${new Date(report.timestamp).toLocaleString()}</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Generate errors section
 */
function generateErrorsSection(errors: string[]): string {
  return `
    <section class="errors">
      <h2>⚠️ Errors</h2>
      <ul class="error-list">
        ${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('\n')}
      </ul>
    </section>
  `;
}

/**
 * Generate warnings section
 */
function generateWarningsSection(warnings: string[]): string {
  return `
    <section class="warnings">
      <h2>⚡ Warnings</h2>
      <ul class="warning-list">
        ${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('\n')}
      </ul>
    </section>
  `;
}

/**
 * Generate page section
 */
function generatePageSection(
  page: PageVerificationResult,
  outputDir: string,
  reportDir: string,
): string {
  const badge = page.passed
    ? '<span class="badge success">✓ PASSED</span>'
    : '<span class="badge error">✗ FAILED</span>';

  return `
    <div class="page-card ${page.passed ? 'passed' : 'failed'}">
      <div class="page-header">
        <h3>${escapeHtml(page.slug)}</h3>
        ${badge}
      </div>

      <div class="page-urls">
        <div><strong>Wix:</strong> <a href="${page.wixUrl}" target="_blank">${page.wixUrl}</a></div>
        <div><strong>WordPress:</strong> <a href="${page.wpUrl}" target="_blank">${page.wpUrl}</a></div>
      </div>

      ${page.diffs.length > 0 ? generateDiffsSection(page.diffs, page.slug, outputDir, reportDir) : ''}
      ${page.domChecks.length > 0 ? generateDomChecksSection(page.domChecks) : ''}
      ${page.errors.length > 0 ? generatePageErrorsSection(page.errors) : ''}
      ${page.warnings.length > 0 ? generatePageWarningsSection(page.warnings) : ''}
    </div>
  `;
}

/**
 * Generate diffs section
 */
function generateDiffsSection(
  diffs: any[],
  slug: string,
  outputDir: string,
  reportDir: string,
): string {
  return `
    <div class="diffs-section">
      <h4>Visual Comparison</h4>
      <div class="diff-grid">
        ${diffs
          .map((diff) => {
            const wixPath = getRelativePath(diff.wixScreenshot, reportDir);
            const wpPath = getRelativePath(diff.wpScreenshot, reportDir);
            const diffPath = getRelativePath(diff.diffScreenshot, reportDir);

            const diffBadge = diff.passed
              ? '<span class="badge-sm success">✓ Match</span>'
              : '<span class="badge-sm error">✗ Diff</span>';

            return `
              <div class="diff-card">
                <div class="diff-header">
                  <h5>${diff.breakpoint}</h5>
                  ${diffBadge}
                  <span class="diff-percent">${diff.percentDifference.toFixed(2)}%</span>
                </div>
                <div class="screenshot-row">
                  <div class="screenshot">
                    <label>Wix</label>
                    <a href="${wixPath}" target="_blank">
                      <img src="${wixPath}" alt="Wix ${diff.breakpoint}" loading="lazy">
                    </a>
                  </div>
                  <div class="screenshot">
                    <label>WordPress</label>
                    <a href="${wpPath}" target="_blank">
                      <img src="${wpPath}" alt="WP ${diff.breakpoint}" loading="lazy">
                    </a>
                  </div>
                  <div class="screenshot">
                    <label>Difference</label>
                    <a href="${diffPath}" target="_blank">
                      <img src="${diffPath}" alt="Diff ${diff.breakpoint}" loading="lazy">
                    </a>
                  </div>
                </div>
              </div>
            `;
          })
          .join('\n')}
      </div>
    </div>
  `;
}

/**
 * Generate DOM checks section
 */
function generateDomChecksSection(checks: any[]): string {
  return `
    <div class="checks-section">
      <h4>DOM & Metadata Checks</h4>
      <table class="checks-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${checks
            .map((check) => {
              const badge = check.passed
                ? '<span class="badge-sm success">✓</span>'
                : '<span class="badge-sm error">✗</span>';

              let details = check.message || '';
              if (check.expected && check.actual) {
                details = `Expected: ${escapeHtml(String(check.expected))}<br>Actual: ${escapeHtml(String(check.actual))}`;
              }

              return `
                <tr>
                  <td><code>${check.check}</code></td>
                  <td>${badge}</td>
                  <td>${details}</td>
                </tr>
              `;
            })
            .join('\n')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Generate page errors section
 */
function generatePageErrorsSection(errors: string[]): string {
  return `
    <div class="page-errors">
      <h4>Errors</h4>
      <ul>
        ${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('\n')}
      </ul>
    </div>
  `;
}

/**
 * Generate page warnings section
 */
function generatePageWarningsSection(warnings: string[]): string {
  return `
    <div class="page-warnings">
      <h4>Warnings</h4>
      <ul>
        ${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('\n')}
      </ul>
    </div>
  `;
}

/**
 * Get relative path from report directory
 */
function getRelativePath(absolutePath: string, reportDir: string): string {
  try {
    return '../../../' + relative(dirname(dirname(dirname(reportDir))), absolutePath);
  } catch {
    return absolutePath;
  }
}

/**
 * Escape HTML
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get CSS styles
 */
function getStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    h1 {
      color: #2563eb;
      margin-bottom: 10px;
    }

    .subtitle {
      color: #666;
      font-size: 0.9em;
    }

    .summary {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }

    .stat-card {
      background: #f8fafc;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }

    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-value.success {
      color: #10b981;
    }

    .stat-value.warning {
      color: #f59e0b;
    }

    .stat-value.error {
      color: #ef4444;
    }

    .stat-label {
      color: #666;
      font-size: 0.9em;
    }

    .stat-percent {
      color: #888;
      font-size: 0.85em;
      margin-top: 5px;
    }

    .info-grid {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .info-item {
      margin: 10px 0;
    }

    .badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.85em;
    }

    .badge-sm {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: bold;
      font-size: 0.75em;
    }

    .badge.success,
    .badge-sm.success {
      background: #dcfce7;
      color: #166534;
    }

    .badge.error,
    .badge-sm.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .pages {
      margin-top: 30px;
    }

    .page-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      border-left: 4px solid #10b981;
    }

    .page-card.failed {
      border-left-color: #ef4444;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .page-urls {
      margin: 15px 0;
      padding: 15px;
      background: #f8fafc;
      border-radius: 4px;
      font-size: 0.9em;
    }

    .page-urls div {
      margin: 5px 0;
    }

    .diff-grid {
      margin-top: 15px;
    }

    .diff-card {
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 4px;
    }

    .diff-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
    }

    .diff-percent {
      margin-left: auto;
      font-weight: bold;
      color: #666;
    }

    .screenshot-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
    }

    .screenshot {
      text-align: center;
    }

    .screenshot label {
      display: block;
      font-weight: bold;
      margin-bottom: 8px;
      color: #666;
    }

    .screenshot img {
      width: 100%;
      max-width: 400px;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }

    .checks-section,
    .diffs-section {
      margin: 20px 0;
    }

    .checks-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    .checks-table th {
      background: #f8fafc;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #e5e7eb;
    }

    .checks-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }

    .checks-table code {
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    .page-errors,
    .page-warnings {
      margin: 15px 0;
      padding: 15px;
      border-radius: 4px;
    }

    .page-errors {
      background: #fee2e2;
      border-left: 3px solid #ef4444;
    }

    .page-warnings {
      background: #fef3c7;
      border-left: 3px solid #f59e0b;
    }

    .page-errors ul,
    .page-warnings ul {
      margin-left: 20px;
    }

    .errors,
    .warnings {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .errors {
      border-left: 4px solid #ef4444;
    }

    .warnings {
      border-left: 4px solid #f59e0b;
    }

    .error-list,
    .warning-list {
      margin-left: 20px;
      margin-top: 10px;
    }

    footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 0.9em;
    }

    a {
      color: #2563eb;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }
  `;
}
