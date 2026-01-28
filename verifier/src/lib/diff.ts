/**
 * Image Diff
 * 
 * Compare screenshots and generate diff images
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import type { DiffResult } from '../types.js';

/**
 * Compare two screenshots and generate diff
 */
export function compareScreenshots(
  wixScreenshotPath: string,
  wpScreenshotPath: string,
  diffOutputPath: string,
  threshold: number = 0.1,
): DiffResult {
  // Check if both screenshots exist
  if (!existsSync(wixScreenshotPath)) {
    return {
      wixScreenshot: wixScreenshotPath,
      wpScreenshot: wpScreenshotPath,
      diffScreenshot: diffOutputPath,
      pixelDifference: 0,
      percentDifference: 100,
      passed: false,
      breakpoint: extractBreakpointFromPath(wixScreenshotPath),
    };
  }

  if (!existsSync(wpScreenshotPath)) {
    return {
      wixScreenshot: wixScreenshotPath,
      wpScreenshot: wpScreenshotPath,
      diffScreenshot: diffOutputPath,
      pixelDifference: 0,
      percentDifference: 100,
      passed: false,
      breakpoint: extractBreakpointFromPath(wixScreenshotPath),
    };
  }

  try {
    // Read images
    const img1 = PNG.sync.read(readFileSync(wixScreenshotPath));
    const img2 = PNG.sync.read(readFileSync(wpScreenshotPath));

    // Ensure images have same dimensions
    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);

    // Resize if needed
    let img1Data = img1.data;
    let img2Data = img2.data;

    if (img1.width !== width || img1.height !== height) {
      const resized = resizeImage(img1, width, height);
      img1Data = resized.data;
    }

    if (img2.width !== width || img2.height !== height) {
      const resized = resizeImage(img2, width, height);
      img2Data = resized.data;
    }

    // Create diff image
    const diff = new PNG({ width, height });

    // Compare pixels
    const numDiffPixels = pixelmatch(
      img1Data,
      img2Data,
      diff.data,
      width,
      height,
      {
        threshold,
        includeAA: false,
      },
    );

    // Write diff image
    writeFileSync(diffOutputPath, PNG.sync.write(diff));

    // Calculate percentage
    const totalPixels = width * height;
    const percentDifference = (numDiffPixels / totalPixels) * 100;

    return {
      wixScreenshot: wixScreenshotPath,
      wpScreenshot: wpScreenshotPath,
      diffScreenshot: diffOutputPath,
      pixelDifference: numDiffPixels,
      percentDifference,
      passed: percentDifference <= threshold * 100,
      breakpoint: extractBreakpointFromPath(wixScreenshotPath),
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(`Error comparing screenshots: ${errorMessage}`);

    return {
      wixScreenshot: wixScreenshotPath,
      wpScreenshot: wpScreenshotPath,
      diffScreenshot: diffOutputPath,
      pixelDifference: 0,
      percentDifference: 100,
      passed: false,
      breakpoint: extractBreakpointFromPath(wixScreenshotPath),
    };
  }
}

/**
 * Resize image to target dimensions (pad with white)
 */
function resizeImage(img: PNG, targetWidth: number, targetHeight: number): PNG {
  const resized = new PNG({ width: targetWidth, height: targetHeight });

  // Fill with white
  for (let i = 0; i < resized.data.length; i += 4) {
    resized.data[i] = 255; // R
    resized.data[i + 1] = 255; // G
    resized.data[i + 2] = 255; // B
    resized.data[i + 3] = 255; // A
  }

  // Copy original image
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const srcIdx = (img.width * y + x) << 2;
      const dstIdx = (targetWidth * y + x) << 2;

      if (dstIdx < resized.data.length - 3) {
        resized.data[dstIdx] = img.data[srcIdx];
        resized.data[dstIdx + 1] = img.data[srcIdx + 1];
        resized.data[dstIdx + 2] = img.data[srcIdx + 2];
        resized.data[dstIdx + 3] = img.data[srcIdx + 3];
      }
    }
  }

  return resized;
}

/**
 * Extract breakpoint name from screenshot path
 */
function extractBreakpointFromPath(path: string): string {
  const match = path.match(/-(desktop|mobile|tablet)\.png$/);
  return match ? match[1] : 'unknown';
}

/**
 * Compare multiple screenshot pairs
 */
export function compareMultipleScreenshots(
  pairs: Array<{
    wixPath: string;
    wpPath: string;
    diffPath: string;
    slug: string;
  }>,
  threshold: number,
): Map<string, DiffResult[]> {
  const results = new Map<string, DiffResult[]>();

  for (const pair of pairs) {
    const diffResult = compareScreenshots(
      pair.wixPath,
      pair.wpPath,
      pair.diffPath,
      threshold,
    );

    if (!results.has(pair.slug)) {
      results.set(pair.slug, []);
    }
    results.get(pair.slug)!.push(diffResult);
  }

  return results;
}
