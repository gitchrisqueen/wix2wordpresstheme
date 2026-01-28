/**
 * Assets Generator
 *
 * Copy assets from crawler output and generate asset map
 */

import {
  copyFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'fs';
import { join, basename, dirname } from 'path';
import { createHash } from 'crypto';
import type { Logger } from '../../../crawler/src/lib/logger.js';

interface Manifest {
  pages: Array<{
    url: string;
    path: string;
  }>;
}

const HASH_LENGTH = 8; // Length of MD5 hash to use in filenames

/**
 * Copy assets from crawler output to theme directory
 */
export function copyAssets(
  inDir: string,
  themeDir: string,
  manifest: Manifest,
  logger: Logger
): Map<string, string> {
  const assetMap = new Map<string, string>();
  const assetsDir = join(themeDir, 'assets', 'imported');

  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  let totalCopied = 0;
  let totalFailed = 0;

  for (const page of manifest.pages) {
    // Derive slug from path
    const slug = page.path.replace(/^\//, '').replace(/\//g, '-') || 'home';
    const pageAssetsDir = join(inDir, 'pages', slug, 'assets', 'files');

    if (!existsSync(pageAssetsDir)) {
      logger.debug(`No assets directory for page: ${slug}`);
      continue;
    }

    try {
      const files = readdirSync(pageAssetsDir);

      for (const file of files) {
        const sourcePath = join(pageAssetsDir, file);
        const stat = statSync(sourcePath);

        if (!stat.isFile()) {
          continue;
        }

        try {
          // Generate hash for filename to avoid collisions
          const fileHash = generateFileHash(sourcePath);
          const ext = getFileExtension(file);
          const baseName = basename(file, ext);
          const destFileName = `${baseName}-${fileHash}${ext}`;
          const destPath = join(assetsDir, destFileName);

          // Copy file if it doesn't exist
          if (!existsSync(destPath)) {
            copyFileSync(sourcePath, destPath);
            logger.debug(`Copied asset: ${file} -> ${destFileName}`);
            totalCopied++;
          }

          // Map original URL to theme asset path
          // Try to find original URL in asset list
          const assetListPath = join(dirname(pageAssetsDir), 'asset-list.json');
          if (existsSync(assetListPath)) {
            const assetList = JSON.parse(readFileSync(assetListPath, 'utf-8'));
            const assetEntry = assetList.find((a: any) => a.fileName === file);
            if (assetEntry && assetEntry.url) {
              const themeAssetPath = `assets/imported/${destFileName}`;
              assetMap.set(assetEntry.url, themeAssetPath);
            }
          }

          // Also map by filename as fallback
          const themeAssetPath = `assets/imported/${destFileName}`;
          assetMap.set(file, themeAssetPath);
        } catch (error) {
          logger.warn(`Failed to copy asset: ${file}`, error);
          totalFailed++;
        }
      }
    } catch (error) {
      logger.warn(`Failed to read assets directory for page with path: ${page.path}`, error);
    }
  }

  logger.info(`Copied ${totalCopied} assets (${totalFailed} failed)`);
  return assetMap;
}

/**
 * Generate asset map JSON file
 */
export function generateAssetMap(
  themeDir: string,
  assetMap: Map<string, string>,
  logger: Logger
): void {
  const generatedDir = join(themeDir, '.generated');
  if (!existsSync(generatedDir)) {
    mkdirSync(generatedDir, { recursive: true });
  }

  const assetMapPath = join(generatedDir, 'asset-map.json');

  // Convert Map to object for JSON serialization
  const assetMapObj: Record<string, string> = {};
  for (const [key, value] of assetMap.entries()) {
    assetMapObj[key] = value;
  }

  const assetMapData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    assetCount: assetMap.size,
    assets: assetMapObj,
  };

  writeFileSync(assetMapPath, JSON.stringify(assetMapData, null, 2), 'utf-8');
  logger.info(`Generated asset map: ${assetMapPath} (${assetMap.size} assets)`);
}

/**
 * Generate file hash for unique naming
 */
function generateFileHash(filePath: string): string {
  const content = readFileSync(filePath);
  const hash = createHash('md5').update(content).digest('hex');
  return hash.substring(0, HASH_LENGTH);
}

/**
 * Get file extension including dot
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return fileName.substring(lastDot);
}

/**
 * Copy specific asset and return theme path
 */
export function copySingleAsset(
  sourcePath: string,
  themeDir: string,
  logger: Logger
): string | null {
  const assetsDir = join(themeDir, 'assets', 'imported');

  if (!existsSync(assetsDir)) {
    mkdirSync(assetsDir, { recursive: true });
  }

  if (!existsSync(sourcePath)) {
    logger.warn(`Asset not found: ${sourcePath}`);
    return null;
  }

  try {
    const fileHash = generateFileHash(sourcePath);
    const fileName = basename(sourcePath);
    const ext = getFileExtension(fileName);
    const baseName = basename(fileName, ext);
    const destFileName = `${baseName}-${fileHash}${ext}`;
    const destPath = join(assetsDir, destFileName);

    if (!existsSync(destPath)) {
      copyFileSync(sourcePath, destPath);
      logger.debug(`Copied single asset: ${fileName} -> ${destFileName}`);
    }

    return `assets/imported/${destFileName}`;
  } catch (error) {
    logger.warn(`Failed to copy single asset: ${sourcePath}`, error);
    return null;
  }
}

/**
 * Resolve asset URL to local theme path
 */
export function resolveAssetUrl(
  url: string,
  localAsset: string | null | undefined,
  assetMap: Map<string, string>
): string {
  // Check asset map first
  if (assetMap.has(url)) {
    return assetMap.get(url)!;
  }

  // Use local asset if available
  if (localAsset) {
    return localAsset;
  }

  // Try to find by filename in asset map
  const fileName = basename(url);
  if (assetMap.has(fileName)) {
    return assetMap.get(fileName)!;
  }

  // Fallback to original URL (external asset)
  return url;
}

/**
 * Get asset type from file extension
 */
export function getAssetType(fileName: string): string {
  const ext = getFileExtension(fileName).toLowerCase();

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  const fontExtensions = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
  const cssExtensions = ['.css'];
  const jsExtensions = ['.js', '.mjs'];

  if (imageExtensions.includes(ext)) {
    return 'image';
  } else if (videoExtensions.includes(ext)) {
    return 'video';
  } else if (fontExtensions.includes(ext)) {
    return 'font';
  } else if (cssExtensions.includes(ext)) {
    return 'css';
  } else if (jsExtensions.includes(ext)) {
    return 'javascript';
  }

  return 'other';
}
