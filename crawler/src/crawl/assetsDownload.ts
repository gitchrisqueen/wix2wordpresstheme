/**
 * Asset Download
 *
 * Downloads discovered assets with deduplication and error handling.
 */

import { writeFile } from 'fs/promises';
import { join, extname } from 'path';
import type { Asset } from '../types/crawl.js';
import { sha256, shortHash } from '../lib/hash.js';
import { ensureDir } from '../lib/fileio.js';

/**
 * Download assets to local directory
 */
export async function downloadAssets(
  assets: Asset[],
  outputDir: string,
  options: {
    baseUrl: string;
    downloadThirdPartyAssets: boolean;
  },
  logger?: { info: (msg: string) => void; error: (msg: string) => void }
): Promise<Asset[]> {
  const assetsDir = join(outputDir, 'files');
  await ensureDir(assetsDir);

  const downloadedAssets: Asset[] = [];
  const urlSeen = new Set<string>();
  const baseOrigin = new URL(options.baseUrl).origin;
  const wixAssetOrigins = new Set([
    'https://static.wixstatic.com',
    'https://static.parastorage.com',
    'https://video.wixstatic.com',
    'https://siteassets.parastorage.com',
    'https://viewer-assets.parastorage.com',
    'https://viewer-apps.parastorage.com',
    'https://pages.parastorage.com',
    'https://staticorigin.wixstatic.com',
  ]);

  for (const asset of assets) {
    // Deduplicate
    if (urlSeen.has(asset.url)) {
      continue;
    }
    urlSeen.add(asset.url);

    const assetOrigin = new URL(asset.url).origin;
    const isThirdParty =
      assetOrigin !== baseOrigin && !wixAssetOrigins.has(assetOrigin);

    if (isThirdParty && !options.downloadThirdPartyAssets) {
      downloadedAssets.push({
        ...asset,
        status: 'third-party',
        error: 'third-party downloads disabled',
      });
      continue;
    }

    try {
      const result = await downloadAsset(asset, assetsDir);
      downloadedAssets.push(result);

      if (result.status === 'downloaded') {
        logger?.info(`Downloaded: ${asset.url}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger?.error(`Failed to download ${asset.url}: ${errorMsg}`);

      downloadedAssets.push({
        ...asset,
        status: 'failed',
        error: errorMsg,
      });
    }
  }

  return downloadedAssets;
}

/**
 * Download single asset
 */
async function downloadAsset(asset: Asset, outputDir: string): Promise<Asset> {
  try {
    const response = await fetch(asset.url);

    if (!response.ok) {
      return {
        ...asset,
        status: 'failed',
        error: `HTTP ${response.status}`,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const hash = sha256(buffer);
    const ext = getFileExtension(asset.url, asset.type);
    const filename = `${shortHash(buffer)}.${ext}`;
    const localPath = join(outputDir, filename);

    await writeFile(localPath, buffer);

    return {
      ...asset,
      localPath: filename, // Store relative path
      sha256: hash,
      sizeBytes: buffer.length,
      status: 'downloaded',
    };
  } catch (error) {
    return {
      ...asset,
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get file extension from URL or asset type
 */
function getFileExtension(url: string, assetType: string): string {
  // Try to get extension from URL
  const urlExt = extname(new URL(url).pathname).slice(1).toLowerCase();

  if (urlExt && urlExt.length <= 5) {
    return urlExt;
  }

  // Fallback to type-based extension
  const typeMap: Record<string, string> = {
    image: 'png',
    font: 'woff2',
    css: 'css',
    js: 'js',
    other: 'bin',
  };

  return typeMap[assetType] || 'bin';
}

/**
 * Calculate total size of assets
 */
export function calculateTotalSize(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + (asset.sizeBytes || 0), 0);
}

/**
 * Get assets by status
 */
export function filterAssetsByStatus(assets: Asset[], status: Asset['status']): Asset[] {
  return assets.filter((a) => a.status === status);
}
