#!/usr/bin/env node
/**
 * Spec CLI
 *
 * CLI command for generating PageSpec, design tokens, and layout patterns.
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { Logger, LogLevel } from '../lib/logger.js';
import { runSpec, type SpecConfig } from '../spec/runner.js';

const program = new Command();

program
  .name('spec')
  .description('Generate PageSpec, design tokens, and layout patterns from crawl output')
  .requiredOption('--baseUrl <url>', 'Base URL of the website')
  .option('--inDir <dir>', 'Input directory containing crawl output', 'crawler/output')
  .option('--outDir <dir>', 'Output directory for spec files', 'crawler/output')
  .option('--strategy <strategy>', 'Inference strategy (heuristic)', 'heuristic')
  .option('--maxPages <number>', 'Maximum number of pages to process', (val) => parseInt(val, 10))
  .option('--verbose', 'Enable verbose debug logging', false)
  .parse();

const options = program.opts();

// Validate options
if (!options.baseUrl) {
  console.error('Error: --baseUrl is required');
  process.exit(1);
}

if (options.strategy !== 'heuristic') {
  console.error('Error: Only "heuristic" strategy is currently supported');
  process.exit(1);
}

// Build config
const config: SpecConfig = {
  baseUrl: options.baseUrl,
  inDir: resolve(options.inDir),
  outDir: resolve(options.outDir),
  maxPages: options.maxPages || null,
  strategy: 'heuristic',
};

// Create logger
const logger = new Logger(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);

// Run spec generation
async function main() {
  try {
    await runSpec(config, logger);
    process.exit(0);
  } catch (error) {
    logger.error(`Fatal error: ${(error as Error).message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
