/**
 * Report Generator
 *
 * Creates structured reports for discovery runs.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { Logger } from './logger.js';

export interface RunReport {
  startTime: string;
  endTime: string;
  duration: number;
  command: string;
  config: Record<string, unknown>;
  stats: {
    pagesFound: number;
    pagesIncluded: number;
    excludedExternal: number;
    excludedDuplicates: number;
    excludedByRules: number;
  };
  warnings: string[];
  errors: string[];
  outputs: {
    manifest?: string;
    report?: string;
  };
}

export class ReportGenerator {
  private startTime: Date;
  private endTime: Date | null = null;
  private logger: Logger;

  constructor(logger: Logger) {
    this.startTime = new Date();
    this.logger = logger;
  }

  /**
   * Mark the end time
   */
  end() {
    this.endTime = new Date();
  }

  /**
   * Get duration in milliseconds
   */
  getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }

  /**
   * Create report folder with timestamp
   */
  async createReportFolder(baseDir = 'docs/REPORTS'): Promise<string> {
    const timestamp = this.startTime.toISOString().replace(/[:.]/g, '-');
    const reportDir = join(baseDir, timestamp);

    await mkdir(reportDir, { recursive: true });

    return reportDir;
  }

  /**
   * Generate run.json report
   */
  async generateRunReport(
    reportDir: string,
    command: string,
    config: Record<string, unknown>,
    stats: RunReport['stats'],
    outputs: RunReport['outputs']
  ): Promise<void> {
    const logs = this.logger.getLogs();

    const warnings = logs.filter((log) => log.level === 'WARN').map((log) => log.message);

    const errors = logs.filter((log) => log.level === 'ERROR').map((log) => log.message);

    const report: RunReport = {
      startTime: this.startTime.toISOString(),
      endTime: (this.endTime || new Date()).toISOString(),
      duration: this.getDuration(),
      command,
      config,
      stats,
      warnings,
      errors,
      outputs,
    };

    const reportPath = join(reportDir, 'run.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2));

    this.logger.info(`Run report written to: ${reportPath}`);
  }

  /**
   * Generate summary.md report
   */
  async generateSummaryReport(
    reportDir: string,
    command: string,
    stats: RunReport['stats'],
    outputs: RunReport['outputs']
  ): Promise<void> {
    const logs = this.logger.getLogs();
    const warnings = logs.filter((log) => log.level === 'WARN');
    const errors = logs.filter((log) => log.level === 'ERROR');

    const summary = `# Discovery Run Summary

## Run Information
- **Command**: \`${command}\`
- **Start Time**: ${this.startTime.toISOString()}
- **End Time**: ${(this.endTime || new Date()).toISOString()}
- **Duration**: ${(this.getDuration() / 1000).toFixed(2)}s

## Statistics
- **Pages Found**: ${stats.pagesFound}
- **Pages Included**: ${stats.pagesIncluded}
- **Excluded (External)**: ${stats.excludedExternal}
- **Excluded (Duplicates)**: ${stats.excludedDuplicates}
- **Excluded (By Rules)**: ${stats.excludedByRules}

## Outputs
${outputs.manifest ? `- **Manifest**: \`${outputs.manifest}\`` : ''}
${outputs.report ? `- **Report**: \`${outputs.report}\`` : ''}

## Status
${errors.length > 0 ? '❌ **Completed with errors**' : warnings.length > 0 ? '⚠️ **Completed with warnings**' : '✅ **Completed successfully**'}

${warnings.length > 0 ? `## Warnings (${warnings.length})\n${warnings.map((w) => `- ${w.message}`).join('\n')}` : ''}

${errors.length > 0 ? `## Errors (${errors.length})\n${errors.map((e) => `- ${e.message}`).join('\n')}` : ''}
`;

    const summaryPath = join(reportDir, 'summary.md');
    await writeFile(summaryPath, summary);

    this.logger.info(`Summary report written to: ${summaryPath}`);
  }

  /**
   * Write all logs to a file
   */
  async writeLogs(reportDir: string): Promise<void> {
    const logs = this.logger.getLogs();
    const logsPath = join(reportDir, 'logs.json');

    await writeFile(logsPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Generate summary markdown for spec generation
   */
  async generateSummaryMarkdown(reportDir: string, specStats: {
    command: string;
    pagesProcessed: number;
    pagesSucceeded: number;
    totalSections: number;
    totalPatterns: number;
  }): Promise<void> {
    const logs = this.logger.getLogs();
    const warnings = logs.filter((log) => log.level === 'WARN');
    const errors = logs.filter((log) => log.level === 'ERROR');

    const summary = `# Spec Generation Summary

## Run Information
- **Command**: \`${specStats.command}\`
- **Start Time**: ${this.startTime.toISOString()}
- **End Time**: ${(this.endTime || new Date()).toISOString()}
- **Duration**: ${(this.getDuration() / 1000).toFixed(2)}s

## Statistics
- **Pages Processed**: ${specStats.pagesProcessed}
- **Pages Succeeded**: ${specStats.pagesSucceeded}
- **Total Sections**: ${specStats.totalSections}
- **Total Patterns**: ${specStats.totalPatterns}

## Status
${errors.length > 0 ? '❌ **Completed with errors**' : warnings.length > 0 ? '⚠️ **Completed with warnings**' : '✅ **Completed successfully**'}

${warnings.length > 0 ? `## Warnings (${warnings.length})\n${warnings.map((w) => `- ${w.message}`).join('\n')}` : ''}

${errors.length > 0 ? `## Errors (${errors.length})\n${errors.map((e) => `- ${e.message}`).join('\n')}` : ''}
`;

    const summaryPath = join(reportDir, 'summary.md');
    await writeFile(summaryPath, summary);

    this.logger.info(`Summary report written to: ${summaryPath}`);
  }
}

/**
 * Ensure directory exists
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Write JSON file safely
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDir(dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2));
}
