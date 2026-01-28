#!/usr/bin/env node
/**
 * Generate CLI
 *
 * CLI command for generating WordPress themes from PageSpec outputs.
 */

import { Command } from 'commander';
import { resolve } from 'path';
import { Logger, LogLevel } from '../../../crawler/src/lib/logger.js';
import { runGenerator } from '../generator/runner.js';
import type { GeneratorOptions, GeneratorMode } from '../types/generator.js';

const program = new Command();

program
  .name('generate')
  .description('Generate WordPress theme from PageSpec and design tokens')
  .requiredOption('--baseUrl <url>', 'Base URL of the website')
  .option('--inDir <dir>', 'Input directory containing spec output', 'crawler/output')
  .option('--outDir <dir>', 'Output directory for generated theme', 'theme/output')
  .option('--themeName <name>', 'Theme name (slug format)', 'wix2wp')
  .option(
    '--mode <mode>',
    'Generation mode: block, php, or hybrid (default: hybrid)',
    'hybrid',
  )
  .option('--emitPatterns <boolean>', 'Emit WordPress block patterns', (val) =>
    val === 'true' ? true : false,
  )
  .option('--emitThemeJson <boolean>', 'Emit theme.json file', (val) =>
    val === 'true' ? true : false,
  )
  .option('--verbose', 'Enable verbose debug logging', false)
  .parse();

const options = program.opts();

// Validate options
if (!options.baseUrl) {
  console.error('Error: --baseUrl is required');
  process.exit(1);
}

const mode = options.mode as GeneratorMode;
if (!['block', 'php', 'hybrid'].includes(mode)) {
  console.error('Error: --mode must be one of: block, php, hybrid');
  process.exit(1);
}

// Build config
const config: GeneratorOptions = {
  baseUrl: options.baseUrl,
  inDir: resolve(options.inDir),
  outDir: resolve(options.outDir),
  themeName: options.themeName || 'wix2wp',
  mode,
  emitPatterns: options.emitPatterns !== false, // default true
  emitThemeJson: options.emitThemeJson !== false, // default true
};

// Create logger
const logger = new Logger(options.verbose ? LogLevel.DEBUG : LogLevel.INFO);

// Run theme generation
async function main() {
  try {
    logger.info('=== Wix2WordPress Theme Generator ===');
    logger.info(`Base URL: ${config.baseUrl}`);
    logger.info(`Input: ${config.inDir}`);
    logger.info(`Output: ${config.outDir}`);
    logger.info(`Theme Name: ${config.themeName}`);
    logger.info(`Mode: ${config.mode}`);
    logger.info('');

    await runGenerator(config, logger);

    logger.info('');
    logger.info('✅ Theme generation complete!');
    process.exit(0);
  } catch (error) {
    logger.error(`Fatal error: ${(error as Error).message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
