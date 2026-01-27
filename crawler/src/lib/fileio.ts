/**
 * File I/O Utilities
 *
 * Provides safe file operations with atomic writes and directory creation.
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { tmpdir } from 'os';

/**
 * Ensure directory exists, create if needed
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/**
 * Write file atomically (write to temp file, then rename)
 */
export async function writeFileAtomic(filePath: string, content: string | Buffer): Promise<void> {
  await ensureDir(dirname(filePath));

  // Write to temp file first
  const tempPath = join(tmpdir(), `tmp-${Date.now()}-${Math.random().toString(36).substring(2)}`);
  await writeFile(tempPath, content);

  // Move to final location
  const { rename } = await import('fs/promises');
  await rename(tempPath, filePath);
}

/**
 * Write JSON file with formatting
 */
export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeFileAtomic(filePath, content);
}

/**
 * Read JSON file and parse
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Safe write with error handling
 */
export async function safeWrite(
  filePath: string,
  content: string | Buffer,
  onError?: (error: Error) => void
): Promise<boolean> {
  try {
    await writeFileAtomic(filePath, content);
    return true;
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
    return false;
  }
}
