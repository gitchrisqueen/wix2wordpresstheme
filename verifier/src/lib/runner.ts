/**
 * Verification Runner
 * 
 * Orchestrates the entire verification process
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type {
  VerifyOptions,
  PageMapping,
  PageVerificationResult,
  VerificationReport,
  Breakpoint,
} from '../types.js';
import { DEFAULT_BREAKPOINTS } from '../types.js';
import { buildPageMappings } from './mapping.js';
import { captureScreenshots } from './screenshots.js';
import { compareScreenshots } from './diff.js';
import { performDOMChecks } from './domChecks.js';
import { performLinkChecks } from './linkChecks.js';
import {
  createEmptyReport,
  updateReportSummary,
  generateJsonReport,
} from './reportJson.js';
import { generateHtmlReport } from './reportHtml.js';

/**
 * Run verification
 */
export async function runVerification(
  options: VerifyOptions,
): Promise<VerificationReport> {
  console.log('=== Wix to WordPress Verification ===');
  console.log(`Wix Site: ${options.baseUrl}`);
  console.log(`WordPress Site: ${options.wpUrl}`);
  console.log(`Theme: ${options.themeName}`);
  console.log('');

  // Create output directory
  if (!existsSync(options.outDir)) {
    mkdirSync(options.outDir, { recursive: true });
  }

  // Initialize report
  const report = createEmptyReport(
    options.baseUrl,
    options.wpUrl,
    options.themeName,
    options.thresholdPixelRatio,
  );

  try {
    // Step 1: Build page mappings
    console.log('📋 Building page mappings...');
    const pageMappings = buildPageMappings(
      options.manifest,
      options.themeName,
      join(process.cwd(), 'theme', 'output'),
      options.wpUrl,
    );
    console.log(`   Found ${pageMappings.length} pages to verify`);

    // Step 2: Verify each page
    const breakpoints = parseBreakpoints(options.breakpoints);
    console.log(
      `📸 Verifying pages (breakpoints: ${breakpoints.map((b) => b.name).join(', ')})...`,
    );

    for (let i = 0; i < pageMappings.length; i++) {
      const mapping = pageMappings[i];
      console.log(
        `   [${i + 1}/${pageMappings.length}] Verifying ${mapping.slug}...`,
      );

      const pageResult = await verifyPage(
        mapping,
        options.outDir,
        breakpoints,
        options.thresholdPixelRatio,
        options.wpUrl,
        options.verbose,
      );

      report.pages.push(pageResult);

      if (!pageResult.passed) {
        console.log(`      ⚠️  Failed (${pageResult.errors.length} errors)`);
      } else {
        console.log(`      ✓ Passed`);
      }
    }

    // Step 3: Update summary
    updateReportSummary(report);

    // Step 4: Generate reports
    console.log('');
    console.log('📊 Generating reports...');

    const jsonPath = generateJsonReport(report, options.outDir);
    console.log(`   JSON: ${jsonPath}`);

    const htmlPath = generateHtmlReport(report, options.outDir);
    console.log(`   HTML: ${htmlPath}`);

    // Step 5: Print summary
    console.log('');
    console.log('=== Verification Summary ===');
    console.log(
      `Pages: ${report.summary.passedPages}/${report.summary.totalPages} passed`,
    );
    console.log(
      `Visual Matches: ${report.summary.passedDiffs}/${report.summary.totalDiffs} passed`,
    );

    const passRate =
      report.summary.totalPages > 0
        ? (report.summary.passedPages / report.summary.totalPages) * 100
        : 0;
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`);

    if (report.errors.length > 0) {
      console.log('');
      console.log('⚠️  Errors:');
      for (const error of report.errors) {
        console.log(`   - ${error}`);
      }
    }

    console.log('');
    console.log(`View full report: ${htmlPath}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    report.errors.push(`Fatal error: ${errorMessage}`);
    console.error(`❌ Fatal error: ${errorMessage}`);

    if (options.verbose && error instanceof Error && error.stack) {
      console.error(error.stack);
    }
  }

  // Determine exit code
  const shouldFail =
    !options.allowPartial && report.summary.failedPages > 0;

  if (shouldFail) {
    console.log('');
    console.log(
      '❌ Verification failed (allowPartial=false and some pages failed)',
    );
    process.exitCode = 1;
  }

  return report;
}

/**
 * Verify a single page
 */
async function verifyPage(
  mapping: PageMapping,
  outputDir: string,
  breakpoints: Breakpoint[],
  thresholdPixelRatio: number,
  wpBaseUrl: string,
  verbose: boolean,
): Promise<PageVerificationResult> {
  const result: PageVerificationResult = {
    slug: mapping.slug,
    wixUrl: mapping.wixUrl,
    wpUrl: mapping.wpUrl,
    passed: true,
    screenshots: {
      wix: [],
      wp: [],
    },
    diffs: [],
    domChecks: [],
    linkChecks: [],
    errors: [],
    warnings: [],
  };

  try {
    // Capture Wix screenshots
    if (verbose) console.log(`      Capturing Wix screenshots...`);
    result.screenshots.wix = await captureScreenshots(
      mapping.wixUrl,
      outputDir,
      mapping.slug,
      breakpoints,
      'wix',
    );

    // Capture WP screenshots
    if (verbose) console.log(`      Capturing WP screenshots...`);
    result.screenshots.wp = await captureScreenshots(
      mapping.wpUrl,
      outputDir,
      mapping.slug,
      breakpoints,
      'wp',
    );

    // Compare screenshots
    if (verbose) console.log(`      Comparing screenshots...`);
    for (let i = 0; i < breakpoints.length; i++) {
      const wixScreenshot = result.screenshots.wix[i];
      const wpScreenshot = result.screenshots.wp[i];

      if (wixScreenshot.error || wpScreenshot.error) {
        result.errors.push(
          `Screenshot capture failed for ${breakpoints[i].name}`,
        );
        result.passed = false;
        continue;
      }

      const diffPath = join(
        outputDir,
        mapping.slug,
        'screenshots',
        `diff-${breakpoints[i].name}.png`,
      );

      const diffResult = compareScreenshots(
        wixScreenshot.path,
        wpScreenshot.path,
        diffPath,
        thresholdPixelRatio,
      );

      result.diffs.push(diffResult);

      if (!diffResult.passed) {
        result.passed = false;
        result.warnings.push(
          `Visual difference of ${diffResult.percentDifference.toFixed(2)}% on ${breakpoints[i].name} exceeds threshold`,
        );
      }
    }

    // Perform DOM checks
    if (verbose) console.log(`      Checking DOM...`);
    result.domChecks = await performDOMChecks(mapping.wpUrl, mapping.title);

    for (const check of result.domChecks) {
      if (!check.passed) {
        result.warnings.push(`DOM check failed: ${check.check}`);
      }
    }

    // Perform link checks
    if (verbose) console.log(`      Checking links...`);
    result.linkChecks = await performLinkChecks(mapping.wpUrl, wpBaseUrl);

    for (const linkCheck of result.linkChecks) {
      if (!linkCheck.passed) {
        result.warnings.push(`Link check failed: ${linkCheck.url}`);
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    result.errors.push(`Verification error: ${errorMessage}`);
    result.passed = false;
  }

  return result;
}

/**
 * Parse breakpoints from string array
 */
function parseBreakpoints(breakpointNames: string[]): Breakpoint[] {
  const breakpoints: Breakpoint[] = [];

  for (const name of breakpointNames) {
    const breakpoint = DEFAULT_BREAKPOINTS[name];
    if (breakpoint) {
      breakpoints.push(breakpoint);
    } else {
      console.warn(`   ⚠️  Unknown breakpoint: ${name}, skipping`);
    }
  }

  return breakpoints;
}
