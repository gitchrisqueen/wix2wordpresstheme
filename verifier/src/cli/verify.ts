#!/usr/bin/env node
/**
 * Verify CLI
 * 
 * Command-line interface for verification
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { existsSync } from 'fs';
import type { VerifyOptions } from '../types.js';
import { runVerification } from '../lib/runner.js';

const program = new Command();

program
  .name('verify')
  .description('Verify Wix to WordPress conversion')
  .version('1.0.0');

program
  .requiredOption('--baseUrl <url>', 'Base URL of Wix site')
  .requiredOption('--wpUrl <url>', 'Base URL of WordPress site')
  .option(
    '--manifest <path>',
    'Path to manifest.json',
    'crawler/output/manifest.json',
  )
  .option('--themeName <name>', 'Theme name to verify', 'wix2wp')
  .option('--outDir <path>', 'Output directory for reports', 'verifier/output')
  .option(
    '--breakpoints <names>',
    'Comma-separated breakpoint names',
    'desktop,mobile',
  )
  .option(
    '--thresholdPixelRatio <number>',
    'Pixel difference threshold (0-1)',
    '0.01',
  )
  .option(
    '--allowPartial',
    'Allow partial success (exit 0 even if some pages fail)',
    false,
  )
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (cmdOptions) => {
    try {
      // Parse options
      const options: VerifyOptions = {
        baseUrl: cmdOptions.baseUrl,
        wpUrl: cmdOptions.wpUrl,
        manifest: resolve(cmdOptions.manifest),
        themeName: cmdOptions.themeName,
        outDir: resolve(cmdOptions.outDir),
        breakpoints: cmdOptions.breakpoints.split(',').map((s: string) => s.trim()),
        thresholdPixelRatio: parseFloat(cmdOptions.thresholdPixelRatio),
        allowPartial: cmdOptions.allowPartial,
        verbose: cmdOptions.verbose,
      };

      // Validate options
      if (!options.baseUrl.startsWith('http://') && !options.baseUrl.startsWith('https://')) {
        console.error('Error: baseUrl must start with http:// or https://');
        process.exit(1);
      }

      if (!options.wpUrl.startsWith('http://') && !options.wpUrl.startsWith('https://')) {
        console.error('Error: wpUrl must start with http:// or https://');
        process.exit(1);
      }

      if (!existsSync(options.manifest)) {
        console.error(`Error: Manifest not found: ${options.manifest}`);
        console.error('');
        console.error('Please run discovery and crawl first:');
        console.error(`  npm run discover -- --baseUrl ${options.baseUrl}`);
        console.error(`  npm run crawl -- --baseUrl ${options.baseUrl} --manifest ${options.manifest}`);
        process.exit(1);
      }

      if (options.thresholdPixelRatio < 0 || options.thresholdPixelRatio > 1) {
        console.error('Error: thresholdPixelRatio must be between 0 and 1');
        process.exit(1);
      }

      // Run verification
      await runVerification(options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Fatal error: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program.parse();
